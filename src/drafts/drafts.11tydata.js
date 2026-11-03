// Черновики без тега группы - заготовки и списки идей. Не собираются и не попадают
// ни в одну коллекцию. Черновик с тегом группы (Python, Docker) лежит в ее папке
// notes/<id>/ с draft: true; test/note-drafts.test.js следит, чтобы сюда он не попал.
module.exports = {
    permalink: false,
    eleventyExcludeFromCollections: true
};
