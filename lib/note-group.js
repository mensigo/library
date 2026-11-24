// Группа заметок целиком (GLOSSARY.md, «Group view»): что в ней опубликовано, под
// какими номерами, какие теги считаются, что тлеет в черновиках. Все правила группы -
// здесь; шаблоны (комната, страница группы, заметка) только рисуют то, что вернулось.
// .eleventy.js регистрирует noteGroup и noteCount фильтрами, notes.11tydata.js берет
// groupIdOf.

const groups = require('../src/notes/groups.js');

const DAY = 24 * 60 * 60 * 1000;
const FRESH_DAYS = 45;

// notes/<id>/<file>.md → filePathStem '/notes/<id>/<file>' → '<id>'; все остальное
// (index.njk и group.njk уровнем выше, страницы вне notes/) - undefined
function groupIdOf(filePathStem) {
    const parts = (filePathStem || '').split('/');
    return parts.length === 4 && parts[1] === 'notes' ? parts[2] : undefined;
}

function byTitle(a, b) {
    return (a.data.title || '').toString()
        .localeCompare((b.data.title || '').toString(), 'ru', { sensitivity: 'base' });
}

// Новые выше; при равной дате - по title, иначе порядок меняется от сборки к сборке.
function byUpdDate(a, b) {
    return new Date(b.data.upd_date || 0) - new Date(a.data.upd_date || 0) || byTitle(a, b);
}

// «Свежая» заметка: upd_date не старше 45 дней на момент сборки.
function isFresh(date, now) {
    if (!date) return false;
    return new Date(now) - new Date(date) <= FRESH_DAYS * DAY;
}

// Кнопки тем: «все» первой (tag '' - фильтр снят), дальше теги строк по числу
// заметок, при равенстве - по алфавиту. Собственного тега группы в rows уже нет.
function topicsOf(rows) {
    const counts = new Map();
    rows.forEach(row => row.tags.forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1)));
    const list = Array.from(counts, ([tag, count]) => ({ tag, label: tag, count }))
        .sort((a, b) => b.count - a.count
            || a.tag.localeCompare(b.tag, 'ru', { sensitivity: 'base' }));
    return [{ tag: '', label: 'все', count: rows.length }, ...list];
}

// Вид группы id по коллекции Eleventy (collections.all):
//   group  - запись из notes/groups.js (undefined у неизвестной группы)
//   rows   - опубликованные заметки, новые выше: { note, n, tags, fresh },
//            n - номер строки (1..N), tags - без собственного тега группы
//   drafts - черновики (draft: true в папке группы) в той же форме, n null, fresh false
//   topics - кнопки тем страницы группы
//   rowOf(url) - строка или черновик с этим url (страница заметки берет номер и теги)
function noteGroup(collection, id, now = Date.now()) {
    const group = groups.find(g => g.id === id);
    const own = group ? group.tag : undefined;
    const mine = group
        ? (collection || []).filter(item => groupIdOf(item.filePathStem) === id).sort(byUpdDate)
        : [];
    const tagsOf = item => (item.data.tags || []).filter(tag => tag !== own);

    const rows = mine
        .filter(item => item.data.draft !== true)
        .map((note, i) => ({ note, n: i + 1, tags: tagsOf(note), fresh: isFresh(note.data.upd_date, now) }));
    const drafts = mine
        .filter(item => item.data.draft === true)
        .map(note => ({ note, n: null, tags: tagsOf(note), fresh: false }));

    return {
        group,
        rows,
        drafts,
        topics: topicsOf(rows),
        rowOf: url => rows.concat(drafts).find(row => row.note.url === url)
    };
}

// Число на карточке «Заметки» в комнате: опубликованные заметки групп, которые
// открыты на стене (enabled). Заметка приглушенной группы никуда не ведет и не считается.
function noteCount(collection) {
    return groups
        .filter(g => g.enabled)
        .reduce((sum, g) => sum + noteGroup(collection, g.id).rows.length, 0);
}

module.exports = { noteGroup, noteCount, groupIdOf };
