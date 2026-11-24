/**
 * @jest-environment node
 */

const markdownIt = require('markdown-it');
const highlightOptions = require('@11ty/eleventy-plugin-syntaxhighlight/src/markdownSyntaxHighlightOptions');
const { amend, toc } = require('../lib/markdown.js');

// markdown-it так, как его собирает Eleventy: опции по умолчанию ({ html: true }),
// highlighter из плагина подсветки (addMarkdownHighlighter), затем amendLibrary.
function render(src) {
    const md = markdownIt({ html: true });
    md.set({ highlight: highlightOptions() });
    amend(md);
    return md.render(src);
}

const lines = (...rows) => rows.join('\n') + '\n';

describe('callouts', () => {
    test('заголовок по умолчанию', () => {
        const html = render(lines('::: note', 'Текст', ':::'));
        expect(html).toContain('<div class="callout"><div class="callout__ico">');
        expect(html).toContain('<div class="callout__body"><b>Заметка</b>');
        expect(html).toContain('<p>Текст</p>');
    });

    test('свой заголовок после ключевого слова', () => {
        const html = render(lines('::: warn Свой заголовок', 'Текст', ':::'));
        expect(html).toContain('<b>Свой заголовок</b>');
        expect(html).not.toContain('Осторожно');
    });

    test('заголовок экранируется', () => {
        const html = render(lines('::: tip <i>&</i>', 'Текст', ':::'));
        expect(html).toContain('<b>&lt;i&gt;&amp;&lt;/i&gt;</b>');
    });

    test('класс-модификатор', () => {
        expect(render(lines('::: tip', 'x', ':::'))).toContain('<div class="callout callout--tip">');
        expect(render(lines('::: warn', 'x', ':::'))).toContain('<div class="callout callout--warn">');
        expect(render(lines('::: stop', 'x', ':::'))).toContain('<div class="callout callout--stop"><div class="callout__ico">');
        expect(render(lines('::: stop', 'x', ':::'))).toContain('<b>Грабли</b>');
    });
});

describe('::: out', () => {
    test('без ярлыка - stdout, слово «вывод» только для скринридеров', () => {
        const html = render(lines('::: out', '42', ':::'));
        expect(html).toContain('<div class="code__out"><b aria-hidden="true">stdout</b><span class="u-sr">вывод</span>');
        expect(html).toContain('<p>42</p>');
    });

    test('свой ярлык', () => {
        const html = render(lines('::: out stderr', 'boom', ':::'));
        expect(html).toContain('<div class="code__out"><b>stderr</b>');
        expect(html).not.toContain('stdout');
    });

    test('фенс внутри - без шапки, отступы целы', () => {
        const html = render(lines('::: out', '```text', '  1 LOAD_CONST', '```', ':::'));
        expect(html).not.toContain('code__bar');
        expect(html).toContain('  1 LOAD_CONST');
        expect(html).toContain('<pre class="language-text">');
    });

    test('словарь внутри не съедается markdown-it-attrs (разделитель {:)', () => {
        const html = render(lines('::: out', "{'a': 1}", ':::'));
        expect(html).toContain('<p>{\'a\': 1}</p>');
    });
});

describe('fence', () => {
    const html = render(lines('```python/1 slots.py @3.12', 'a = 1', 'b = 2', '```'));

    test('шапка: точки, имя файла, язык, версия, копирование', () => {
        expect(html).toContain('<div class="code"><div class="code__bar">');
        expect(html).toContain('<span class="code__dots" aria-hidden="true"><i></i><i></i><i></i></span>');
        expect(html).toContain('<span class="code__name">slots.py</span>');
        expect(html).toContain('<span class="code__lang">python</span>');
        expect(html).toContain('<span class="code__lang code__ver">3.12</span>');
        expect(html).toContain('<button class="copy" type="button">');
        expect(html).toContain('<span class="copy__label">Копировать</span>');
    });

    test('подсветка строки по номеру (с нуля)', () => {
        expect(html).toMatch(/<mark class="highlight-line highlight-line-active">b <span class="token operator">=<\/span>/);
        expect(html).not.toMatch(/highlight-line-active">a /);
    });

    test('без инфо-строки - без шапки', () => {
        const plain = render(lines('```', 'x', '```'));
        expect(plain).not.toContain('code__bar');
        expect(plain).not.toContain('<div class="code">');
        expect(plain).toContain('<pre><code>x');
    });

    test('//2 - строки с ошибкой', () => {
        const err = render(lines('```python//2', 'a', 'b', 'c', '```'));
        expect(err).toContain('<del class="highlight-line highlight-line-remove">c</del>');
        expect(err).toContain('<span class="code__lang">python</span>');
    });
});

describe('блоки', () => {
    test('split', () => {
        const html = render(lines('::: split', '```py', 'a', '```', '```py', 'b', '```', ':::'));
        expect(html).toMatch(/^<div class="split">\n<div class="code">/);
        expect(html.match(/<div class="code">/g)).toHaveLength(2);
    });

    test('verdict с yes/no: заголовки по умолчанию', () => {
        const html = render(lines(':::: verdict', '::: yes', '- a', ':::', '::: no', '- b', ':::', '::::'));
        expect(html).toContain('<div class="verdict">');
        expect(html).toMatch(/<div class="verdict__col verdict--yes"><h4><svg[^>]*>.*<\/svg>Стоит брать<\/h4>/);
        expect(html).toMatch(/<div class="verdict__col verdict--no"><h4><svg[^>]*>.*<\/svg>Не стоит<\/h4>/);
    });

    test('verdict с yes/no: свои заголовки', () => {
        const html = render(lines(':::: verdict', '::: yes Берите', '- a', ':::', '::: no Мимо', '- b', ':::', '::::'));
        expect(html).toMatch(/<\/svg>Берите<\/h4>/);
        expect(html).toMatch(/<\/svg>Мимо<\/h4>/);
        expect(html).not.toContain('Стоит брать');
    });

    test('finale: «Итог» по умолчанию и свой заголовок, h2.u-kicker', () => {
        expect(render(lines('::: finale', 'x', ':::'))).toContain('<div class="finale"><h2 class="u-kicker">Итог</h2>');
        expect(render(lines('::: finale Вывод', 'x', ':::'))).toContain('<div class="finale"><h2 class="u-kicker">Вывод</h2>');
    });

    test('more: details/summary', () => {
        const html = render(lines('::: more Как это устроено', 'x', ':::'));
        expect(html).toContain('<details class="more"><summary>Как это устроено</summary><div class="more__body">');
        expect(html).toContain('</div></details>');
        expect(render(lines('::: more', 'x', ':::'))).toContain('<summary>Подробнее</summary>');
    });
});

describe('сноски', () => {
    const html = render(lines('Текст[^1].', '', '[^1]: Пояснение.'));

    test('[^1] - ссылка .fnref', () => {
        expect(html).toContain('<a class="fnref" href="#fn1" id="fnref1">1</a>');
    });

    test('.notes-block с h2.u-kicker#fn-h', () => {
        expect(html).toContain('<section class="notes-block" aria-labelledby="fn-h"><h2 class="u-kicker" id="fn-h">Примечания</h2><ol>');
        expect(html).toContain('<li id="fn1">');
        expect(html).toContain('<a class="back" href="#fnref1" aria-label="Вернуться к тексту">↩</a>');
    });
});

describe('термины', () => {
    test('*[CNCF]: … - abbr.term с data-tip, без title', () => {
        const html = render(lines('Проект CNCF.', '', '*[CNCF]: Cloud Native "Computing" Foundation'));
        expect(html).toContain('<abbr class="term" tabindex="0" data-tip="Cloud Native &quot;Computing&quot; Foundation">CNCF</abbr>');
        expect(html).not.toContain('title=');
    });
});

describe('картинки', () => {
    test('одна в абзаце - figure с меткой и текстом подписи', () => {
        const html = render('![схема](x.png "Схема | текст")\n');
        expect(html).toContain('<figure class="fig"><div class="fig__frame"><img src="x.png" alt="схема" title="Схема | текст"></div>');
        expect(html).toContain('<figcaption><b>Схема</b><span>текст</span></figcaption></figure>');
        expect(html).not.toContain('<p>');
    });

    test('простая подпись', () => {
        const html = render('![a](x.png "Просто подпись")\n');
        expect(html).toContain('<figcaption>Просто подпись</figcaption></figure>');
    });

    test('без подписи - без figcaption', () => {
        const html = render('![a](x.png)\n');
        expect(html).toContain('<figure class="fig">');
        expect(html).not.toContain('figcaption');
    });

    test('картинка внутри текста - обычный абзац', () => {
        const html = render('Смотри ![a](x.png "п") тут\n');
        expect(html).toMatch(/^<p>Смотри <img/);
        expect(html).not.toContain('figure');
    });
});

describe('таблицы', () => {
    const table = lines('| a | b |', '|---|---|', '| 1 | 2 |');

    test('обертка .tablewrap и table.tbl', () => {
        const html = render(table);
        expect(html).toMatch(/^<div class="tablewrap"><table class="tbl">\n<thead>/);
        expect(html).toMatch(/<\/table><\/div>\n$/);
    });

    test('{:.sortable} после пустой строки - класс таблицы', () => {
        const html = render(table + '\n{:.sortable}\n');
        expect(html).toContain('<div class="tablewrap"><table class="tbl sortable">\n');
        expect(html).not.toContain('{:');
    });

    test('другие классы и атрибуты тоже проходят', () => {
        const html = render(table + '\n{:#scores data-x="1" .wide}\n');
        expect(html).toContain('<div class="tablewrap"><table class="tbl wide" id="scores" data-x="1">\n');
    });

    test('{:.sortable} без пустой строки - лишняя пустая строка таблицы, а не класс', () => {
        const html = render(table + '{:.sortable}\n');
        expect(html).toContain('<div class="tablewrap"><table class="tbl">\n');
        expect(html).toContain('<td class="sortable"></td>');
    });

    test('{:.ok} в ячейке красит ее', () => {
        const html = render(lines('| a | b |', '|---|---|', '| да {:.ok} | нет {:.no} |'));
        expect(html).toContain('<td class="ok">да</td>');
        expect(html).toContain('<td class="no">нет</td>');
    });
});

describe('якоря заголовков', () => {
    test('кириллический slug и a.anchor внутри', () => {
        const html = render('## Где живут атрибуты?\n');
        expect(html).toBe('<h2 id="где-живут-атрибуты">Где живут атрибуты? '
            + '<a class="anchor" href="#где-живут-атрибуты" aria-label="Ссылка на раздел">#</a></h2>\n');
    });
});

describe('toc', () => {
    const src = lines(
        '## Где живут атрибуты',
        'текст[^1]',
        '### Подраздел',
        '## `__dict__` & <слоты>',
        '::: finale',
        'x',
        ':::',
        '',
        '[^1]: сноска'
    );

    test('h2 по порядку, текст без якоря, код и сущности раскрыты', () => {
        expect(toc(render(src))).toEqual([
            { id: 'где-живут-атрибуты', text: 'Где живут атрибуты' },
            { id: '__dict__-слоты', text: '__dict__ & <слоты>' }
        ]);
    });

    test('итог, примечания и h3 пропускаются', () => {
        const texts = toc(render(src)).map(t => t.text);
        expect(texts).not.toContain('Итог');
        expect(texts).not.toContain('Примечания');
        expect(texts).not.toContain('Подраздел');
    });

    test('пустой вход - пустое оглавление', () => {
        expect(toc(render(''))).toEqual([]);
        expect(toc('')).toEqual([]);
        expect(toc(undefined)).toEqual([]);
    });
});
