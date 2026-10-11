(function () {
  'use strict';

  // Страница группы в варианте G: возврат к стене. Фильтр и поиск - в notes.js.
  var backs = Array.prototype.slice.call(document.querySelectorAll('[data-back]'));
  var group = document.body.dataset.g;
  // Пришли со стены: возвращаемся по истории, а не кладем в нее стену второй раз
  var fromWall = /index-g\.html/.test(document.referrer);

  // Строки появляются по одной только при входе, а не каждый раз, когда фильтр
  // возвращает их в список
  setTimeout(function () { document.body.classList.remove('arriving'); }, 1600);

  function leave(e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    // Стена по этой метке сразу покажет знак группы (g.js)
    try { sessionStorage.setItem('wall', group); } catch (err) {}
    if (fromWall && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  }

  backs.forEach(function (a) { a.addEventListener('click', leave); });

  // W и S выбирают заметку, D открывает ее.
  // A, стрелка влево и Escape ведут к стене, как A у стены ведет в комнату.
  // e.code не зависит от раскладки: на русской A - это «Ф».
  document.addEventListener('keydown', function (e) {
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

  // W и S, как у стены, ходят по заметкам. Выбранная строка - это строка в фокусе:
  // подсветка у нее та же, что под курсором (.row.is-on в notes-g.css).
  var STEPS = { KeyW: -1, ArrowUp: -1, KeyS: 1, ArrowDown: 1 };

  function pickRow(step) {
    // Только те строки, что пережили фильтр и поиск
    var rows = Array.prototype.slice.call(document.querySelectorAll('.row:not([hidden])'));
    if (!rows.length) return;
    var at = rows.indexOf(document.activeElement);
    // Ничего не выбрано: шагаем от строки под курсором, если он на списке
    if (at === -1) at = rows.indexOf(document.querySelector('.row:hover'));
    var next = at === -1 ? (step > 0 ? 0 : rows.length - 1)
      : Math.min(rows.length - 1, Math.max(0, at + step));
    // Пока выбирают с клавиатуры, курсор строки не подсвечивает (.by-keys в notes-g.css)
    document.body.classList.add('by-keys');
    rows[next].focus({ focusVisible: true });
    // Не все браузеры считают фокус из скрипта видимым, поэтому подсветку держит класс
    rows[next].classList.add('is-on');
    rows[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

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
