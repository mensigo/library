module.exports = function(eleventyConfig) {
    // Добавляем глобальные данные
    eleventyConfig.addGlobalData("pathPrefix", () => {
        return process.env.NODE_ENV === 'production' ? '/library' : '';
    });

    // Копируем статические файлы
    eleventyConfig.addPassthroughCopy("src/css");

    // Коллекция аниме
    eleventyConfig.addCollection("anime", function(collection) {
        return collection.getFilteredByGlob("src/anime/*.md");
    });

    // Коллекция философских категорий (папки)
    eleventyConfig.addCollection("philosophyCategories", function(collection) {
        const philosophyItems = collection.getFilteredByGlob("src/philosophy/**/*.md");
        const categories = {};

        philosophyItems.forEach(item => {
            // Получаем категорию из пути (например: "seneca")
            const pathParts = item.filePathStem.split('/');
            const category = pathParts[2]; // src/философия/СЕНЕКА/файл.md

            if (category && !categories[category]) {
                categories[category] = {
                    name: category,
                    items: philosophyItems.filter(i => i.filePathStem.includes(`/philosophy/${category}/`))
                };
            }
        });

        return categories;
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