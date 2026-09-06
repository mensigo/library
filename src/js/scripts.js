// ========================================
// Утилитарные функции (используются в логике и тестах)
// ========================================

// Палитры акцента. Каждый вариант несёт две тройки — для светлой и тёмной
// темы — плюс цвет строкового литерала: у тёплых акцентов холодная бирюза
// в коде заметно спорит с акцентом, поэтому она едет вместе с ним.
const PALETTES = [
    { id: 'teal',       name: 'Teal',       light: { acc: '#0f766e', str: '#0e7490' }, dark: { acc: '#5eead4', str: '#7dd3d8' } },
    { id: 'forest',     name: 'Forest',     light: { acc: '#15803d', str: '#0e7490' }, dark: { acc: '#6ee7a5', str: '#7dd3d8' } },
    { id: 'violet',     name: 'Violet',     light: { acc: '#6d28d9', str: '#0e7490' }, dark: { acc: '#c4a6ff', str: '#7dd3d8' } },
    { id: 'ink',        name: 'Ink blue',   light: { acc: '#2563eb', str: '#0e7490' }, dark: { acc: '#8ab4f8', str: '#7dd3d8' } },
    { id: 'terracotta', name: 'Terracotta', light: { acc: '#b03a17', str: '#4d7c0f' }, dark: { acc: '#e8845c', str: '#b5d99c' } },
    { id: 'ochre',      name: 'Ochre',      light: { acc: '#a16207', str: '#4d7c0f' }, dark: { acc: '#e0a458', str: '#b5d99c' } },
    { id: 'oxblood',    name: 'Oxblood',    light: { acc: '#9f1239', str: '#4d7c0f' }, dark: { acc: '#fb7185', str: '#b5d99c' } },
    { id: 'slate',      name: 'Slate',      light: { acc: '#334155', str: '#cbd5e1' }, dark: { acc: '#cbd5e1', str: '#7dd3d8' } }
];

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    updateThemeImages(theme);
}

function updateThemeImages(theme) {
    if (typeof document === 'undefined') {
        return;
    }
    const images = document.querySelectorAll('[data-image-light][data-image-dark]');
    images.forEach(img => {
        const target = theme === 'dark' ? img.dataset.imageDark : img.dataset.imageLight;
        if (target && img.getAttribute('src') !== target) {
            img.setAttribute('src', target);
        }
    });
}

// Набор CSS-переменных для палитры в конкретной теме.
// Неизвестный id откатывается к первой палитре.
function resolvePalette(id, isDark) {
    const variant = PALETTES.find(p => p.id === id) || PALETTES[0];
    const colors = isDark ? variant.dark : variant.light;
    return {
        id: variant.id,
        name: variant.name,
        acc: colors.acc,
        accSoft: colors.acc + (isDark ? '17' : '1a'),
        accLine: colors.acc + (isDark ? '3d' : '40'),
        str: colors.str
    };
}

// Класс пункта оглавления по уровню заголовка: h2 → lvl-2 и так далее.
function tocLinkClass(tagName) {
    const level = parseInt(String(tagName).replace(/^h/i, ''), 10);
    return `lvl-${isNaN(level) ? 2 : level}`;
}

function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\wа-яё\s-]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function compareValues(aValue, bValue) {
    const aNum = parseFloat(aValue);
    const bNum = parseFloat(bValue);

    if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
    }
    return aValue.localeCompare(bValue, 'ru', { sensitivity: 'base' });
}

// Экспорт для тестирования (только в Node.js окружении)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        applyTheme,
        highlightMatch,
        generateSlug,
        compareValues,
        resolvePalette,
        tocLinkClass,
        PALETTES
    };
}

// ========================================
// Основная логика приложения
// ========================================

const appPathPrefix = (typeof window !== 'undefined' && window.APP_PATH_PREFIX) || '';
const LS = { theme: 'theme', rail: 'rail', accent: 'accent' };

function store(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

// --------------------------------------------------------------- тема
function initTheme() {
    const buttons = document.querySelectorAll('[data-theme-set]');
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const saved = load(LS.theme);

    function paint(theme) {
        applyTheme(theme);
        buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === theme)));
    }

    paint(saved || (media.matches ? 'dark' : 'light'));

    buttons.forEach(button => {
        button.addEventListener('click', function () {
            paint(button.dataset.themeSet);
            store(LS.theme, button.dataset.themeSet);
        });
    });

    // Системную тему слушаем только пока пользователь не выбрал свою.
    media.addEventListener('change', function (e) {
        if (!load(LS.theme)) paint(e.matches ? 'dark' : 'light');
    });
}

// ------------------------------------------------------- левая панель
function initDrawer() {
    const drawer = document.getElementById('drawer');
    const scrim = document.getElementById('scrim');
    const toggle = document.getElementById('menu-toggle');
    const closeBtn = document.getElementById('drawer-close');
    if (!drawer || !toggle || !scrim) return;
    let lastFocus = null;

    function open() {
        lastFocus = document.activeElement;
        drawer.classList.add('is-open');
        scrim.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('is-locked');
        const input = drawer.querySelector('input');
        (input || drawer).focus({ preventScroll: true });
    }
    function close() {
        drawer.classList.remove('is-open');
        scrim.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-locked');
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    function isOpen() { return drawer.classList.contains('is-open'); }

    toggle.addEventListener('click', function () { isOpen() ? close() : open(); });
    scrim.addEventListener('click', function () { if (isOpen()) close(); });
    if (closeBtn) closeBtn.addEventListener('click', close);
    drawer.addEventListener('click', function (e) {
        if (e.target.closest('a[href]')) close();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen()) { e.preventDefault(); close(); }
    });
    // Легкая ловушка фокуса: пока панель открыта, Tab не уходит на страницу.
    drawer.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab' || !isOpen()) return;
        const f = drawer.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
}

// ------------------------------------------------- правая панель (TOC)
function initRail() {
    const shell = document.getElementById('shell');
    const btn = document.getElementById('rail-toggle');
    const rail = document.getElementById('rail');
    const scrim = document.getElementById('scrim');
    if (!shell || !btn) return;

    const mqNarrow = window.matchMedia('(max-width: 1100px)');

    // Оглавление пустое и справки нет — панель прятать целиком.
    if (rail && !rail.querySelector('.toc a') && !rail.querySelector('.railcard')) {
        btn.hidden = true;
        rail.hidden = true;
        shell.classList.remove('rail-open');
        return;
    }

    // На широком экране rail — часть сетки и открыт по умолчанию.
    // На узком он оверлей, и по умолчанию закрыт.
    set(mqNarrow.matches ? false : load(LS.rail) !== 'closed');

    function set(value) {
        shell.classList.toggle('rail-open', value);
        btn.setAttribute('aria-expanded', String(value));
        if (rail) rail.setAttribute('aria-hidden', String(!value));
        // Как оверлей rail ведет себя так же, как левая панель: затемнение и блок скролла.
        if (mqNarrow.matches && scrim) {
            scrim.classList.toggle('is-open', value);
            document.body.classList.toggle('is-locked', value);
        } else if (scrim && !value) {
            scrim.classList.remove('is-open');
            document.body.classList.remove('is-locked');
        }
    }

    if (scrim) scrim.addEventListener('click', function () {
        if (mqNarrow.matches && shell.classList.contains('rail-open')) set(false);
    });
    const railClose = document.getElementById('rail-close');
    if (railClose) railClose.addEventListener('click', function () { set(false); });
    btn.addEventListener('click', function () {
        const next = !shell.classList.contains('rail-open');
        set(next);
        if (!mqNarrow.matches) store(LS.rail, next ? 'open' : 'closed');
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mqNarrow.matches && shell.classList.contains('rail-open')) set(false);
    });
    // Смена брейкпоинта: пересобираем состояние под новый режим.
    mqNarrow.addEventListener('change', function () {
        set(mqNarrow.matches ? false : load(LS.rail) !== 'closed');
    });
    // На узком экране клик по пункту TOC закрывает оверлей.
    if (rail) rail.addEventListener('click', function (e) {
        if (mqNarrow.matches && e.target.closest('a[href^="#"]')) set(false);
    });
}

// ------------------------------------------------- генерация оглавления
function initTableOfContents() {
    const toc = document.getElementById('toc');
    const article = document.querySelector('.prose');
    if (!toc || !article) return;

    const headings = article.querySelectorAll('h2, h3, h4');
    if (!headings.length) return;

    const fragment = document.createDocumentFragment();
    headings.forEach((heading, index) => {
        // id обычно уже проставлен markdown-it-anchor; фолбэк — на случай
        // сырого HTML в контенте.
        if (!heading.id) {
            heading.id = generateSlug(heading.textContent.trim()) || `heading-${index}`;
        }

        // Текст без символа якорной ссылки.
        const clone = heading.cloneNode(true);
        clone.querySelectorAll('.anchor').forEach(a => a.remove());

        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = clone.textContent.trim();
        link.className = tocLinkClass(heading.tagName);
        fragment.appendChild(link);
    });

    toc.appendChild(fragment);
}

// ------------------------------------------- оглавление: активный пункт
function initScrollSpy() {
    const links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    const map = {};
    const targets = [];
    links.forEach(function (a) {
        const el = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
        if (el) { map[el.id] = a; targets.push(el); }
    });
    const visible = new Set();

    function paint() {
        let best = null;
        targets.forEach(function (t) { if (visible.has(t.id) && !best) best = t.id; });
        if (!best) return;
        links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        if (map[best]) { map[best].classList.add('is-active'); map[best].setAttribute('aria-current', 'true'); }
    }

    // Верхняя граница чуть ниже topbar + scroll-margin заголовков: иначе
    // переход по якорю подсвечивает предыдущий пункт, а не тот, куда прыгнули.
    const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (en.isIntersecting) visible.add(en.target.id); else visible.delete(en.target.id);
        });
        paint();
    }, { rootMargin: '-6% 0px -76% 0px', threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
}

// ------------------------------------------------------ прогресс чтения
function initProgress() {
    const bar = document.getElementById('progress');
    const article = document.querySelector('.doc__inner');
    const top = document.getElementById('to-top');
    if (!bar || !article) return;
    let ticking = false;

    function paint() {
        ticking = false;
        const start = article.offsetTop;
        const span = article.offsetHeight - window.innerHeight;
        let p = span > 0 ? (window.scrollY - start) / span : 1;
        p = Math.min(1, Math.max(0, p));
        bar.style.transform = 'scaleX(' + p + ')';
        if (top) top.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.8);
    }

    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    window.addEventListener('resize', paint, { passive: true });
    paint();

    if (top) top.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
    });
}

// ------------------------------------------------- копирование кода
function initCopy() {
    document.querySelectorAll('.code').forEach(function (block) {
        const btn = block.querySelector('.copy');
        const pre = block.querySelector('pre');
        if (!btn || !pre) return;

        btn.addEventListener('click', function () {
            const text = pre.innerText.replace(/\n+$/, '');

            function done() {
                btn.classList.add('is-done');
                const label = btn.querySelector('.copy__label');
                if (label) label.textContent = 'Готово';
                setTimeout(function () {
                    btn.classList.remove('is-done');
                    if (label) label.textContent = 'Копировать';
                }, 1600);
            }

            function fallback() {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.cssText = 'position:fixed;opacity:0;';
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); done(); } catch (e) {}
                document.body.removeChild(ta);
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, fallback);
            } else {
                fallback();
            }
        });
    });
}

// ------------------------------------------------- меню настроек
function initConfig() {
    const btn = document.getElementById('cfg-toggle');
    const menu = document.getElementById('cfg');
    if (!btn || !menu) return;

    function open(value, moveFocus) {
        menu.hidden = !value;
        btn.setAttribute('aria-expanded', String(value));
        // Фокус переносим только при открытии с клавиатуры: у мыши кольцо
        // фокуса на первой кнопке читается как «эта тема выбрана».
        if (value && moveFocus) {
            const first = menu.querySelector('button');
            if (first) first.focus({ preventScroll: true });
        }
    }

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        open(menu.hidden, e.detail === 0);   // detail === 0 → Enter/Space, не клик
    });
    document.addEventListener('click', function (e) {
        if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) open(false);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !menu.hidden) {
            e.preventDefault(); open(false); btn.focus();
        }
    });
    // Tab не должен уводить фокус из открытого меню на страницу.
    menu.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        let f = menu.querySelectorAll('button:not([hidden])');
        f = Array.prototype.filter.call(f, el => el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    open(false);
}

// ------------------------------------------------------------- палитра
const TICK = '<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
             'stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>';

function initPalette() {
    const list = document.getElementById('pal-list');
    const trigger = document.getElementById('pal-toggle');
    const nameEl = document.getElementById('pal-name');
    if (!list || !trigger) return;

    let current = load(LS.accent) || PALETTES[0].id;
    function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

    function apply(id) {
        const p = resolvePalette(id, isDark());
        const root = document.documentElement.style;
        // Инлайн на :root перебивает и светлую, и тёмную тему разом.
        root.setProperty('--acc', p.acc);
        root.setProperty('--acc-soft', p.accSoft);
        root.setProperty('--acc-line', p.accLine);
        root.setProperty('--t-dunder', p.acc);
        root.setProperty('--t-str', p.str);
        current = p.id;
        if (nameEl) nameEl.textContent = p.name;
        repaint();
    }

    // Кружки и подписи показывают оттенок текущей темы, иначе тёмные
    // варианты нечитаемы на тёмном фоне и наоборот.
    function repaint() {
        list.querySelectorAll('.cfg__opt').forEach(function (b) {
            b.style.setProperty('--opt', resolvePalette(b.dataset.id, isDark()).acc);
            b.setAttribute('aria-selected', String(b.dataset.id === current));
        });
    }

    PALETTES.forEach(function (variant) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cfg__opt';
        b.setAttribute('role', 'option');
        b.dataset.id = variant.id;
        b.innerHTML = '<i></i><span></span>' + TICK;
        b.querySelector('span').textContent = variant.name;
        b.addEventListener('click', function () {
            apply(variant.id);
            store(LS.accent, variant.id);
            setList(false);
            trigger.focus();
        });
        list.appendChild(b);
    });

    function setList(open) {
        list.hidden = !open;
        trigger.setAttribute('aria-expanded', String(open));
    }
    trigger.addEventListener('click', function () { setList(list.hidden); });
    setList(false);

    // Тему переключает другой модуль — ловим смену атрибута, чтобы не
    // заводить связь между ними.
    new MutationObserver(function () { apply(current); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    apply(current);
}

// --------------------------------------------------- сортировка таблиц
function initTableSorting() {
    const sortableHeaders = document.querySelectorAll('th.sortable');

    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const table = this.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const columnIndex = Array.from(this.parentElement.children).indexOf(this);
            const currentSort = this.classList.contains('sort-asc') ? 'asc' : 'desc';

            // Сбрасываем сортировку для всех заголовков в этой таблице
            table.querySelectorAll('th.sortable').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });

            // Определяем направление сортировки
            const sortDirection = currentSort === 'asc' ? 'desc' : 'asc';
            this.classList.add(`sort-${sortDirection}`);

            // Сортируем строки
            rows.sort((a, b) => {
                const aValue = a.children[columnIndex].textContent.trim();
                const bValue = b.children[columnIndex].textContent.trim();
                const comparison = compareValues(aValue, bValue);
                return sortDirection === 'asc' ? comparison : -comparison;
            });

            // Перестраиваем таблицу
            rows.forEach(row => tbody.appendChild(row));
        });
    });
}

// --------------------------------- поиск по всем страницам (Fuse.js)
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchContainer = document.querySelector('.drawer__search');

    if (!searchInput || !searchContainer) {
        return;
    }

    // Кэш для индекса поиска
    let fuse = null;
    let searchIndexLoaded = false;

    // Создаем контейнер для результатов поиска
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.style.display = 'none';
    searchContainer.appendChild(searchResults);

    // Загрузить индекс при первом взаимодействии
    function loadSearchIndex() {
        if (searchIndexLoaded) return Promise.resolve();

        return fetch(`${appPathPrefix}/search-index.json`)
            .then(response => response.json())
            .then(data => {
                // Инициализируем Fuse.js с индексом
                fuse = new Fuse(data, {
                    keys: [
                        { name: 'title', weight: 2 },
                        { name: 'content', weight: 1 }
                    ],
                    threshold: 0.3,  // Разумный порог для точности
                    minMatchCharLength: 2,  // Минимум 2 символа для совпадения
                    includeScore: true,
                    ignoreLocation: true,
                    distance: 100  // Умеренное расстояние для fuzzy matching
                });
                searchIndexLoaded = true;
            })
            .catch(error => {
                console.error('Ошибка загрузки индекса поиска:', error);
            });
    }

    // Обработчик ввода в поле поиска
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();

        if (query.length < 3) {
            hideSearchResults();
            return;
        }

        loadSearchIndex().then(() => {
            const results = fuse.search(query).slice(0, 10); // Ограничиваем до 10 результатов
            displaySearchResults(results, query);
        });
    });

    // Обработчик фокуса на поле поиска
    searchInput.addEventListener('focus', function() {
        if (searchInput.value.trim().length >= 3) {
            loadSearchIndex().then(() => {
                const query = searchInput.value.trim();
                const results = fuse.search(query).slice(0, 10);
                displaySearchResults(results, query);
            });
        }
    });

    // Обработчик потери фокуса
    searchInput.addEventListener('blur', function() {
        // Задержка чтобы успеть кликнуть по результатам
        setTimeout(() => {
            if (!searchResults.contains(document.activeElement)) {
                hideSearchResults();
            }
        }, 150);
    });

    // Горячие клавиши: Ctrl+K и «/» — обе открывают панель и ведут в поиск.
    document.addEventListener('keydown', function(e) {
        const inField = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
        const isSlash = e.key === '/' && !inField && !e.ctrlKey && !e.metaKey;
        const isCtrlK = (e.ctrlKey || e.metaKey) && e.key === 'k';
        if (!isSlash && !isCtrlK) return;

        e.preventDefault();
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle && menuToggle.getAttribute('aria-expanded') !== 'true') {
            menuToggle.click();   // открытие панели само уводит фокус в поиск
        } else {
            searchInput.focus();
        }
        searchInput.select();
    });

    // Обработчик клавиш в поле поиска
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchInput.blur();
            hideSearchResults();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const firstResult = searchResults.querySelector('.search-result-item');
            if (firstResult) {
                firstResult.click();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const firstResult = searchResults.querySelector('.search-result-item');
            if (firstResult) {
                firstResult.focus();
            }
        }
    });

    function displaySearchResults(results, query) {
        searchResults.innerHTML = '';

        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'search-no-results';
            noResults.textContent = 'Ничего не найдено';
            searchResults.appendChild(noResults);
        } else {
            results.forEach((result) => {
                const item = result.item;
                const resultItem = document.createElement('a');
                resultItem.className = 'search-result-item';
                resultItem.href = appPathPrefix + item.url;
                resultItem.setAttribute('tabindex', '0');
                resultItem.setAttribute('role', 'option');
                resultItem.setAttribute('aria-selected', 'false');

                // Подсвечиваем найденный текст в заголовке
                const highlightedTitle = highlightMatch(item.title, query);

                // Показываем фрагмент контента с контекстом
                const contextHtml = `<div class="search-result-item__title">${highlightedTitle}</div>`;
                const contentPreview = item.content.substring(0, 100);
                const highlightedContent = contentPreview ? `<div class="search-result-item__preview">${contentPreview}...</div>` : '';

                resultItem.innerHTML = contextHtml + highlightedContent;

                // Обработчик клика
                resultItem.addEventListener('click', function() {
                    hideSearchResults();
                    searchInput.blur();
                });

                // Обработчик клавиш
                resultItem.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        resultItem.click();
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextItem = resultItem.nextElementSibling;
                        if (nextItem) {
                            nextItem.focus();
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prevItem = resultItem.previousElementSibling;
                        if (prevItem) {
                            prevItem.focus();
                        } else {
                            searchInput.focus();
                        }
                    } else if (e.key === 'Escape') {
                        hideSearchResults();
                        searchInput.blur();
                    }
                });

                searchResults.appendChild(resultItem);
            });
        }

        searchResults.style.display = 'block';
        searchResults.classList.add('show');
        searchInput.setAttribute('aria-expanded', 'true');
        searchResults.setAttribute('role', 'listbox');
    }

    function hideSearchResults() {
        searchResults.classList.remove('show');
        // Задержка для завершения анимации
        setTimeout(() => {
            searchResults.style.display = 'none';
        }, 150);
        searchInput.setAttribute('aria-expanded', 'false');
    }
}

// ------------------------------------------------------------ бутстрап
function init() {
    initTheme();
    initTableOfContents();   // до initRail: тот решает, прятать ли панель
    initDrawer();
    initRail();
    initScrollSpy();
    initProgress();
    initCopy();
    initTableSorting();
    initSearch();
    initConfig();
    initPalette();
}

// Скрипт подключён в конце body без defer, поэтому DOMContentLoaded ещё
// впереди. Слушатель (а не немедленный вызов) заодно оставляет модуль
// безопасным для импорта в тестах.
document.addEventListener('DOMContentLoaded', init);
