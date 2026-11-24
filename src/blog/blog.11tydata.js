// Данные всех файлов под blog/: раскладка поста и его адрес /blog/<id>/. id пишется в
// front matter руками и не меняется (MIGRATION.md, решение 2); черновик (draft: true)
// не собирается. index.njk (лента) задает свои layout и permalink в front matter,
// они важнее этих.
module.exports = {
    layout: 'world/post.njk',
    bundle: 'blog',
    permalink: (data) => data.draft === true ? false : `/blog/${data.id}/`
};
