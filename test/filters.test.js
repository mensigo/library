/**
 * @jest-environment node
 */

const {
    shortDate,
    blogPosts,
    longDate,
    rootLinks,
    beforeMore
} = require('../lib/filters.js');

// Элемент коллекции Eleventy: нужны только filePathStem и data. Заметки здесь - чтобы
// проверить, что лента их не берет; правила групп - test/note-group.test.js
function item(stem, data) {
    return { filePathStem: stem, data };
}

const collection = [
    item('/notes/python/slots', { title: '__slots__', upd_date: new Date('2026-06-22'), tags: ['Python', 'CPython', 'Память'] }),
    item('/notes/python/async', { title: 'Async', upd_date: new Date('2026-09-26'), tags: ['Python', 'asyncio'] }),
    item('/notes/python/assert', { title: 'Assert', upd_date: new Date('2026-09-26'), tags: ['Python', 'CPython'] }),
    item('/notes/python/python-gil', { title: 'GIL', upd_date: new Date('2026-09-30'), draft: true, tags: ['Python'] }),
    item('/notes/python/unlimited-ints', { title: 'Неограниченные int', upd_date: new Date('2026-08-17'), draft: true, tags: ['Python'] }),
    item('/notes/docker/docker-history', { title: 'История Docker', upd_date: new Date('2026-10-02'), tags: ['Docker'] }),
    item('/notes/index', { title: 'Заметки' }),
    item('/cinema/index', { title: 'Cinema', upd_date: new Date('2026-10-01') })
];

const titles = items => items.map(i => i.data.title);

describe('shortDate', () => {
    test('день и месяц коротко', () => {
        expect(shortDate(new Date('2026-09-26'))).toBe('26 сен');
        expect(shortDate(new Date('2026-05-01'))).toBe('1 мая');
    });

    test('строка тоже подходит', () => {
        expect(shortDate('2026-06-22')).toBe('22 июн');
    });
});

describe('blogPosts', () => {
    const blog = [
        item('/blog/hello', { title: 'Привет', date: new Date('2026-11-24') }),
        item('/blog/keyboard', { title: 'Клавиатура', date: new Date('2026-12-01'), tags: ['железо'] }),
        item('/blog/apple', { title: 'Яблоко', date: new Date('2026-12-01') }),
        item('/blog/alpha', { title: 'Альфа', date: new Date('2026-12-01') }),
        item('/blog/wip', { title: 'Черновик', date: new Date('2026-12-10'), draft: true }),
        item('/blog/index', { title: 'Блог' }),
        ...collection
    ];

    test('только опубликованные посты из blog/, без ленты и заметок', () => {
        const got = titles(blogPosts(blog));
        expect(got).not.toContain('Черновик');
        expect(got).not.toContain('Блог');
        expect(got).not.toContain('Assert');
        expect(got).toHaveLength(4);
    });

    test('по date, новые выше; при равной дате - по title', () => {
        expect(titles(blogPosts(blog))).toEqual(['Альфа', 'Клавиатура', 'Яблоко', 'Привет']);
        expect(titles(blogPosts(blog.slice().reverse()))).toEqual(['Альфа', 'Клавиатура', 'Яблоко', 'Привет']);
    });

    test('пустая коллекция', () => {
        expect(blogPosts(undefined)).toEqual([]);
    });
});

describe('longDate', () => {
    const now = new Date('2026-11-24T12:00:00Z');

    test('этот год - без года, месяц в родительном падеже', () => {
        expect(longDate(new Date('2026-11-24'), now)).toBe('24 ноября');
        expect(longDate('2026-05-01', now)).toBe('1 мая');
    });

    test('другой год - с годом', () => {
        expect(longDate(new Date('2025-11-24'), now)).toBe('24 ноября 2025');
    });

    test('полночь UTC остается своим днем', () => {
        expect(longDate(new Date('2026-03-01T00:00:00Z'), now)).toBe('1 марта');
        expect(longDate(new Date('2026-01-01T00:00:00Z'), new Date('2026-06-01T00:00:00Z'))).toBe('1 января');
    });
});

describe('rootLinks', () => {
    const html = '<a href="/notes/python/slots/">x</a><img src="/images/blog/x.avif">'
        + '<a href="//host/x">h</a><a href="#top">t</a><a href="https://e.com/">e</a>'
        + '<a href="../notes/">r</a><img src="x.png">';

    test('корневые href и src получают префикс', () => {
        const out = rootLinks(html, '/library');
        expect(out).toContain('href="/library/notes/python/slots/"');
        expect(out).toContain('src="/library/images/blog/x.avif"');
    });

    test('//host, якорь, https: и относительные ссылки не трогает', () => {
        const out = rootLinks(html, '/library');
        expect(out).toContain('href="//host/x"');
        expect(out).toContain('href="#top"');
        expect(out).toContain('href="https://e.com/"');
        expect(out).toContain('href="../notes/"');
        expect(out).toContain('src="x.png"');
    });

    test('без префикса (dev) html не меняется', () => {
        expect(rootLinks(html, '')).toBe(html);
    });
});

describe('beforeMore', () => {
    test('без метки - весь html, cut false', () => {
        expect(beforeMore('<p>a</p>')).toEqual({ html: '<p>a</p>', cut: false });
    });

    test('с меткой - все до нее, cut true', () => {
        expect(beforeMore('<p>a</p>\n<!-- more -->\n<p>b</p>')).toEqual({ html: '<p>a</p>\n', cut: true });
    });

    test('режет только первая метка', () => {
        const got = beforeMore('<p>a</p><!-- more --><p>b</p><!--more--><p>c</p>');
        expect(got.html).toBe('<p>a</p>');
    });
});
