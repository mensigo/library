// Фильтры страниц нового дизайна (заметка, блог): даты и лента блога. Лежат отдельно
// от .eleventy.js, чтобы Jest мог их импортировать; .eleventy.js регистрирует все,
// что здесь экспортируется. Правила группы заметок - lib/note-group.js, markdown и
// оглавление (toc) - lib/markdown.js.

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function byTitle(a, b) {
    return (a.data.title || '').toString()
        .localeCompare((b.data.title || '').toString(), 'ru', { sensitivity: 'base' });
}

// 2026-09-26 → «26 сен». Даты из front matter - полночь UTC, поэтому части берутся в UTC.
function shortDate(date) {
    const d = new Date(date);
    return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
}

// ---------- блог ----------

const MONTHS_LONG = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
    'августа', 'сентября', 'октября', 'ноября', 'декабря'];

// blog/<file>.md → filePathStem '/blog/<file>'; index.njk ленты сюда не попадает
function inBlog(item) {
    const parts = (item.filePathStem || '').split('/');
    return parts.length === 3 && parts[1] === 'blog' && parts[2] !== 'index';
}

// Опубликованные посты: новые выше, при равной дате - по title, иначе две сборки
// подряд дают разный порядок. Коллекция posts (.eleventy.js), по ней листается лента.
function blogPosts(collection) {
    return (collection || [])
        .filter(item => inBlog(item) && item.data.draft !== true)
        .sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0) || byTitle(a, b));
}

// 2026-11-24 → «24 ноября»; другой год, чем у сборки, - «24 ноября 2025». В UTC:
// даты из front matter - полночь UTC, западнее UTC иначе вышел бы вчерашний день.
function longDate(date, now = new Date()) {
    const d = new Date(date);
    const text = d.getUTCDate() + ' ' + MONTHS_LONG[d.getUTCMonth()];
    return d.getUTCFullYear() === new Date(now).getUTCFullYear() ? text : text + ' ' + d.getUTCFullYear();
}

// Посты ссылаются от корня (/notes/…, /images/blog/…): одно тело рендерится и в
// ленте, и на странице поста. В production корневым ссылкам нужен /library.
function rootLinks(html, prefix) {
    const text = String(html == null ? '' : html);
    if (!prefix) return text;
    return text.replace(/\b(href|src)="\/(?!\/)/g, '$1="' + prefix + '/');
}

// Превью длинного поста: все до первого <!-- more -->. cut - был ли обрез.
const MORE = /<!--\s*more\s*-->/;
function beforeMore(html) {
    const text = String(html == null ? '' : html);
    const m = MORE.exec(text);
    return m ? { html: text.slice(0, m.index), cut: true } : { html: text, cut: false };
}

module.exports = {
    shortDate,
    blogPosts, longDate, rootLinks, beforeMore
};
