// Markdown-конвейер: все правила авторского синтаксиса (callout'ы, ::: out, шапка
// код-блока, split / verdict / finale / more, сноски, термины, figure, таблицы,
// якоря заголовков) и оглавление (toc), которое читает получившуюся разметку.
// .eleventy.js делает amendLibrary("md", amend) и регистрирует toc фильтром;
// подсветку синтаксиса вешает плагин в .eleventy.js, здесь ее не трогаем.

const markdownItAnchor = require("markdown-it-anchor");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItContainer = require("markdown-it-container");
const markdownItFootnote = require("markdown-it-footnote");
const markdownItAbbr = require("markdown-it-abbr");

// Якоря заголовков: из этих id собирается оглавление заметки (фильтр toc).
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\wа-яё\s-]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
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
        + '<h2 class="u-kicker" id="fn-h">Примечания</h2><ol>\n';
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

// Термины с пояснением: `*[CNCF]: расшифровка` внизу файла оборачивает каждое
// вхождение слова в .term. Пояснение уходит в data-tip, а не в title — иначе
// поверх нашей подсказки всплывала бы ещё и браузерная.
function termMarkup(md) {
    md.use(markdownItAbbr);

    md.renderer.rules.abbr_open = (tokens, idx) => '<abbr class="term" tabindex="0" data-tip="'
        + md.utils.escapeHtml(tokens[idx].attrGet('title') || '') + '">';
}

// Дополняет экземпляр markdown-it всеми правилами авторского синтаксиса.
function amend(md) {
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
    termMarkup(md);

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

    // ::: more Заголовок — сворачиваемая справка, по умолчанию закрыта.
    md.use(markdownItContainer, 'more', {
        render(tokens, idx) {
            if (tokens[idx].nesting !== 1) return '</div></details>\n';
            const title = tokens[idx].info.trim().slice('more'.length).trim() || 'Подробнее';
            return '<details class="more"><summary>' + md.utils.escapeHtml(title)
                + '</summary><div class="more__body">\n';
        }
    });

    // ::: out — блок вывода, приклеенный к предыдущему код-блоку.
    md.use(markdownItContainer, 'out', {
        render(tokens, idx) {
            if (tokens[idx].nesting !== 1) return '</div>\n';
            const label = tokens[idx].info.trim().slice(3).trim();
            // Без своего ярлыка блок помечается как stdout: слово «вывод»
            // остаётся только для скринридеров.
            if (!label) {
                return '<div class="code__out">'
                    + '<b aria-hidden="true">stdout</b>'
                    + '<span class="u-sr">вывод</span>\n';
            }
            return '<div class="code__out"><b>' + md.utils.escapeHtml(label) + '</b>\n';
        }
    });

    // Код-блок получает шапку: точки, имя файла, бейдж языка, кнопку копирования.
    // Инфо-строка: ```python/3,5-7 slots.py
    //   первый токен целиком уходит в highlighter (язык + номера строк),
    //   остаток — имя файла.
    const defaultFence = md.renderer.rules.fence;

    // Фенс внутри ::: out — это вывод, а не самостоятельный код-блок:
    // шапка и рамка ему не нужны, но отступы и подсветка должны выжить.
    function insideOut(tokens, idx) {
        for (let i = idx - 1; i >= 0; i--) {
            if (tokens[i].type === 'container_out_close') return false;
            if (tokens[i].type === 'container_out_open') return true;
        }
        return false;
    }

    md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const body = defaultFence(tokens, idx, options, env, self);
        const info = (tokens[idx].info || '').trim();
        if (!info || insideOut(tokens, idx)) return body;

        const parts = info.split(/\s+/);
        const lang = parts.shift().split('/')[0];
        // `@3.12` в строке фенса — бейдж версии рядом с бейджем языка.
        const versions = parts.filter(p => /^@\S+$/.test(p)).map(p => p.slice(1));
        const name = parts.filter(p => !/^@\S+$/.test(p)).join(' ');

        return '<div class="code">'
            + '<div class="code__bar">'
            + '<span class="code__dots" aria-hidden="true"><i></i><i></i><i></i></span>'
            + (name ? '<span class="code__name">' + md.utils.escapeHtml(name) + '</span>' : '')
            + '<span class="code__lang">' + md.utils.escapeHtml(lang) + '</span>'
            + versions.map(v => '<span class="code__lang code__ver">' + md.utils.escapeHtml(v) + '</span>').join('')
            + '<button class="copy" type="button">'
            + '<svg class="ico-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'
            + '<svg class="ico-done" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>'
            + '<span class="copy__label">Копировать</span>'
            + '</button>'
            + '</div>'
            + body
            + '</div>\n';
    };

    // Таблицы всегда живут в скроллящейся обёртке. Атрибуты таблицы ({:.sortable}
    // отдельной строкой после пустой) сливаются с классом tbl.
    md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        const extra = token.attrGet('class');
        const attrs = [['class', extra ? 'tbl ' + extra : 'tbl']]
            .concat((token.attrs || []).filter(([name]) => name !== 'class'));
        return '<div class="tablewrap"><table' + self.renderAttrs({ attrs }) + '>\n';
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
}

function decodeEntities(text) {
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
}

// Оглавление из отрендеренного HTML: h2 с id, кроме служебных (.u-kicker: «Итог»,
// «Примечания»). Текст - без разметки и без якоря «#», шаблон экранирует его сам.
function toc(content) {
    const items = [];
    const h2 = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/g;
    let m;
    while ((m = h2.exec(String(content || '')))) {
        const attrs = m[1];
        if (/\bclass="[^"]*\bu-kicker\b/.test(attrs)) continue;
        const id = (attrs.match(/\bid="([^"]*)"/) || [])[1];
        if (!id) continue;
        const text = decodeEntities(m[2]
            .replace(/<a\b[^>]*\bclass="anchor"[^>]*>[\s\S]*?<\/a>/g, '')
            .replace(/<[^>]+>/g, ''))
            .trim();
        items.push({ id: decodeEntities(id), text });
    }
    return items;
}

module.exports = { amend, toc };
