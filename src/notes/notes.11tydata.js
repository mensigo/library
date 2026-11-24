// Данные всех файлов под notes/: раскладка заметки и id ее группы по имени папки,
// поэтому группе не нужен свой файл данных. index.njk и group.njk задают layout
// в front matter, он важнее этого; group.njk задает и свой groupId.
const { groupIdOf } = require('../../lib/note-group.js');

module.exports = {
    layout: 'world/note.njk',
    eleventyComputed: {
        // notes/<group>/<file>.md → id группы; index.njk и group.njk уровнем выше - без него
        groupId: (data) => groupIdOf(data.page.filePathStem)
    }
};
