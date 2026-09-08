/* ======================================================================
   PITCH · NOTES — поведение страницы.
   Ничего не импортирует, ничего не требует. Все инициализаторы —
   независимые функции: если разметки нет, функция молча выходит.
   ====================================================================== */
(function () {
  'use strict';

  var mqNarrow = window.matchMedia('(max-width: 1100px)');
  var LS = { theme: 'pitch-notes-theme', rail: 'pitch-notes-rail', palette: 'pitch-notes-accent' };

  function store(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  /* --------------------------------------------------------------- тема */
  function initTheme() {
    var btns = document.querySelectorAll('[data-theme-set]');
    var saved = load(LS.theme);
    apply(saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

    function apply(mode) {
      document.documentElement.setAttribute('data-theme', mode);
      btns.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.themeSet === mode));
      });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        apply(b.dataset.themeSet);
        store(LS.theme, b.dataset.themeSet);
      });
    });
  }


  /* ------------------------------------------------------- левая панель */
  function initDrawer() {
    var drawer = document.getElementById('drawer');
    var scrim = document.getElementById('scrim');
    var toggle = document.getElementById('menu-toggle');
    var closeBtn = document.getElementById('drawer-close');
    if (!drawer || !toggle || !scrim) return;
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      drawer.classList.add('is-open');
      scrim.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
      var input = drawer.querySelector('input');
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
    scrim.addEventListener('click', close);
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
      var f = drawer.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ------------------------------------------------- правая панель (TOC) */
  function initRail() {
    var shell = document.getElementById('shell');
    var btn = document.getElementById('rail-toggle');
    if (!shell || !btn) return;

    // На широком экране rail — часть сетки и открыт по умолчанию.
    // На узком он оверлей, и по умолчанию закрыт.
    var saved = load(LS.rail);
    var open = mqNarrow.matches ? false : saved !== 'closed';
    set(open);

    var railEl = document.getElementById('rail');
    var scrim = document.getElementById('scrim');

    function set(v) {
      shell.classList.toggle('rail-open', v);
      btn.setAttribute('aria-expanded', String(v));
      if (railEl) railEl.setAttribute('aria-hidden', String(!v));
      // Как оверлей rail ведет себя так же, как левая панель: затемнение и блок скролла.
      if (mqNarrow.matches && scrim) {
        scrim.classList.toggle('is-open', v);
        document.body.classList.toggle('is-locked', v);
      } else if (scrim && !v) {
        scrim.classList.remove('is-open');
        document.body.classList.remove('is-locked');
      }
    }
    if (scrim) scrim.addEventListener('click', function () {
      if (mqNarrow.matches && shell.classList.contains('rail-open')) set(false);
    });
    var railClose = document.getElementById('rail-close');
    if (railClose) railClose.addEventListener('click', function () { set(false); });
    btn.addEventListener('click', function () {
      var next = !shell.classList.contains('rail-open');
      set(next);
      if (!mqNarrow.matches) store(LS.rail, next ? 'open' : 'closed');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mqNarrow.matches && shell.classList.contains('rail-open')) set(false);
    });
    // Смена брейкпоинта: пересобираем состояние под новый режим.
    var onChange = function () { set(mqNarrow.matches ? false : load(LS.rail) !== 'closed'); };
    mqNarrow.addEventListener ? mqNarrow.addEventListener('change', onChange)
                              : mqNarrow.addListener(onChange);
    // На узком экране клик по пункту TOC закрывает оверлей.
    var rail = document.getElementById('rail');
    if (rail) rail.addEventListener('click', function (e) {
      if (mqNarrow.matches && e.target.closest('a[href^="#"]')) set(false);
    });
  }

  /* ------------------------------------------- оглавление: активный пункт */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    var targets = [];
    links.forEach(function (a) {
      var el = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (el) { map[el.id] = a; targets.push(el); }
    });
    var visible = new Set();

    function paint() {
      var best = null;
      targets.forEach(function (t) { if (visible.has(t.id) && !best) best = t.id; });
      if (!best) return;
      links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
      if (map[best]) { map[best].classList.add('is-active'); map[best].setAttribute('aria-current', 'true'); }
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) visible.add(en.target.id); else visible.delete(en.target.id);
      });
      paint();
      // Верхняя граница чуть ниже topbar + scroll-margin заголовков: иначе
      // переход по якорю подсвечивает предыдущий пункт, а не тот, куда прыгнули.
    }, { rootMargin: '-6% 0px -76% 0px', threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ------------------------------------------------------ прогресс чтения */
  function initProgress() {
    var bar = document.getElementById('progress');
    var article = document.querySelector('.doc__inner');
    var top = document.getElementById('to-top');
    if (!bar || !article) return;
    var ticking = false;

    function paint() {
      ticking = false;
      var start = article.offsetTop;
      var span = article.offsetHeight - window.innerHeight;
      var p = span > 0 ? (window.scrollY - start) / span : 1;
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
      window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------- копирование кода */
  function initCopy() {
    document.querySelectorAll('.code').forEach(function (block) {
      var btn = block.querySelector('.copy');
      var pre = block.querySelector('pre');
      if (!btn || !pre) return;
      btn.addEventListener('click', function () {
        var text = pre.innerText.replace(/\n+$/, '');
        var done = function () {
          btn.classList.add('is-done');
          var label = btn.querySelector('.copy__label');
          if (label) label.textContent = 'Готово';
          setTimeout(function () {
            btn.classList.remove('is-done');
            if (label) label.textContent = 'Копировать';
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else { fallback(); }

        function fallback() {
          var ta = document.createElement('textarea');
          ta.value = text; ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;opacity:0;';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
    });
  }

  /* --------------------------------------------- фильтр по списку заметок */
  function initFilter() {
    var input = document.getElementById('nav-filter');
    if (!input) return;
    var links = Array.prototype.slice.call(document.querySelectorAll('.drawer__body .navlink'));
    var empty = document.getElementById('nav-empty');

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      links.forEach(function (a) {
        var hit = !q || a.textContent.toLowerCase().indexOf(q) !== -1;
        a.classList.toggle('is-hidden', !hit);
        if (hit) shown++;
      });
      document.querySelectorAll('.navgroup').forEach(function (g) {
        var any = g.querySelector('.navlink:not(.is-hidden)');
        g.style.display = any ? '' : 'none';
      });
      if (empty) empty.hidden = shown !== 0;
    });
    // «/» ставит фокус в поиск — привычка из docs-сайтов.
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        var toggle = document.getElementById('menu-toggle');
        if (toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
        else input.focus();
      }
    });
  }


  /* ------------------------------------------------------------- палитра */
  /* Каждый вариант несёт две тройки — для светлой и тёмной темы — плюс цвет
     строкового литерала: у тёплых акцентов холодная бирюза в коде заметно
     спорит с акцентом, поэтому она едет вместе с ним. */
  var PALETTES = [
    { id: 'teal',       name: 'Teal',       light: { acc: '#0f766e', str: '#0e7490' }, dark: { acc: '#5eead4', str: '#7dd3d8' } },
    { id: 'forest',     name: 'Forest',     light: { acc: '#15803d', str: '#0e7490' }, dark: { acc: '#6ee7a5', str: '#7dd3d8' } },
    { id: 'violet',     name: 'Violet',     light: { acc: '#6d28d9', str: '#0e7490' }, dark: { acc: '#c4a6ff', str: '#7dd3d8' } },
    { id: 'ink',        name: 'Ink blue',   light: { acc: '#2563eb', str: '#0e7490' }, dark: { acc: '#8ab4f8', str: '#7dd3d8' } },
    { id: 'terracotta', name: 'Terracotta', light: { acc: '#b03a17', str: '#4d7c0f' }, dark: { acc: '#e8845c', str: '#b5d99c' } },
    { id: 'ochre',      name: 'Ochre',      light: { acc: '#a16207', str: '#4d7c0f' }, dark: { acc: '#e0a458', str: '#b5d99c' } },
    { id: 'oxblood',    name: 'Oxblood',    light: { acc: '#9f1239', str: '#4d7c0f' }, dark: { acc: '#fb7185', str: '#b5d99c' } },
    { id: 'slate',      name: 'Slate',      light: { acc: '#334155', str: '#0e7490' }, dark: { acc: '#cbd5e1', str: '#7dd3d8' } }
  ];

  var TICK = '<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
             'stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>';

  function initPalette() {
    var list = document.getElementById('pal-list');
    var trigger = document.getElementById('pal-toggle');
    var nameEl = document.getElementById('pal-name');
    if (!list || !trigger) return;

    var current = load(LS.palette) || PALETTES[0].id;
    function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
    function find(id) {
      for (var i = 0; i < PALETTES.length; i++) if (PALETTES[i].id === id) return PALETTES[i];
      return PALETTES[0];
    }

    function apply(id) {
      var v = find(id);
      var c = isDark() ? v.dark : v.light;
      var root = document.documentElement.style;
      // Инлайн на :root перебивает и светлую, и тёмную тему разом.
      root.setProperty('--acc', c.acc);
      root.setProperty('--acc-soft', c.acc + (isDark() ? '17' : '1a'));
      root.setProperty('--acc-line', c.acc + (isDark() ? '3d' : '40'));
      root.setProperty('--t-dunder', c.acc);
      root.setProperty('--t-str', c.str);
      current = v.id;
      if (nameEl) nameEl.textContent = v.name;
      repaint();
    }

    // Кружки и подписи показывают оттенок текущей темы, иначе тёмные
    // варианты нечитаемы на тёмном фоне и наоборот.
    function repaint() {
      list.querySelectorAll('.cfg__opt').forEach(function (b) {
        var v = find(b.dataset.id);
        b.style.setProperty('--opt', isDark() ? v.dark.acc : v.light.acc);
        b.setAttribute('aria-selected', String(v.id === current));
      });
    }

    PALETTES.forEach(function (v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cfg__opt';
      b.setAttribute('role', 'option');
      b.dataset.id = v.id;
      b.innerHTML = '<i></i><span></span>' + TICK;
      b.querySelector('span').textContent = v.name;
      b.addEventListener('click', function () {
        apply(v.id);
        store(LS.palette, v.id);
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

  /* -------------------------------------------------- меню настроек */
  function initConfig() {
    var btn = document.getElementById('cfg-toggle');
    var menu = document.getElementById('cfg');
    if (!btn || !menu) return;

    function open(v, moveFocus) {
      menu.hidden = !v;
      btn.setAttribute('aria-expanded', String(v));
      // Фокус переносим только при открытии с клавиатуры: у мыши кольцо
      // фокуса на первой кнопке читается как «эта тема выбрана».
      if (v && moveFocus) {
        var first = menu.querySelector('button');
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
      var f = menu.querySelectorAll('button:not([hidden])');
      f = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    open(false);
  }

  function init() {
    initTheme(); initDrawer(); initRail(); initScrollSpy();
    initProgress(); initCopy(); initFilter();
    initConfig(); initPalette();
  }
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
