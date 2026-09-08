const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItContainer = require("markdown-it-container");
const markdownItFootnote = require("markdown-it-footnote");

// Тот же алгоритм, что и generateSlug в src/js/scripts.js: якоря,
// сгенерированные на сборке, должны совпадать с теми, что ищет TOC в браузере.
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\wа-яё\s-]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// Метка раздела (папки) по URL страницы.
function sectionLabel(url) {
    if (!url) return '';
    if (url.startsWith('/reviews/anime/')) return 'Аниме';
    if (url.startsWith('/reviews/philosophy/')) {
        const category = url.split('/').filter(Boolean)[2];
        return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Философия';
    }
    if (url.startsWith('/notes/python/')) return 'Python';
    if (url.startsWith('/notes/')) return 'Заметки';
    if (url.startsWith('/drafts/')) return 'Черновики';
    return '';
}

// Иконки callout'ов. Ключ контейнера → подпись по умолчанию + SVG.
const CALLOUTS = {
    note: {
        modifier: '',
        title: 'Заметка',
        icon: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
    },
    tip: {
        modifier: 'callout--tip',
        title: 'Совет',
        icon: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.3.3.5.7.5 1.1h6c0-.4.2-.8.5-1.1A6 6 0 0 0 12 3Z"/>'
    },
    warn: {
        modifier: 'callout--warn',
        title: 'Осторожно',
        icon: '<path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>'
    },
    stop: {
        modifier: 'callout--stop',
        title: 'Грабли',
        icon: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>'
    }
};

function calloutPlugin(md, name) {
    const spec = CALLOUTS[name];
    md.use(markdownItContainer, name, {
        render(tokens, idx) {
            if (tokens[idx].nesting !== 1) return '</div></div>\n';
            const custom = tokens[idx].info.trim().slice(name.length).trim();
            const title = custom || spec.title;
            return '<div class="callout' + (spec.modifier ? ' ' + spec.modifier : '') + '">'
                + '<div class="callout__ico">'
                + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" '
                + 'stroke-linejoin="round" aria-hidden="true">' + spec.icon + '</svg>'
                + '</div>'
                + '<div class="callout__body"><b>' + md.utils.escapeHtml(title) + '</b>\n';
        }
    });
}


// ::: split — два блока рядом (обычно «было / стало»).
// ::: verdict — две колонки «стоит / не стоит», внутри ::: yes и ::: no.
// ::: finale — итоговый блок в конце заметки; заголовок берётся из инфо-строки.
const VERDICT = {
    yes: {
        modifier: 'verdict--yes',
        title: 'Стоит брать',
        icon: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'
    },
    no: {
        modifier: 'verdict--no',
        title: 'Не стоит',
        icon: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>'
    }
};

function verdictPlugin(md, name) {
    const spec = VERDICT[name];
    md.use(markdownItContainer, name, {
        render(tokens, idx) {
            if (tokens[idx].nesting !== 1) return '</div>\n';
            const custom = tokens[idx].info.trim().slice(name.length).trim();
            const title = custom || spec.title;
            return '<div class="verdict__col ' + spec.modifier + '">'
                + '<h4><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
                + 'stroke-linecap="round" aria-hidden="true">' + spec.icon + '</svg>'
                + md.utils.escapeHtml(title) + '</h4>\n';
        }
    });
}

// Сноски: markdown-it-footnote умеет разбирать [^1], но рисует свою разметку —
// переопределяем рендер под .fnref / .notes-block из дизайн-системы.
function footnoteMarkup(md) {
    md.use(markdownItFootnote);

    md.renderer.rules.footnote_ref = (tokens, idx, options, env, slf) => {
        const id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
        const caption = slf.rules.footnote_caption(tokens, idx, options, env, slf).replace(/[[\]]/g, '');
        return '<a class="fnref" href="#fn' + id + '" id="fnref' + id + '">' + caption + '</a>';
    };
    md.renderer.rules.footnote_block_open = () => '<section class="notes-block" aria-labelledby="fn-h">'
        + '<h2 class="u-kicker" id="fn-h">Сноски</h2><ol>\n';
    md.renderer.rules.footnote_block_close = () => '</ol></section>\n';
    md.renderer.rules.footnote_open = (tokens, idx, options, env, slf) => {
        const id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
        return '<li id="fn' + id + '">';
    };
    md.renderer.rules.footnote_close = () => '</li>\n';
    md.renderer.rules.footnote_anchor = (tokens, idx, options, env, slf) => {
        const id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
        return ' <a class="back" href="#fnref' + id + '" aria-label="Вернуться к тексту">\u21a9</a>';
    };
}

module.exports = function(eleventyConfig) {
    // Добавляем глобальные данные
    eleventyConfig.addGlobalData("pathPrefix", () => {
        return process.env.NODE_ENV === 'production' ? '/library' : '';
    });

    // Подсветка синтаксиса в fenced code blocks.
    // Плагин вешает highlighter через addMarkdownHighlighter, поэтому ниже
    // библиотеку markdown-it мы дополняем (amendLibrary), а не заменяем.
    eleventyConfig.addPlugin(syntaxHighlight);

    eleventyConfig.amendLibrary("md", (md) => {
        // Разделитель {: … } вместо { … }: иначе словари и JSON в блоках вывода
        // markdown-it-attrs принимает за список атрибутов и вырезает.
        md.use(markdownItAttrs, { leftDelimiter: '{:', rightDelimiter: '}' });

        md.use(markdownItAnchor, {
            slugify: generateSlug,
            tabIndex: false,
            permalink: markdownItAnchor.permalink.linkInsideHeader({
                symbol: '#',
                class: 'anchor',
                placement: 'after',
                ariaHidden: false,
                renderAttrs: () => ({ 'aria-label': 'Ссылка на раздел' })
            })
        });

        Object.keys(CALLOUTS).forEach(name => calloutPlugin(md, name));

        footnoteMarkup(md);

        // Простые обёртки-контейнеры.
        md.use(markdownItContainer, 'split', {
            render: (tokens, idx) => tokens[idx].nesting === 1 ? '<div class="split">\n' : '</div>\n'
        });
        md.use(markdownItContainer, 'verdict', {
            render: (tokens, idx) => tokens[idx].nesting === 1 ? '<div class="verdict">\n' : '</div>\n'
        });
        Object.keys(VERDICT).forEach(name => verdictPlugin(md, name));

        md.use(markdownItContainer, 'finale', {
            render(tokens, idx) {
                if (tokens[idx].nesting !== 1) return '</div>\n';
                const title = tokens[idx].info.trim().slice('finale'.length).trim() || 'Итог';
                return '<div class="finale"><h2 class="u-kicker">'
                    + md.utils.escapeHtml(title) + '</h2>\n';
            }
        });

        // ::: out — блок вывода, приклеенный к предыдущему код-блоку.
        md.use(markdownItContainer, 'out', {
            render(tokens, idx) {
                if (tokens[idx].nesting !== 1) return '</div>\n';
                const label = tokens[idx].info.trim().slice(3).trim() || 'вывод';
                return '<div class="code__out"><b>' + md.utils.escapeHtml(label) + '</b>\n';
            }
        });

        // Код-блок получает шапку: точки, имя файла, бейдж языка, кнопку копирования.
        // Инфо-строка: ```python/3,5-7 slots.py
        //   первый токен целиком уходит в highlighter (язык + номера строк),
        //   остаток — имя файла.
        const defaultFence = md.renderer.rules.fence;
        md.renderer.rules.fence = function (tokens, idx, options, env, self) {
            const body = defaultFence(tokens, idx, options, env, self);
            const info = (tokens[idx].info || '').trim();
            if (!info) return body;

            const parts = info.split(/\s+/);
            const lang = parts.shift().split('/')[0];
            const name = parts.join(' ');

            return '<div class="code">'
                + '<div class="code__bar">'
                + '<span class="code__dots" aria-hidden="true"><i></i><i></i><i></i></span>'
                + (name ? '<span class="code__name">' + md.utils.escapeHtml(name) + '</span>' : '')
                + '<span class="code__lang">' + md.utils.escapeHtml(lang) + '</span>'
                + '<button class="copy" type="button">'
                + '<svg class="ico-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'
                + '<svg class="ico-done" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>'
                + '<span class="copy__label">Копировать</span>'
                + '</button>'
                + '</div>'
                + body
                + '</div>\n';
        };

        // Таблицы всегда живут в скроллящейся обёртке.
        md.renderer.rules.table_open = function () {
            return '<div class="tablewrap"><table class="tbl">\n';
        };
        md.renderer.rules.table_close = function () {
            return '</table></div>\n';
        };

        // Абзац из одной картинки превращается в figure: подпись берётся из title.
        //   ![alt](/images/x.png "подпись")
        function loneImage(tokens, openIdx) {
            const inline = tokens[openIdx + 1];
            if (!tokens[openIdx] || tokens[openIdx].type !== 'paragraph_open') return null;
            if (!inline || inline.type !== 'inline' || !inline.children) return null;
            const kids = inline.children.filter(t => !(t.type === 'text' && !t.content.trim()));
            if (kids.length !== 1 || kids[0].type !== 'image') return null;
            return kids[0];
        }

        md.renderer.rules.paragraph_open = function (tokens, idx, options, env, self) {
            if (loneImage(tokens, idx)) return '<figure class="fig"><div class="fig__frame">';
            return self.renderToken(tokens, idx, options);
        };
        md.renderer.rules.paragraph_close = function (tokens, idx, options, env, self) {
            const image = loneImage(tokens, idx - 2);
            if (!image) return self.renderToken(tokens, idx, options);
            // Подпись «Схема | текст» рисуется меткой слева и текстом справа.
            const caption = image.attrGet('title');
            let inner = '';
            if (caption) {
                const bar = caption.indexOf('|');
                inner = bar === -1
                    ? md.utils.escapeHtml(caption)
                    : '<b>' + md.utils.escapeHtml(caption.slice(0, bar).trim()) + '</b>'
                        + '<span>' + md.utils.escapeHtml(caption.slice(bar + 1).trim()) + '</span>';
            }
            return '</div>'
                + (inner ? '<figcaption>' + inner + '</figcaption>' : '')
                + '</figure>\n';
        };
    });

    // Копируем статические файлы
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/js");
    eleventyConfig.addPassthroughCopy("src/images");
    eleventyConfig.addPassthroughCopy("src/fonts");

    // Фильтр для читаемой даты
    eleventyConfig.addFilter("readableDate", (dateObj) => {
        return new Date(dateObj).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    });

    // Фильтр для даты в формате RFC 3339
    eleventyConfig.addFilter("dateToRfc3339", (dateObj) => {
        return new Date(dateObj).toISOString();
    });

    // Время чтения (по уже отрендеренному HTML)
    eleventyConfig.addFilter("readingTime", (content) => {
        const wordsPerMinute = 200;
        const text = String(content).replace(/<[^>]+>/g, ' ');
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    });

    // Количество разделов верхнего уровня (h2) в отрендеренном HTML.
    // Служебные заголовки (.u-kicker: «Итог», «Сноски») разделами не считаются.
    eleventyConfig.addFilter("headingCount", (content) => {
        return (String(content).match(/<h2(?![^>]*u-kicker)[\s>]/g) || []).length;
    });

    // Русское склонение по числу: 1 раздел, 2 раздела, 5 разделов
    eleventyConfig.addFilter("plural", (n, one, few, many) => {
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return one;
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
        return many;
    });

    // Числовое значение оценки
    eleventyConfig.addFilter('getScoreValue', (score) => {
        return parseInt(score.split('/')[0].trim());
    });

    // Проверка, начинается ли строка с префикса
    eleventyConfig.addFilter('startsWith', (str, prefix) => {
        if (!str || !prefix) return false;
        return str.startsWith(prefix);
    });

    // Метка раздела — для крошек в topbar и для списка последних обновлений
    eleventyConfig.addFilter('sectionLabel', sectionLabel);

    // Соседи по разделу — для пагинации внизу заметки.
    // Порядок тот же, что в навигации: по title, с русской сортировкой.
    eleventyConfig.addFilter('neighbours', (collection, url) => {
        if (!collection || !url) return {};
        const folder = (u) => u.slice(0, u.lastIndexOf('/', u.length - 2) + 1);
        const dir = folder(url);
        const items = collection
            .filter(item => item.url && folder(item.url) === dir)
            .sort((a, b) => {
                const titleA = (a.data.title || '').toString();
                const titleB = (b.data.title || '').toString();
                return titleA.localeCompare(titleB, 'ru', { sensitivity: 'base' });
            });
        const i = items.findIndex(item => item.url === url);
        if (i === -1) return {};
        return { prev: items[i - 1] || null, next: items[i + 1] || null };
    });

    // Коллекция аниме
    eleventyConfig.addCollection("anime", function(collection) {
        return collection.getFilteredByGlob("src/reviews/anime/*.md")
            .filter(item => {
                return !item.inputPath.includes('index.md') && item.data.draft !== true;
            })
            .sort((a, b) => {
                const titleA = (a.data.title || '').toString();
                const titleB = (b.data.title || '').toString();
                return titleA.localeCompare(titleB, 'ru', { sensitivity: 'base' });
            });
    });

    // Коллекция философских категорий (папки)
    eleventyConfig.addCollection("philosophyCategories", function(collection) {
        const philosophyItems = collection.getFilteredByGlob("src/reviews/philosophy/**/*.md");
        const categoryNames = new Set();
        const categories = {};

        philosophyItems.forEach(item => {
            if (item.data.draft === true) {
                return;
            }

            // Получаем категорию из пути (например: "seneca")
            const pathParts = item.filePathStem.split('/');
            const category = pathParts[3];  // src/reviews/philosophy/seneca/page.md

            if (category) {
                categoryNames.add(category);
            }
        });

        Array.from(categoryNames)
            .sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base' }))
            .forEach(category => {
                categories[category] = {
                    name: category,
                    items: philosophyItems
                        .filter(i => i.filePathStem.includes(`/reviews/philosophy/${category}/`))
                        .sort((a, b) => {
                            const titleA = (a.data.title || '').toString();
                            const titleB = (b.data.title || '').toString();
                            return titleA.localeCompare(titleB, 'ru', { sensitivity: 'base' });
                        })
                };
            });

        return categories;
    });

    // Коллекция заметок (notes)
    eleventyConfig.addCollection("notes", function(collection) {
        return collection.getFilteredByGlob("src/notes/**/*.md")
            .filter(item => {
                return !item.inputPath.includes('index.md') && item.data.draft !== true;
            });
    });

    // Коллекция Python-заметок, отсортированная по title
    eleventyConfig.addCollection("pythonNotes", function(collection) {
        return collection.getFilteredByGlob("src/notes/python/*.md")
            .filter(item => {
                return !item.inputPath.includes('index.md') && item.data.draft !== true;
            })
            .sort((a, b) => {
                const titleA = (a.data.title || '').toString();
                const titleB = (b.data.title || '').toString();
                return titleA.localeCompare(titleB, 'ru', { sensitivity: 'base' });
            });
    });

    // Коллекция черновиков (draft: true)
    eleventyConfig.addCollection("drafts", function(collection) {
        return collection.getAll()
            .filter(item => item.data.draft === true && item.data.title)
            .sort((a, b) => {
                const titleA = (a.data.title || '').toString();
                const titleB = (b.data.title || '').toString();
                return titleA.localeCompare(titleB, 'ru', { sensitivity: 'base' });
            });
    });

    // Коллекция последних обновлений (по upd_date, включая черновики)
    eleventyConfig.addCollection("recentUpdates", function(collection) {
        return collection.getAll()
            .filter(item => item.data.upd_date)
            .sort((a, b) => new Date(b.data.upd_date) - new Date(a.data.upd_date))
            .map(item => {
                item.data.categoryLabel = sectionLabel(item.url);
                return item;
            });
    });

    // Shortcode для сортируемых таблиц
    eleventyConfig.addPairedShortcode("sortableTable", function(content) {
        // Парсим markdown таблицу
        const lines = content.trim().split('\n');

        // Первая строка - заголовки
        const headers = lines[0].split('|').slice(1, -1).map(h => h.trim());

        // Вторая строка - разделитель (пропускаем)

        // Остальные строки - данные
        const rows = lines.slice(2).map(line =>
            line.split('|').slice(1, -1).map(cell => cell.trim())
        );

        // Генерируем HTML в той же обёртке, что и обычные markdown-таблицы
        let html = '<div class="tablewrap"><table class="tbl">\n    <thead>\n        <tr>\n';
        headers.forEach(header => {
            html += `            <th class="sortable">${header}</th>\n`;
        });
        html += '        </tr>\n    </thead>\n    <tbody>\n';

        rows.forEach(row => {
            html += '        <tr>\n';
            row.forEach(cell => {
                html += `            <td>${cell}</td>\n`;
            });
            html += '        </tr>\n';
        });

        html += '    </tbody>\n</table></div>';

        return html;
    });

    // Генерация поискового индекса
    eleventyConfig.addCollection("searchIndex", function(collection) {
        const searchIndex = [];

        collection.getAll().forEach(item => {
            // Пропускаем служебные файлы и drafts
            if (item.data.draft === true || !item.inputPath.includes('src')) {
                return;
            }

            // Пропускаем файлы без title или не markdown
            if (!item.data.title) {
                return;
            }

            // Извлекаем текст из контента
            let content = item.template.frontMatter.content || '';
            // Удаляем markdown синтаксис для индекса
            content = content
                .replace(/#{1,6} /g, '') // Удаляем заголовки
                .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Ссылки
                .replace(/\*\*([^\*]+)\*\*/g, '$1') // Bold
                .replace(/\*([^\*]+)\*/g, '$1') // Italic
                .replace(/`([^`]+)`/g, '$1') // Inline code
                .replace(/```[\s\S]*?```/g, '') // Code blocks
                .trim();

            // Ограничиваем размер контента для индекса (первые 500 слов)
            const words = content.split(/\s+/);
            content = words.slice(0, 500).join(' ');

            // Определяем раздел
            const url = item.url;
            let section = 'other';
            if (url.includes('/notes/')) section = 'notes';
            else if (url.includes('/reviews/anime/')) section = 'anime';
            else if (url.includes('/reviews/philosophy/')) section = 'philosophy';
            else if (url === '/' || url === '/reviews/' || url === '/notes/') section = 'main';

            searchIndex.push({
                id: url,
                title: item.data.title,
                url: url,
                content: content,
                section: section
            });
        });

        return searchIndex;
    });

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes"
        },
        templateFormats: ["md", "njk"],
        markdownTemplateEngine: "njk",
    };
};
