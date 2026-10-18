// Фильтры страниц нового дизайна (страница группы, заметка, комната). Лежат отдельно
// от .eleventy.js, чтобы Jest мог их импортировать; .eleventy.js регистрирует все,
// что здесь экспортируется.

const DAY = 24 * 60 * 60 * 1000;
const FRESH_DAYS = 45;
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function byTitle(a, b) {
    return (a.data.title || '').toString()
        .localeCompare((b.data.title || '').toString(), 'ru', { sensitivity: 'base' });
}

// Новые выше; при равной дате - по title, иначе порядок меняется от сборки к сборке.
function byUpdDate(a, b) {
    return new Date(b.data.upd_date || 0) - new Date(a.data.upd_date || 0) || byTitle(a, b);
}

// notes/<id>/<file>.md → filePathStem '/notes/<id>/<file>'
function inGroup(item, id) {
    const parts = (item.filePathStem || '').split('/');
    return parts.length === 4 && parts[1] === 'notes' && parts[2] === id;
}

// Опубликованные заметки группы - строки на странице группы, номер строки = позиция.
function groupNotes(collection, id) {
    return (collection || [])
        .filter(item => inGroup(item, id) && item.data.draft !== true)
        .sort(byUpdDate);
}

// Черновики группы (draft: true в ее папке) - блок embers на странице группы.
function groupDrafts(collection, id) {
    return (collection || [])
        .filter(item => inGroup(item, id) && item.data.draft === true)
        .sort(byUpdDate);
}

// Кнопки тем: «все» первой (tag '' - фильтр снят), дальше теги заметок без
// собственного тега группы, по числу заметок, при равенстве - по алфавиту.
function topics(notes, ownTag) {
    const counts = new Map();
    (notes || []).forEach(item => {
        (item.data.tags || []).forEach(tag => {
            if (tag === ownTag) return;
            counts.set(tag, (counts.get(tag) || 0) + 1);
        });
    });
    const list = Array.from(counts, ([tag, count]) => ({ tag, label: tag, count }))
        .sort((a, b) => b.count - a.count
            || a.tag.localeCompare(b.tag, 'ru', { sensitivity: 'base' }));
    return [{ tag: '', label: 'все', count: (notes || []).length }, ...list];
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

// 2026-09-26 → «26 сен». Даты из front matter - полночь UTC, поэтому части берутся в UTC.
function shortDate(date) {
    const d = new Date(date);
    return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
}

// «Свежая» заметка: upd_date не старше 45 дней на момент сборки.
function isFresh(date, now = Date.now()) {
    if (!date) return false;
    return new Date(now) - new Date(date) <= FRESH_DAYS * DAY;
}

module.exports = { groupNotes, groupDrafts, topics, toc, shortDate, isFresh };
