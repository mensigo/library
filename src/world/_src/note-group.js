(function () {
  'use strict';

  // Страница группы заметок: фильтр и поиск, выбор строки с клавиатуры, уход в заметку
  // и возврат к стене.
  var backs = Array.prototype.slice.call(document.querySelectorAll('[data-back]'));
  var group = document.body.dataset.g;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Пришли со стены (она же ссылка «к стене»): возвращаемся по истории, а не кладем
  // в нее стену второй раз. Сверяем пути: у ссылки есть #notes, а в referrer хеша нет.
  function cameFrom(link) {
    try {
      var from = new URL(document.referrer);
      return from.origin === link.origin && from.pathname === link.pathname;
    } catch (err) {
      return false;
    }
  }

  var fromWall = cameFrom(backs[backs.length - 1]);

  // Строки появляются по одной только при входе, а не каждый раз, когда фильтр
  // возвращает их в список
  setTimeout(function () { document.body.classList.remove('arriving'); }, 1600);

  // ---------- фильтр ----------

  // Тема из колонки справа и строка поиска работают вместе.
  var rows = Array.prototype.slice.call(document.querySelectorAll('.row'));
  var topics = Array.prototype.slice.call(document.querySelectorAll('.topic'));
  var find = document.getElementById('find');
  var empty = document.getElementById('empty');
  var tag = '';

  function apply() {
    var q = find.value.trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (row) {
      var byTag = !tag || row.dataset.tags.split(',').indexOf(tag) !== -1;
      var byText = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
      row.hidden = !(byTag && byText);
      if (!row.hidden) shown++;
    });
    empty.hidden = shown > 0;
  }

  topics.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tag = btn.dataset.tag;
      topics.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      apply();
    });
  });

  find.addEventListener('input', apply);

  // ---------- уход в заметку ----------

  // Сам переход делает браузер (vt.css): у открытой строки (.is-open в notes.css)
  // название получает имя, под которым его ждет страница заметки.
  var opened = null;

  function open(row) {
    if (opened) opened.classList.remove('is-open');
    opened = row;
    row.classList.add('is-open');
  }

  // Переход назад сводит заметку с открытой строкой; после него имя больше не нужно
  function settle() {
    document.body.classList.remove('is-going');
    setTimeout(function () {
      if (opened && !document.body.classList.contains('is-going')) {
        opened.classList.remove('is-open');
        opened = null;
      }
    }, 1000);
  }

  rows.forEach(function (row) {
    row.addEventListener('click', function (e) {
      // Открытие в новой вкладке остается обычной ссылкой
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      if (document.body.classList.contains('is-going')) return;
      open(row);
      // Пауза перед уходом: остальные строки гаснут, у открытой остается название
      // и уголек во всю ширину. 300 мс = переходы .is-going в notes.css.
      document.body.classList.add('is-going');
      setTimeout(function () { location.href = row.href; }, still ? 0 : 300);
    });
  });

  // Возврат кнопкой «назад»: страница достается из кеша такой, какой с нее ушли
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) settle();
  });

  // Возврат по ссылке с заметки: строка заново получает имена и выбор.
  // В метке путь заметки (note.js), строку ищем по пути ее ссылки.
  var note = null;
  try {
    note = sessionStorage.getItem('note');
    sessionStorage.removeItem('note');
  } catch (err) {}

  if (note) {
    var row = rows.filter(function (r) { return r.pathname === note; })[0];
    if (row) {
      document.body.classList.remove('arriving');
      document.body.classList.add('by-keys');
      open(row);
      row.focus({ focusVisible: true });
      row.classList.add('is-on');
      settle();
    }
  }

  // ---------- возврат к стене ----------

  function leave(e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    // Стена по этой метке сразу покажет знак группы (wall.js)
    try { sessionStorage.setItem('wall', group); } catch (err) {}
    if (fromWall && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  }

  backs.forEach(function (a) { a.addEventListener('click', leave); });

  // ---------- клавиши ----------

  // W и S, как у стены, ходят по заметкам. Выбранная строка - это строка в фокусе:
  // подсветка у нее та же, что под курсором (.row.is-on в notes.css).
  var STEPS = { KeyW: -1, ArrowUp: -1, KeyS: 1, ArrowDown: 1 };

  function pickRow(step) {
    // Только те строки, что пережили фильтр и поиск
    var shown = rows.filter(function (r) { return !r.hidden; });
    if (!shown.length) return;
    var at = shown.indexOf(document.activeElement);
    // Ничего не выбрано: шагаем от строки под курсором, если он на списке
    if (at === -1) at = shown.indexOf(document.querySelector('.row:hover'));
    var next = at === -1 ? (step > 0 ? 0 : shown.length - 1)
      : Math.min(shown.length - 1, Math.max(0, at + step));
    // Пока выбирают с клавиатуры, курсор строки не подсвечивает (.by-keys в notes.css)
    document.body.classList.add('by-keys');
    shown[next].focus({ focusVisible: true });
    // Не все браузеры считают фокус из скрипта видимым, поэтому подсветку держит класс
    shown[next].classList.add('is-on');
    shown[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // / ставит курсор в поиск, Escape в поиске очищает его.
  // W и S выбирают заметку, D открывает ее.
  // A, стрелка влево и Escape ведут к стене, как A у стены ведет в комнату.
  // e.code не зависит от раскладки: на русской A - это «Ф».
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== find) {
      e.preventDefault();
      find.focus();
      return;
    }
    if (e.key === 'Escape' && document.activeElement === find) {
      find.value = '';
      find.blur();
      apply();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var step = STEPS[e.code];
    if (step) {
      e.preventDefault();
      pickRow(step);
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      // D открывает выбранную заметку, как у стены открывает группу
      if (!document.activeElement.classList.contains('row')) return;
      e.preventDefault();
      document.activeElement.click();
    } else if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.key === 'Escape') {
      e.preventDefault();
      backs[backs.length - 1].click();
    }
  });

  // Мышь сдвинулась: выбор возвращается к курсору, а строка с клавиатуры гаснет.
  // Координаты сверяем, потому что при прокрутке списка браузер шлет mousemove
  // и без движения мыши.
  var mx = -1, my = -1;
  document.addEventListener('mousemove', function (e) {
    var moved = e.screenX !== mx || e.screenY !== my;
    mx = e.screenX;
    my = e.screenY;
    if (!moved || !document.body.classList.contains('by-keys')) return;
    document.body.classList.remove('by-keys');
    if (document.activeElement.classList.contains('row')) document.activeElement.blur();
  });

  document.addEventListener('focusout', function (e) {
    if (e.target.classList) e.target.classList.remove('is-on');
  });
})();
