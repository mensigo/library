/**
 * @jest-environment node
 */

// pathPrefix reaches templates, not links written in markdown: in production a root
// link like [x](/notes/python/disassemble/) loses /library and 404s, and links.test.js
// can't see it because it runs on the unprefixed build. Link between pages relatively
// (../disassemble/), or through {{ pathPrefix }} in raw HTML.
//
// src/blog/ is the other way round: a post renders both on the feed (/blog/) and on its
// own page (/blog/<id>/), so a relative link can't work at both depths. Posts link from
// the root, and the templates prefix those links (rootLinks filter).

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../src');

const BLOG = path.join(SRC, 'blog');

// src/drafts/ is never built, so its links can't break the site; src/blog/ has its own check
const SKIP = new Set([path.join(SRC, 'drafts'), BLOG]);

function collectMarkdown(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!SKIP.has(full)) files.push(...collectMarkdown(full));
        } else if (entry.name.endsWith('.md')) files.push(full);
    }
    return files;
}

// inline [text](/…), reference [id]: /…, raw href="/…" / src="/…"; //host links are external
const ROOT_LINK = /\]\(\s*<?\/(?!\/)|^\s*\[[^\]]+\]:\s*<?\/(?!\/)|\b(?:href|src)="\/(?!\/)/;

// inline [text](../…) or (./…), reference [id]: ../…, raw href="../…" / src="./…"
const RELATIVE_LINK = /\]\(\s*<?\.\.?\/|^\s*\[[^\]]+\]:\s*<?\.\.?\/|\b(?:href|src)="\.\.?\//;

// file:line of every line outside code that matches the pattern
function linesMatching(files, pattern) {
    const found = [];
    for (const file of files) {
        let fenced = false;
        fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
            if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
            if (!fenced && pattern.test(line.replace(/`[^`]*`/g, ''))) {
                found.push(`${path.relative(SRC, file)}:${i + 1}  ${line.trim()}`);
            }
        });
    }
    return found;
}

test('no root-relative links in markdown', () => {
    const found = linesMatching(collectMarkdown(SRC), ROOT_LINK);

    if (found.length > 0) {
        console.error('\nRoot links in markdown (use ../relative/ links):\n' + found.map(l => '  ' + l).join('\n'));
    }
    expect(found).toEqual([]);
});

test('no relative links in blog posts', () => {
    const found = fs.existsSync(BLOG) ? linesMatching(collectMarkdown(BLOG), RELATIVE_LINK) : [];

    if (found.length > 0) {
        console.error('\nRelative links in blog posts (use /root/ links):\n' + found.map(l => '  ' + l).join('\n'));
    }
    expect(found).toEqual([]);
});
