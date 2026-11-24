const fs = require("fs");
const path = require("path");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { amend, toc } = require("./lib/markdown");
const worldFilters = require("./lib/filters");
const { noteGroup, noteCount } = require("./lib/note-group");

module.exports = function(eleventyConfig) {
    // Добавляем глобальные данные
    eleventyConfig.addGlobalData("pathPrefix", () => {
        return process.env.NODE_ENV === 'production' ? '/library' : '';
    });

    // Подсветка синтаксиса в fenced code blocks.
    // Плагин вешает highlighter через addMarkdownHighlighter, поэтому ниже
    // библиотеку markdown-it мы дополняем (amendLibrary), а не заменяем.
    eleventyConfig.addPlugin(syntaxHighlight);

    // Markdown-конвейер (lib/markdown.js): контейнеры, шапка код-блока, сноски,
    // термины, figure, таблицы, якоря заголовков.
    eleventyConfig.amendLibrary("md", amend);

    // Копируем статические файлы
    eleventyConfig.addPassthroughCopy("src/images");
    eleventyConfig.addPassthroughCopy("src/fonts");

    // Cinema (src/cinema/) — рукописный мир вне шаблонов. Страницы копируются
    // как есть (только *.html), а CSS/JS склеиваются из src/cinema/_src/
    // шаблоном src/cinema/bundles.njk — по одному файлу на страницу.
    eleventyConfig.addPassthroughCopy("src/cinema/**/*.html");
    eleventyConfig.addWatchTarget("src/cinema/_src/");
    eleventyConfig.addWatchTarget("src/world/_src/");

    // Склейка бандлов (src/cinema/bundles.njk, src/world/bundles.njk):
    // части — пути от src/, например cinema/_src/cinema.css. Сами _src/ не публикуются.
    eleventyConfig.addFilter("bundle", (parts) => parts
        .map(name => `/* ── ${path.basename(name)} ── */\n`
            + fs.readFileSync(path.join(__dirname, "src", name), "utf8"))
        .join("\n"));

    // Оглавление заметки (note.njk: content | toc) - из разметки markdown-конвейера.
    eleventyConfig.addFilter("toc", toc);

    // Фильтры нового дизайна (lib/filters.js): даты заметки, лента блога.
    Object.entries(worldFilters).forEach(([name, fn]) => eleventyConfig.addFilter(name, fn));

    // Группа заметок целиком (lib/note-group.js): строки, номера, темы, черновики;
    // noteCount - число на карточке «Заметки» в комнате.
    eleventyConfig.addFilter("noteGroup", (collection, id) => noteGroup(collection, id));
    eleventyConfig.addFilter("noteCount", noteCount);

    // Группы заметок (src/notes/groups.js) нужны и вне notes/: стену рисует src/index.njk.
    eleventyConfig.addGlobalData("noteGroups", () => require("./src/notes/groups.js"));

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

    // Русское склонение по числу: 1 раздел, 2 раздела, 5 разделов
    eleventyConfig.addFilter("plural", (n, one, few, many) => {
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return one;
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
        return many;
    });

    // Опубликованные посты блога, новые выше: по ним листается лента (src/blog/index.njk),
    // их число - на карточке «Блог» в комнате
    eleventyConfig.addCollection("posts", (collection) => worldFilters.blogPosts(collection.getAll()));

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
