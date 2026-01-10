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

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
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

                // Проверяем, являются ли значения числами
                const aNum = parseFloat(aValue);
                const bNum = parseFloat(bValue);

                let comparison = 0;
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    // Сортировка чисел
                    comparison = aNum - bNum;
                } else {
                    // Сортировка текста
                    comparison = aValue.localeCompare(bValue, 'ru', { sensitivity: 'base' });
                }

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
            const slug = text
                .toLowerCase()
                .replace(/[^\wа-яё\s-]/gi, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
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

// Функционал поиска по навигации
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchContainer = document.querySelector('.search-container');

    if (!searchInput || !searchContainer) {
        return;
    }

    // Кэш для навигационных элементов
    let navItemsCache = null;

    // Создаем контейнер для результатов поиска
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.style.display = 'none';
    searchContainer.appendChild(searchResults);

    // Флаг для отслеживания состояния поиска
    let isSearchActive = false;

    // Обработчик ввода в поле поиска
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim().toLowerCase();

        if (query.length === 0) {
            hideSearchResults();
            return;
        }

        // Собираем элементы при первом поиске
        if (!navItemsCache) {
            navItemsCache = collectNavigationItems();
        }

        const results = filterNavigationItems(navItemsCache, query);
        displaySearchResults(results, query);
    });

    // Обработчик фокуса на поле поиска
    searchInput.addEventListener('focus', function() {
        if (searchInput.value.trim().length > 0) {
            // Собираем элементы при первом поиске
            if (!navItemsCache) {
                navItemsCache = collectNavigationItems();
            }
            const query = searchInput.value.trim().toLowerCase();
            const results = filterNavigationItems(navItemsCache, query);
            displaySearchResults(results, query);
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
                // Имитируем клик по первому результату
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

    function collectNavigationItems() {
        const items = [];

        // Собираем все ссылки из навигации
        const navLinks = document.querySelectorAll('.sidebar-left a');

        navLinks.forEach(link => {
            const text = link.textContent.trim();
            const href = link.getAttribute('href');

            if (text && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                items.push({
                    text: text,
                    href: href,
                    element: link
                });
            }
        });

        return items;
    }

    function filterNavigationItems(items, query) {
        return items.filter(item => {
            // Удаляем эмодзи из текста для поиска
            const cleanText = item.text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().toLowerCase();
            return cleanText.includes(query);
        });
    }

    function displaySearchResults(results, query) {
        searchResults.innerHTML = '';

        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'search-no-results';
            noResults.textContent = 'Ничего не найдено';
            searchResults.appendChild(noResults);
        } else {
            results.forEach((result, index) => {
                const resultItem = document.createElement('a');
                resultItem.className = 'search-result-item';
                resultItem.href = result.href;
                resultItem.setAttribute('tabindex', '0');
                resultItem.setAttribute('role', 'option');
                resultItem.setAttribute('aria-selected', 'false');

                // Подсвечиваем найденный текст
                const highlightedText = highlightMatch(result.text, query);
                resultItem.innerHTML = highlightedText;

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
        isSearchActive = true;
    }

    function hideSearchResults() {
        searchResults.classList.remove('show');
        // Задержка для завершения анимации
        setTimeout(() => {
            searchResults.style.display = 'none';
        }, 150);
        searchInput.setAttribute('aria-expanded', 'false');
        isSearchActive = false;
    }

    function highlightMatch(text, query) {
        // Удаляем эмодзи для подсветки
        const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
        const regex = new RegExp(`(${query})`, 'gi');
        const highlighted = cleanText.replace(regex, '<mark>$1</mark>');

        // Возвращаем текст с эмодзи если он был
        const emoji = text.match(/[\u{1F300}-\u{1F9FF}]/gu);
        if (emoji) {
            return emoji[0] + ' ' + highlighted;
        }

        return highlighted;
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
