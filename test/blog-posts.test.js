/**
 * @jest-environment node
 */

// Посты блога (src/blog/*.md, MIGRATION.md решение 2): адрес поста /blog/<id>/ берется
// из id в front matter, а не из позиции, поэтому id должен быть у каждого
// опубликованного поста и не повторяться - даже у черновиков, иначе черновик при
// публикации займет чужой адрес.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const groups = require('../src/notes/groups.js');

const BLOG = path.resolve(__dirname, '../src/blog');

const posts = fs.readdirSync(BLOG)
    .filter(name => name.endsWith('.md'))
    .map(name => ({ name, data: matter(fs.readFileSync(path.join(BLOG, name), 'utf8')).data }));

test('there is at least one published post (an empty feed builds no /blog/)', () => {
    expect(posts.filter(p => p.data.draft !== true).length).toBeGreaterThan(0);
});

test('no file is named index.md (the feed is index.njk)', () => {
    expect(posts.map(p => p.name)).not.toContain('index.md');
});

test('every post has a title and a date', () => {
    const missing = posts
        .filter(p => !p.data.title || !(p.data.date instanceof Date) || isNaN(p.data.date))
        .map(p => p.name);
    expect(missing).toEqual([]);
});

test('every published post has a positive integer id', () => {
    const bad = posts
        .filter(p => p.data.draft !== true && !(Number.isInteger(p.data.id) && p.data.id > 0))
        .map(p => p.name);
    expect(bad).toEqual([]);
});

test('no two posts share an id (drafts included)', () => {
    const seen = new Map();
    const dupes = [];
    posts.filter(p => p.data.id !== undefined).forEach(p => {
        if (seen.has(p.data.id)) dupes.push(`${p.data.id}: ${seen.get(p.data.id)}, ${p.name}`);
        else seen.set(p.data.id, p.name);
    });
    expect(dupes).toEqual([]);
});

test('no post carries a note group tag (that is a note in the wrong folder)', () => {
    const misplaced = posts
        .filter(p => groups.some(g => (p.data.tags || []).includes(g.tag)))
        .map(p => p.name);
    expect(misplaced).toEqual([]);
});
