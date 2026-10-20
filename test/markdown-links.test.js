/**
 * @jest-environment node
 */

// pathPrefix reaches templates, not links written in markdown: in production a root
// link like [x](/notes/python/disassemble/) loses /library and 404s, and links.test.js
// can't see it because it runs on the unprefixed build. Link between pages relatively
// (../disassemble/), or through {{ pathPrefix }} in raw HTML.

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../src');

// src/drafts/ is never built, so its links can't break the site
const SKIP = new Set([path.join(SRC, 'drafts')]);

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

test('no root-relative links in markdown', () => {
    const found = [];

    for (const file of collectMarkdown(SRC)) {
        let fenced = false;
        fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
            if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
            if (!fenced && ROOT_LINK.test(line.replace(/`[^`]*`/g, ''))) {
                found.push(`${path.relative(SRC, file)}:${i + 1}  ${line.trim()}`);
            }
        });
    }

    if (found.length > 0) {
        console.error('\nRoot links in markdown (use ../relative/ links):\n' + found.map(l => '  ' + l).join('\n'));
    }
    expect(found).toEqual([]);
});
