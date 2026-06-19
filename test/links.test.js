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

function resolveTarget(href) {
  // strip query string and fragment
  const clean = href.split('?')[0].split('#')[0];
  if (!clean) return null;

  const abs = path.join(SITE_DIR, clean);

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
      if (!resolveTarget(href)) {
        broken.push(`${page} → ${href}`);
      }
    }
  }

  if (broken.length > 0) {
    console.error('\nBroken links found:\n' + broken.map(l => '  ' + l).join('\n'));
  }
  expect(broken).toHaveLength(0);
});
