// ========================================
// Утилитарные функции (используются в логике и тестах)
// ========================================

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
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
        compareValues
    };
}

// ========================================
// Основная логика приложения
// ========================================

const appPathPrefix = window.APP_PATH_PREFIX || '';

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация темы
    initTheme();

    // Инициализация сортировки таблиц
    initTableSorting();

    // Инициализация TOC
    initTableOfContents();

    // Инициализация поиска
    initSearch();

    // Инициализация скрытия navbar при прокрутке
    initNavbarScrollHide();

    // Инициализация переключения вкладок
    initNavbarTabs(appPathPrefix);
    
    const menuToggle = document.getElementById('menuToggle');
    const sidebarLeft = document.getElementById('sidebarLeft');
    const overlay = document.getElementById('sidebarOverlay');
    const body = document.body;

    function toggleMenu() {
        if (menuToggle && sidebarLeft) {
            menuToggle.classList.toggle('active');
            sidebarLeft.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
            body.classList.toggle('menu-open');
        }
    }

    // Клик по гамбургеру
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    // Клик по overlay (закрытие меню)
    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    // Клик по ссылке в меню (закрытие на мобильных)
    const navLinks = document.querySelectorAll('.sidebar-left a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                toggleMenu();
            }
        });
    });

    // Закрытие меню при изменении размера окна
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && sidebarLeft) {
            if (menuToggle) menuToggle.classList.remove('active');
            sidebarLeft.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });

    // Древовидная навигация - сворачивание/разворачивание
    const collapsibleItems = document.querySelectorAll('.tree-item-self.mod-collapsible');
    
    collapsibleItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Если клик по ссылке, не сворачиваем
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                // Но если клик по иконке, все равно сворачиваем
                if (!e.target.closest('.tree-item-icon')) {
                    return;
                }
            }

            const icon = this.querySelector('.tree-item-icon');
            const children = this.nextElementSibling;
            
            if (children && children.classList.contains('tree-item-children')) {
                const isCollapsed = children.classList.contains('is-collapsed');
                
                if (isCollapsed) {
                    children.classList.remove('is-collapsed');
                    if (icon) icon.classList.remove('is-collapsed');
                } else {
                    children.classList.add('is-collapsed');
                    if (icon) icon.classList.add('is-collapsed');
                }
                
                // Предотвращаем переход по ссылке, если клик был по иконке или области элемента
                if (e.target.closest('.tree-item-icon') || !e.target.closest('a')) {
                    e.preventDefault();
                }
            }
        });
    });

    // Автоматически разворачиваем родительские элементы активной страницы
    const activeItem = document.querySelector('.tree-item-self.mod-active');
    if (activeItem) {
        let current = activeItem.parentElement;
        while (current) {
            const children = current.querySelector('.tree-item-children');
            const icon = current.querySelector('.tree-item-icon');
            if (children && children.classList.contains('is-collapsed')) {
                children.classList.remove('is-collapsed');
                if (icon) icon.classList.remove('is-collapsed');
            }
            current = current.parentElement;
            if (!current || !current.classList.contains('tree-item')) {
                break;
            }
        }
    }

    // Обработчик клика на лого
    const logoLink = document.querySelector('.site-logo-link');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault();

            const currentPath = window.location.pathname;
            const currentHash = window.location.hash;

            // Если мы уже на главной странице и нет hash, просто переходим на главную
            if (currentPath === '/' && currentHash === '') {
                // Уже на главной без hash, ничего не делаем
                return;
            }

            // В остальных случаях переходим на главную с hash для принудительной активации Reviews
            window.location.href = `${appPathPrefix}/#reviews`;
        });
    }
});

// Функции для работы с темой
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Определяем начальную тему
    let initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    // Применяем тему
    applyTheme(initialTheme);
    
    // Обработчик клика на переключатель
    themeToggle.addEventListener('click', function() {
        const currentThemeAttr = document.documentElement.getAttribute('data-theme');
        // Если атрибут не установлен, определяем по системным настройкам
        const currentTheme = currentThemeAttr || (prefersDark ? 'dark' : 'light');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    // Слушаем изменения системной темы (только если пользователь не выбрал тему вручную)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// Функционал сортировки таблиц
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

// Генерация Table of Contents (Оглавление)
function initTableOfContents() {
    const tocNav = document.getElementById('tocNav');
    const contentArea = document.querySelector('.content-center, .content');
    
    if (!tocNav || !contentArea) {
        return;
    }

    // Находим все заголовки h2, h3, h4 в контенте
    const headings = contentArea.querySelectorAll('h2, h3, h4');
    
    if (headings.length === 0) {
        // Если заголовков нет, скрываем TOC
        const sidebarRight = document.querySelector('.sidebar-right');
        if (sidebarRight) {
            sidebarRight.style.display = 'none';
        }
        return;
    }

    // Создаем ID для заголовков, если их нет
    headings.forEach((heading, index) => {
        if (!heading.id) {
            const text = heading.textContent.trim();
            const slug = generateSlug(text);
            heading.id = slug || `heading-${index}`;
        }
    });

    // Генерируем ссылки TOC
    const fragment = document.createDocumentFragment();
    headings.forEach(heading => {
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        link.className = `toc-link toc-${heading.tagName.toLowerCase()}`;
        link.setAttribute('tabindex', '0');
        link.setAttribute('role', 'link');
        
        // Обработчик клика для плавной прокрутки
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.getElementById(heading.id);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Обновляем URL без перезагрузки
                history.pushState(null, null, `#${heading.id}`);
                updateActiveTocLink();
            }
        });

        // Обработчик нажатия Enter для доступности
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                link.click();
            }
        });
        
        fragment.appendChild(link);
    });

    tocNav.appendChild(fragment);

    // Отслеживание активного раздела при прокрутке
    let isScrolling = false;
    window.addEventListener('scroll', function() {
        if (!isScrolling) {
            window.requestAnimationFrame(function() {
                updateActiveTocLink();
                isScrolling = false;
            });
            isScrolling = true;
        }
    }, { passive: true });

    // Инициализируем активную ссылку
    updateActiveTocLink();
}

// Обновление активной ссылки в TOC
function updateActiveTocLink() {
    const tocLinks = document.querySelectorAll('.toc-link');
    const contentArea = document.querySelector('.content-center, .content');

    if (!contentArea || tocLinks.length === 0) {
        return;
    }

    const headings = contentArea.querySelectorAll('h2, h3, h4');
    let activeHeading = null;
    const scrollPosition = window.scrollY + 100; // Смещение для лучшего UX

    // Находим текущий активный заголовок
    headings.forEach(heading => {
        const headingTop = heading.offsetTop;
        if (scrollPosition >= headingTop) {
            activeHeading = heading;
        }
    });

    // Обновляем активные классы
    tocLinks.forEach(link => {
        link.classList.remove('active');
        if (activeHeading && link.href.endsWith(`#${activeHeading.id}`)) {
            link.classList.add('active');
        }
    });
}

// Функционал поиска по всем страницам (Fuse.js)
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchContainer = document.querySelector('.search-container');

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
                console.log('Search index loaded:', data.length, 'items');
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
                console.log('Fuse.js initialized');
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
            console.log('Search query:', query, 'Results found:', results.length);
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
    searchInput.addEventListener('blur', function(e) {
        // Задержка чтобы успеть кликнуть по результатам
        setTimeout(() => {
            if (!searchResults.contains(document.activeElement)) {
                hideSearchResults();
            }
        }, 150);
    });

    // Горячая клавиша Ctrl+K
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
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
                resultItem.addEventListener('click', function(e) {
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

// Скрытие navbar при прокрутке вниз
function initNavbarScrollHide() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScrollTop = 0;
    let isScrollingDown = false;
    let scrollThreshold = 100; // Минимальная прокрутка перед скрытием

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Не скрывать если прокрутка меньше порога
        if (scrollTop < scrollThreshold) {
            navbar.classList.remove('navbar--hidden');
            lastScrollTop = scrollTop;
            return;
        }

        // Определяем направление прокрутки
        if (scrollTop > lastScrollTop) {
            // Прокрутка вниз - скрываем navbar
            if (!isScrollingDown) {
                navbar.classList.add('navbar--hidden');
                isScrollingDown = true;
            }
        } else {
            // Прокрутка вверх - показываем navbar
            if (isScrollingDown) {
                navbar.classList.remove('navbar--hidden');
                isScrollingDown = false;
            }
        }

        lastScrollTop = scrollTop;
    }, { passive: true });
}

// Переключение вкладок в navbar
function initNavbarTabs(pathPrefix = appPathPrefix) {
    const navbarSections = document.querySelectorAll('.navbar__section');
    const sidebarLeft = document.getElementById('sidebarLeft');
    const basePrefix = pathPrefix || appPathPrefix || '';

    if (!navbarSections.length || !sidebarLeft) return;

    // Определяем активную вкладку на основе URL (приоритет над localStorage)
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash.substring(1); // Убираем #

    let activeSection;

    // Приоритет: hash > URL > localStorage
    if (currentHash === 'reviews') {
        activeSection = 'library';
        localStorage.setItem('activeSection', 'library');
    } else if (currentHash === 'notes') {
        activeSection = 'notes';
        localStorage.setItem('activeSection', 'notes');
    } else if (currentPath.includes('/notes/')) {
        activeSection = 'notes';
        localStorage.setItem('activeSection', 'notes');
    } else if (currentPath.includes('/reviews/')) {
        activeSection = 'library';
        localStorage.setItem('activeSection', 'library');
    } else {
        // На главной странице или других страницах используем сохраненную настройку или по умолчанию library
        activeSection = localStorage.getItem('activeSection') || 'library';
    }

    // Устанавливаем активную вкладку
    setActiveSection(activeSection);

    // Очищаем URL от hash, если он был обработан для переключения вкладки
    if (currentHash === 'reviews' || currentHash === 'notes') {
        const newUrl = window.location.pathname + (window.location.search || '');
        window.history.replaceState({}, document.title, newUrl);
    }

    // Обработчики кликов по вкладкам
    navbarSections.forEach(section => {
        section.addEventListener('click', function() {
            const sectionName = this.getAttribute('data-section');

            // Проверяем, нужно ли переходить на другую страницу
            const currentPath = window.location.pathname;
            const isOnNotesPage = currentPath.includes('/notes/');
            const isOnReviewsPage = currentPath.includes('/reviews/') || currentPath.includes('/anime/') || currentPath.includes('/philosophy/');

            if (sectionName === 'notes' && !isOnNotesPage) {
                // Переходим на главную страницу notes
                window.location.href = `${basePrefix}/notes/`;
                return;
            } else if (sectionName === 'library' && !isOnReviewsPage && currentPath !== '/') {
                // Переходим на главную страницу reviews (главную сайта)
                window.location.href = `${basePrefix}/#reviews`;
                return;
            }

            // Если уже на нужной странице, просто переключаем вкладку
            setActiveSection(sectionName);
            localStorage.setItem('activeSection', sectionName);
        });
    });

    function setActiveSection(sectionName) {
        // Обновляем активные классы в navbar
        navbarSections.forEach(section => {
            const sectionData = section.getAttribute('data-section');
            if (sectionData === sectionName) {
                section.classList.add('navbar__section--active');
            } else {
                section.classList.remove('navbar__section--active');
            }
        });

        // Обновляем навигацию в sidebar
        updateSidebarNavigation(sectionName);
    }

    function updateSidebarNavigation(sectionName) {
        const navTree = sidebarLeft.querySelector('.nav-tree');

        if (!navTree) return;

        // Скрываем все секции навигации КРОМЕ главной
        const navSections = navTree.querySelectorAll('.nav-section:not(.nav-section--main)');
        navSections.forEach(section => {
            section.style.display = 'none';
        });

        // Показываем соответствующую секцию
        if (sectionName === 'library') {
            // Показываем навигацию для reviews (аниме + философия)
            const animeSection = navTree.querySelector('.nav-section--anime');
            const philosophySection = navTree.querySelector('.nav-section--philosophy');

            if (animeSection) animeSection.style.display = 'block';
            if (philosophySection) philosophySection.style.display = 'block';
        } else if (sectionName === 'notes') {
            // Показываем навигацию для notes (Python)
            const notesSection = navTree.querySelector('.nav-section--notes-section');
            if (notesSection) notesSection.style.display = 'block';
        }
    }
}
