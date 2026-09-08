/**
 * @jest-environment jsdom
 */

// Импортируем функции из scripts.js
const {
    applyTheme,
    highlightMatch,
    generateSlug,
    compareValues,
    resolvePalette,
    tocLinkClass,
    PALETTES
} = require('../src/js/scripts.js');

// Простые smoke-тесты для базовых функций

describe('Theme functions', () => {
    beforeEach(() => {
        document.documentElement.removeAttribute('data-theme');
    });

    test('applyTheme устанавливает dark theme', () => {
        applyTheme('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    test('applyTheme устанавливает light theme', () => {
        applyTheme('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
});

describe('Search utility: highlightMatch', () => {
    test('highlightMatch подсвечивает найденный текст', () => {
        const result = highlightMatch('Hello world', 'world');
        expect(result).toBe('Hello <mark>world</mark>');
    });

    test('highlightMatch работает case-insensitive', () => {
        const result = highlightMatch('Hello World', 'world');
        expect(result).toBe('Hello <mark>World</mark>');
    });

    test('highlightMatch возвращает оригинал если query пустой', () => {
        const result = highlightMatch('Hello world', '');
        expect(result).toBe('Hello world');
    });

    test('highlightMatch экранирует спецсимволы regex', () => {
        const result = highlightMatch('Cost: $100', '$100');
        expect(result).toBe('Cost: <mark>$100</mark>');
    });
});

describe('TOC utility: slug generation', () => {
    test('generateSlug создает slug из текста', () => {
        const result = generateSlug('Hello World Test');
        expect(result).toBe('hello-world-test');
    });

    test('generateSlug работает с кириллицей', () => {
        const result = generateSlug('Привет Мир');
        expect(result).toBe('привет-мир');
    });

    test('generateSlug удаляет спецсимволы', () => {
        const result = generateSlug('Hello! World? Test.');
        expect(result).toBe('hello-world-test');
    });

    test('generateSlug схлопывает множественные дефисы', () => {
        const result = generateSlug('Hello   World---Test');
        expect(result).toBe('hello-world-test');
    });
});

describe('Table sorting: value comparison', () => {
    test('compareValues сравнивает числа', () => {
        expect(compareValues('10', '5')).toBeGreaterThan(0);
        expect(compareValues('5', '10')).toBeLessThan(0);
        expect(compareValues('10', '10')).toBe(0);
    });

    test('compareValues сравнивает строки', () => {
        expect(compareValues('apple', 'banana')).toBeLessThan(0);
        expect(compareValues('banana', 'apple')).toBeGreaterThan(0);
    });

    test('compareValues работает с кириллицей', () => {
        expect(compareValues('абрикос', 'банан')).toBeLessThan(0);
        expect(compareValues('банан', 'абрикос')).toBeGreaterThan(0);
    });

    test('compareValues обрабатывает смешанный ввод', () => {
        expect(compareValues('123abc', '456def')).toBeLessThan(0);
    });
});

describe('Palette: resolvePalette', () => {
    test('возвращает светлые цвета для светлой темы', () => {
        const p = resolvePalette('violet', false);
        expect(p.id).toBe('violet');
        expect(p.acc).toBe('#6d28d9');
    });

    test('возвращает тёмные цвета для тёмной темы', () => {
        expect(resolvePalette('violet', true).acc).toBe('#c4a6ff');
    });

    test('прозрачность акцента подобрана под тему', () => {
        expect(resolvePalette('teal', false).accSoft).toBe('#0f766e1a');
        expect(resolvePalette('teal', false).accLine).toBe('#0f766e40');
        expect(resolvePalette('teal', true).accSoft).toBe('#5eead417');
        expect(resolvePalette('teal', true).accLine).toBe('#5eead43d');
    });

    test('неизвестный id откатывается к первой палитре', () => {
        expect(resolvePalette('нет-такой', false).id).toBe(PALETTES[0].id);
        expect(resolvePalette(null, false).id).toBe('teal');
    });

    test('цвет строкового литерала едет вместе с акцентом', () => {
        expect(resolvePalette('ochre', false).str).toBe('#4d7c0f');
        expect(resolvePalette('teal', false).str).toBe('#0e7490');
    });
});

describe('TOC: tocLinkClass', () => {
    test('уровень заголовка превращается в класс', () => {
        expect(tocLinkClass('H2')).toBe('lvl-2');
        expect(tocLinkClass('h3')).toBe('lvl-3');
        expect(tocLinkClass('H4')).toBe('lvl-4');
    });

    test('нераспознанный тег считается вторым уровнем', () => {
        expect(tocLinkClass('DIV')).toBe('lvl-2');
    });
});
