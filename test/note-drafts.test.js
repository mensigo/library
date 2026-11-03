/**
 * @jest-environment node
 */

// Где лежит черновик (MIGRATION.md, решение 4): с тегом группы - в ее папке notes/<id>/
// с draft: true, тогда он виден в блоке embers на странице группы; без тега группы -
// в src/drafts/, где он не собирается. Ошибка в любую сторону молча прячет черновик.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const groups = require('../src/notes/groups.js');

const SRC = path.resolve(__dirname, '../src');

// [путь от src/, теги] для каждого .md в папке
function notesIn(dir) {
    const full = path.join(SRC, dir);
    if (!fs.existsSync(full)) return [];
    return fs.readdirSync(full)
        .filter(name => name.endsWith('.md'))
        .map(name => {
            const file = path.join(full, name);
            return [path.join(dir, name), matter(fs.readFileSync(file, 'utf8')).data.tags || []];
        });
}

test('no file in src/drafts/ has a note group tag', () => {
    const misplaced = notesIn('drafts')
        .filter(([, tags]) => groups.some(g => tags.includes(g.tag)))
        .map(([file]) => file);
    expect(misplaced).toEqual([]);
});

describe.each(groups.map(g => [g.id, g]))('src/notes/%s/', (id, group) => {
    test('folder exists', () => {
        expect(fs.existsSync(path.join(SRC, 'notes', id))).toBe(true);
    });

    test(`every file has the tag ${group.tag}`, () => {
        const untagged = notesIn(path.join('notes', id))
            .filter(([, tags]) => !tags.includes(group.tag))
            .map(([file]) => file);
        expect(untagged).toEqual([]);
    });
});
