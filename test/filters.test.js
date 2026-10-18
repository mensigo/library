/**
 * @jest-environment node
 */

const {
    groupNotes,
    groupDrafts,
    topics,
    toc,
    shortDate,
    isFresh
} = require('../lib/filters.js');

// Элемент коллекции Eleventy: нужны только filePathStem и data
function item(stem, data) {
    return { filePathStem: stem, data };
}

const collection = [
    item('/notes/python/slots', { title: '__slots__', upd_date: new Date('2026-06-22'), tags: ['Python', 'CPython', 'Память'] }),
    item('/notes/python/async', { title: 'Async', upd_date: new Date('2026-09-26'), tags: ['Python', 'asyncio'] }),
    item('/notes/python/assert', { title: 'Assert', upd_date: new Date('2026-09-26'), tags: ['Python', 'CPython'] }),
    item('/notes/python/python-gil', { title: 'GIL', upd_date: new Date('2026-09-30'), draft: true, tags: ['Python'] }),
    item('/notes/python/unlimited-ints', { title: 'Неограниченные int', upd_date: new Date('2026-08-17'), draft: true, tags: ['Python'] }),
    item('/notes/docker/docker-1', { title: 'История Docker', upd_date: new Date('2026-10-02'), tags: ['Docker'] }),
    item('/notes/index', { title: 'Заметки' }),
    item('/reviews/anime/made-in-abyss', { title: 'Made in Abyss', upd_date: new Date('2026-10-01') })
];

const titles = items => items.map(i => i.data.title);

describe('groupNotes', () => {
    test('только опубликованные заметки своей папки, без черновиков', () => {
        expect(titles(groupNotes(collection, 'python'))).not.toContain('GIL');
        expect(titles(groupNotes(collection, 'docker'))).toEqual(['История Docker']);
    });

    test('по upd_date, новые выше; при равной дате - по title', () => {
        expect(titles(groupNotes(collection, 'python'))).toEqual(['Assert', 'Async', '__slots__']);
    });

    test('порядок не зависит от порядка коллекции', () => {
        const reversed = collection.slice().reverse();
        expect(titles(groupNotes(reversed, 'python'))).toEqual(['Assert', 'Async', '__slots__']);
    });

    test('неизвестная группа и пустая коллекция дают пустой список', () => {
        expect(groupNotes(collection, 'rust')).toEqual([]);
        expect(groupNotes(undefined, 'python')).toEqual([]);
    });
});

describe('groupDrafts', () => {
    test('только черновики своей папки, новые выше', () => {
        expect(titles(groupDrafts(collection, 'python'))).toEqual(['GIL', 'Неограниченные int']);
        expect(groupDrafts(collection, 'docker')).toEqual([]);
    });
});

describe('topics', () => {
    const notes = groupNotes(collection, 'python');

    test('«все» первой, со снятым фильтром и числом всех заметок', () => {
        expect(topics(notes, 'Python')[0]).toEqual({ tag: '', label: 'все', count: 3 });
    });

    test('собственного тега группы нет', () => {
        expect(topics(notes, 'Python').map(t => t.tag)).not.toContain('Python');
    });

    test('по числу заметок, при равенстве - по алфавиту', () => {
        expect(topics(notes, 'Python').slice(1)).toEqual([
            { tag: 'CPython', label: 'CPython', count: 2 },
            { tag: 'Память', label: 'Память', count: 1 },
            { tag: 'asyncio', label: 'asyncio', count: 1 }
        ]);
    });
});

describe('toc', () => {
    const html = [
        '<h2 id="где-живут-атрибуты">Где живут атрибуты <a class="anchor" href="#где-живут-атрибуты" aria-label="Ссылка на раздел">#</a></h2>',
        '<p>текст</p>',
        '<h2 id="code-и-amp"><code>__dict__</code> &amp; слоты <a class="anchor" href="#code-и-amp">#</a></h2>',
        '<h3 id="подраздел">Подраздел</h3>',
        '<div class="finale"><h2 class="u-kicker">Итог</h2>',
        '<h2 class="u-kicker" id="fn-h">Примечания</h2>'
    ].join('\n');

    test('h2 с id, текст без разметки и без якоря', () => {
        expect(toc(html)).toEqual([
            { id: 'где-живут-атрибуты', text: 'Где живут атрибуты' },
            { id: 'code-и-amp', text: '__dict__ & слоты' }
        ]);
    });

    test('.u-kicker (итог, примечания) пропускается', () => {
        expect(toc(html).map(t => t.text)).not.toContain('Примечания');
    });

    test('пустой контент - пустое оглавление', () => {
        expect(toc('')).toEqual([]);
        expect(toc(undefined)).toEqual([]);
    });
});

describe('shortDate', () => {
    test('день и месяц коротко', () => {
        expect(shortDate(new Date('2026-09-26'))).toBe('26 сен');
        expect(shortDate(new Date('2026-05-01'))).toBe('1 мая');
    });

    test('строка тоже подходит', () => {
        expect(shortDate('2026-06-22')).toBe('22 июн');
    });
});

describe('isFresh', () => {
    const now = new Date('2026-10-18T12:00:00Z');

    test('45 дней и меньше - свежая', () => {
        expect(isFresh(new Date('2026-10-18'), now)).toBe(true);
        expect(isFresh(new Date('2026-09-03T12:00:00Z'), now)).toBe(true);
    });

    test('больше 45 дней - нет', () => {
        expect(isFresh(new Date('2026-09-03T11:59:59Z'), now)).toBe(false);
        expect(isFresh(new Date('2026-06-22'), now)).toBe(false);
    });

    test('без даты - нет', () => {
        expect(isFresh(undefined, now)).toBe(false);
    });
});
