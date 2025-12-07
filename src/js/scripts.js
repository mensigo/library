document.addEventListener('DOMContentLoaded', function() {
    // Инициализация темы
    initTheme();
    
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const body = document.body;

    function toggleMenu() {
        menuToggle.classList.toggle('active');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        body.classList.toggle('menu-open');
    }

    // Клик по гамбургеру
    menuToggle.addEventListener('click', toggleMenu);

    // Клик по overlay (закрытие меню)
    overlay.addEventListener('click', toggleMenu);

    // Клик по ссылке в меню (закрытие на мобильных)
    const navLinks = document.querySelectorAll('.sidebar a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                toggleMenu();
            }
        });
    });

    // Закрытие меню при изменении размера окна
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            menuToggle.classList.remove('active');
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
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
