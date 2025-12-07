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

    // Создание массива чисел от 0 до N-1
    eleventyConfig.addFilter('range', (n) => {
        const arr = [];
        for (let i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    });

    // Цвет оценки
    eleventyConfig.addFilter('getScoreColor', (score) => {
        const num = parseInt(score.split('/')[0].trim());
        if (num >= 8) return 'high';
        if (num >= 5) return 'medium';
        return 'low';
    });

    // Числовое значение оценки
    eleventyConfig.addFilter('getScoreValue', (score) => {
        return parseInt(score.split('/')[0].trim());
    });

    // Процент оценки
    eleventyConfig.addFilter('getScorePercent', (score) => {
        const num = parseInt(score.split('/')[0].trim());
        return (num / 10) * 100;
    });

    // Количество заполненных звезд (из 7)
    eleventyConfig.addFilter('getFilledStars', (score) => {
        const num = parseFloat(score.split('/')[0].trim());
        return Math.round((num / 10) * 7);
    });

    // Проверка, начинается ли строка с префикса
    eleventyConfig.addFilter('startsWith', (str, prefix) => {
        if (!str || !prefix) return false;
        return str.startsWith(prefix);
    });

    // Коллекция аниме
    eleventyConfig.addCollection("anime", function(collection) {
        return collection.getFilteredByGlob("src/pages/anime/*.md")
            .filter(item => {
                return !item.inputPath.includes('index.md');
            });
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