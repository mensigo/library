module.exports = function(eleventyConfig) {
    // Добавляем глобальные данные
    eleventyConfig.addGlobalData("pathPrefix", () => {
        return process.env.NODE_ENV === 'production' ? '/library' : '';
    });

    // Копируем статические & js файлы
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/js");

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

    // Фильтр для короткой даты
    eleventyConfig.addFilter("shortDate", (dateObj) => {
        return new Date(dateObj).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            //day: 'numeric'
        });
    });

    // Время чтения
    eleventyConfig.addFilter("readingTime", (text) => {
        const wordsPerMinute = 200;
        const wordCount = text.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    });

    // Слаг для URL
    eleventyConfig.addFilter("slug", (str) => {
        return str
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    });

    // Разделение по сепаратору
    eleventyConfig.addFilter('split', (str, separator) => {
        return str.split(separator);
    });

    // Цвет оценки
    eleventyConfig.addFilter('getScoreColor', (score) => {
        const num = parseInt(score.split('/')[0].trim());
        if (num >= 8) return 'high';
        if (num >= 5) return 'medium';
        return 'low';
    });

    // Коллекция аниме
    eleventyConfig.addCollection("anime", function(collection) {
        return collection.getFilteredByGlob("src/pages/anime/*.md");
    });

    // Коллекция философских категорий (папки)
    eleventyConfig.addCollection("philosophyCategories", function(collection) {
        const philosophyItems = collection.getFilteredByGlob("src/pages/philosophy/**/*.md");
        const categories = {};

        philosophyItems.forEach(item => {
            // Получаем категорию из пути (например: "seneca")
            const pathParts = item.filePathStem.split('/');
            const category = pathParts[3];  // src/pages/philosophy/seneca/page.md

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