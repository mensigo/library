/**
 * @jest-environment node
 */

// Группа заметок через ее интерфейс (lib/note-group.js): строки, номера, теги, темы,
// черновики, свежесть, rowOf, число в комнате. Группы - настоящие, из notes/groups.js.

const { noteGroup, noteCount, groupIdOf } = require('../lib/note-group.js');
const groups = require('../src/notes/groups.js');

// Элемент коллекции Eleventy: нужны filePathStem, url и data
function item(stem, data) {
    return { filePathStem: stem, url: stem + '/', data };
}

const collection = [
    item('/notes/python/slots', { title: '__slots__', upd_date: new Date('2026-06-22'), tags: ['Python', 'CPython', 'Память'] }),
    item('/notes/python/async', { title: 'Async', upd_date: new Date('2026-09-26'), tags: ['Python', 'asyncio'] }),
    item('/notes/python/assert', { title: 'Assert', upd_date: new Date('2026-09-26'), tags: ['Python', 'CPython'] }),
    item('/notes/python/python-gil', { title: 'GIL', upd_date: new Date('2026-09-30'), draft: true, tags: ['Python', 'CPython'] }),
    item('/notes/python/unlimited-ints', { title: 'Неограниченные int', upd_date: new Date('2026-08-17'), draft: true, tags: ['Python'] }),
    item('/notes/docker/docker-history', { title: 'История Docker', upd_date: new Date('2026-10-02'), tags: ['Docker'] }),
    item('/notes/index', { title: 'Заметки' }),
    item('/cinema/index', { title: 'Cinema', upd_date: new Date('2026-10-01') })
];

const NOW = new Date('2026-10-18T12:00:00Z');
const python = noteGroup(collection, 'python', NOW);
const titles = rows => rows.map(r => r.note.data.title);

describe('rows', () => {
    test('только опубликованные заметки своей папки, без черновиков', () => {
        expect(titles(python.rows)).not.toContain('GIL');
        expect(titles(noteGroup(collection, 'docker', NOW).rows)).toEqual(['История Docker']);
    });

    test('по upd_date, новые выше; при равной дате - по title', () => {
        expect(titles(python.rows)).toEqual(['Assert', 'Async', '__slots__']);
    });

    test('порядок не зависит от порядка коллекции', () => {
        const reversed = noteGroup(collection.slice().reverse(), 'python', NOW);
        expect(titles(reversed.rows)).toEqual(['Assert', 'Async', '__slots__']);
    });

    test('номер строки - позиция в этом порядке, с 1', () => {
        expect(python.rows.map(r => r.n)).toEqual([1, 2, 3]);
    });

    test('теги строки - без собственного тега группы', () => {
        expect(python.rows.map(r => r.tags)).toEqual([['CPython'], ['asyncio'], ['CPython', 'Память']]);
        expect(noteGroup(collection, 'docker', NOW).rows[0].tags).toEqual([]);
    });
});

describe('fresh', () => {
    const at = date => noteGroup([item('/notes/python/x', { title: 'x', upd_date: date })], 'python', NOW).rows[0].fresh;

    test('45 дней и меньше - свежая', () => {
        expect(at(new Date('2026-10-18'))).toBe(true);
        expect(at(new Date('2026-09-03T12:00:00Z'))).toBe(true);
    });

    test('больше 45 дней - нет', () => {
        expect(at(new Date('2026-09-03T11:59:59Z'))).toBe(false);
        expect(at(new Date('2026-06-22'))).toBe(false);
    });

    test('без даты - нет', () => {
        expect(at(undefined)).toBe(false);
    });
});

describe('drafts', () => {
    test('только черновики своей папки, новые выше', () => {
        expect(titles(python.drafts)).toEqual(['GIL', 'Неограниченные int']);
        expect(noteGroup(collection, 'docker', NOW).drafts).toEqual([]);
    });

    test('та же форма, что у строки: без номера, не свежие, теги без тега группы', () => {
        expect(python.drafts[0]).toMatchObject({ n: null, fresh: false, tags: ['CPython'] });
    });
});

describe('topics', () => {
    test('«все» первой, со снятым фильтром и числом всех строк', () => {
        expect(python.topics[0]).toEqual({ tag: '', label: 'все', count: 3 });
    });

    test('собственного тега группы нет, черновики не считаются', () => {
        expect(python.topics.map(t => t.tag)).not.toContain('Python');
        expect(python.topics.find(t => t.tag === 'CPython').count).toBe(2);
    });

    test('по числу заметок, при равенстве - по алфавиту', () => {
        expect(python.topics.slice(1)).toEqual([
            { tag: 'CPython', label: 'CPython', count: 2 },
            { tag: 'Память', label: 'Память', count: 1 },
            { tag: 'asyncio', label: 'asyncio', count: 1 }
        ]);
    });
});

describe('rowOf', () => {
    test('опубликованная заметка - ее строка с номером', () => {
        expect(python.rowOf('/notes/python/async/')).toMatchObject({ n: 2, tags: ['asyncio'] });
    });

    test('черновик - без номера', () => {
        expect(python.rowOf('/notes/python/python-gil/')).toMatchObject({ n: null, tags: ['CPython'] });
    });

    test('чужая или неизвестная страница - undefined', () => {
        expect(python.rowOf('/notes/docker/docker-history/')).toBeUndefined();
        expect(python.rowOf('/nope/')).toBeUndefined();
    });
});

describe('неизвестная группа и пустая коллекция', () => {
    test('пустой вид, а не ошибка', () => {
        const rust = noteGroup(collection, 'rust', NOW);
        expect(rust.group).toBeUndefined();
        expect(rust.rows).toEqual([]);
        expect(rust.drafts).toEqual([]);
        expect(rust.topics).toEqual([{ tag: '', label: 'все', count: 0 }]);
        expect(noteGroup(undefined, 'python', NOW).rows).toEqual([]);
    });

    test('group - запись из groups.js', () => {
        expect(python.group).toBe(groups.find(g => g.id === 'python'));
    });
});

describe('noteCount', () => {
    test('опубликованные заметки открытых групп', () => {
        const enabled = groups.filter(g => g.enabled).map(g => g.id);
        const expected = (enabled.includes('python') ? 3 : 0) + (enabled.includes('docker') ? 1 : 0);
        expect(noteCount(collection)).toBe(expected);
    });
});

describe('groupIdOf', () => {
    test('notes/<id>/<file> → id', () => {
        expect(groupIdOf('/notes/python/slots')).toBe('python');
    });

    test('страницы уровнем выше и вне notes/ - без группы', () => {
        expect(groupIdOf('/notes/index')).toBeUndefined();
        expect(groupIdOf('/notes/group')).toBeUndefined();
        expect(groupIdOf('/cinema/index')).toBeUndefined();
        expect(groupIdOf(undefined)).toBeUndefined();
    });
});
