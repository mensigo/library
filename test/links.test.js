const fs = require('fs');
const path = require('path');

const SITE_DIR = path.resolve(__dirname, '../_site');

function collectHtmlFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectHtmlFiles(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function extractInternalLinks(html) {
  const links = [];
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    // skip external, mailto, anchor-only, data URIs
    if (/^(https?:|mailto:|#|data:)/.test(href)) continue;
    links.push(href);
  }
  return links;
}

// src="…" outside HTML comments (Bebop keeps commented-out carousels with src="")
function extractSrcs(html) {
  const srcs = [];
  const re = /\ssrc="([^"]*)"/g;
  const text = html.replace(/<!--[\s\S]*?-->/g, '');
  let m;
  while ((m = re.exec(text)) !== null) {
    if (/^(https?:|data:)/.test(m[1])) continue;
    srcs.push(m[1]);
  }
  return srcs;
}

// url(…) outside CSS comments, quoted or not
function extractUrls(css) {
  const urls = [];
  const re = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"]*))\s*\)/g;
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let m;
  while ((m = re.exec(text)) !== null) {
    const url = (m[1] ?? m[2] ?? m[3]).trim();
    if (/^(https?:|data:|#)/.test(url)) continue;
    urls.push(url);
  }
  return urls;
}

// src/images/ comes from the images repo; a local build without it copied in
// has only the committed logo.png, so image references are skipped then
const HAS_IMAGES = fs.existsSync(path.join(SITE_DIR, 'images/world'));

function isSkippedImage(target) {
  return !HAS_IMAGES && /(^|\/)images\//.test(target) && !/logo\.png$/.test(target);
}

function resolveTarget(href, pageFile) {
  // strip query string and fragment
  const clean = href.split('?')[0].split('#')[0];
  if (!clean) return null;

  // root-relative hrefs resolve from _site/, relative ones (hand-written
  // /cinema/ pages) from the directory of the page that links them
  const abs = clean.startsWith('/')
    ? path.join(SITE_DIR, clean)
    : path.resolve(path.dirname(pageFile), clean);

  // exact file match
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  // directory with index.html
  const index = path.join(abs, 'index.html');
  if (fs.existsSync(index)) return index;

  return null;
}

// ── tests ─────────────────────────────────────────────────────────────────────

test('_site directory exists (run `npm run build` first)', () => {
  expect(fs.existsSync(SITE_DIR)).toBe(true);
});

test('no dangling internal links across all pages', () => {
  if (!fs.existsSync(SITE_DIR)) return; // guard: skip if site not built

  const htmlFiles = collectHtmlFiles(SITE_DIR);
  expect(htmlFiles.length).toBeGreaterThan(0);

  const broken = [];

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const links = extractInternalLinks(html);
    const page = '/' + path.relative(SITE_DIR, file);

    for (const href of links) {
      if (!resolveTarget(href, file)) {
        broken.push(`${page} → ${href}`);
      }
    }
  }

  if (broken.length > 0) {
    console.error('\nBroken links found:\n' + broken.map(l => '  ' + l).join('\n'));
  }
  expect(broken).toHaveLength(0);
});

test('no missing src="…" files across all pages', () => {
  if (!fs.existsSync(SITE_DIR)) return;

  const broken = [];

  for (const file of collectHtmlFiles(SITE_DIR)) {
    const html = fs.readFileSync(file, 'utf8');
    const page = '/' + path.relative(SITE_DIR, file);

    for (const src of extractSrcs(html)) {
      if (isSkippedImage(src)) continue;
      if (!src || !resolveTarget(src, file)) broken.push(`${page} → src="${src}"`);
    }
  }

  if (broken.length > 0) {
    console.error('\nMissing src files:\n' + broken.map(l => '  ' + l).join('\n'));
  }
  expect(broken).toHaveLength(0);
});

// The pitch's group pages had rows with href="#"; the dangling-link test skips
// anchors, so a row that links nowhere needs its own check
test('no a.row with an empty or "#" href in notes', () => {
  const notesDir = path.join(SITE_DIR, 'notes');
  if (!fs.existsSync(notesDir)) return;

  const broken = [];

  for (const file of collectHtmlFiles(notesDir)) {
    const html = fs.readFileSync(file, 'utf8');
    const page = '/' + path.relative(SITE_DIR, file);

    for (const [tag] of html.matchAll(/<a\b[^>]*>/g)) {
      if (!/\bclass="(?:[^"]*\s)?row(?:\s[^"]*)?"/.test(tag)) continue;
      const href = (tag.match(/\bhref="([^"]*)"/) || [])[1];
      if (href === undefined || href === '' || href.startsWith('#')) broken.push(`${page} → ${tag}`);
    }
  }

  if (broken.length > 0) {
    console.error('\nRows without a link:\n' + broken.map(l => '  ' + l).join('\n'));
  }
  expect(broken).toHaveLength(0);
});

test('no missing url(…) files in world and cinema bundles', () => {
  if (!fs.existsSync(SITE_DIR)) return;

  const sheets = ['world', 'cinema']
    .map(dir => path.join(SITE_DIR, dir))
    .filter(dir => fs.existsSync(dir))
    .flatMap(dir => fs.readdirSync(dir)
      .filter(name => name.endsWith('.css'))
      .map(name => path.join(dir, name)));
  expect(sheets.length).toBeGreaterThan(0);

  const broken = [];

  for (const file of sheets) {
    const css = fs.readFileSync(file, 'utf8');
    const sheet = '/' + path.relative(SITE_DIR, file);

    for (const url of extractUrls(css)) {
      const target = path.resolve(path.dirname(file), url.split(/[?#]/)[0]);
      if (isSkippedImage(path.relative(SITE_DIR, target))) continue;
      if (!fs.existsSync(target)) broken.push(`${sheet} → url(${url})`);
    }
  }

  if (broken.length > 0) {
    console.error('\nMissing url() files:\n' + broken.map(l => '  ' + l).join('\n'));
  }
  expect(broken).toHaveLength(0);
});
