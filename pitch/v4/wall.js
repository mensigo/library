(function () {
  'use strict';

  // Камера у стены, когда в адресе #notes: работает кнопка «назад» и прямая ссылка.
  var hero = document.getElementById('hero');
  var panel = hero.querySelector('.panel');
  var ui = document.getElementById('wallui');
  var crumb = document.getElementById('crumb');
  var cards = Array.prototype.slice.call(panel.querySelectorAll('.card'));
  var groups = Array.prototype.slice.call(ui.querySelectorAll('.group'));
  var sigils = Array.prototype.slice.call(hero.querySelectorAll('.sigil'));
  var caps = Array.prototype.slice.call(hero.querySelectorAll('.keys kbd'));
  var noHover = window.matchMedia('(hover: none)').matches;

  // В каждом из двух мест выбран один пункт: карточка в комнате, группа у стены.
  // Курсор и клавиши W/S двигают один и тот же выбор.
  var card = 0;
  var group = 0;
  var drawTimer;

  function atWall() { return hero.classList.contains('at-wall'); }

  function pickCard(i) {
    card = (i + cards.length) % cards.length;
    cards.forEach(function (c, n) { c.classList.toggle('is-active', !noHover && n === card); });
  }

  // Знак на стене рисуется для выбранной группы; show=false гасит все.
  function pickGroup(i, show) {
    group = (i + groups.length) % groups.length;
    var name = show === false ? null : groups[group].dataset.g;
    sigils.forEach(function (s) { s.classList.toggle('on', s.dataset.g === name); });
    groups.forEach(function (g) { g.classList.toggle('is-on', g.dataset.g === name); });
  }

  function sync() {
    var wall = location.hash === '#notes';
    hero.classList.toggle('at-wall', wall);
    panel.inert = wall;
    ui.inert = !wall;
    crumb.textContent = wall ? 'заметки' : 'главная';
    clearTimeout(drawTimer);
    pickGroup(group, false);
    // Знак проявляется, когда камера уже доехала
    if (wall) drawTimer = setTimeout(function () { pickGroup(group); }, 1300);
  }

  function leave() {
    history.pushState('', '', location.pathname + location.search);
    sync();
  }

  cards.forEach(function (c, n) {
    c.addEventListener('mouseenter', function () { pickCard(n); });
    c.addEventListener('focus', function () { pickCard(n); });
  });

  groups.forEach(function (g, n) {
    g.addEventListener('mouseenter', function () { clearTimeout(drawTimer); pickGroup(n); });
    g.addEventListener('focus', function () { clearTimeout(drawTimer); pickGroup(n); });
    g.addEventListener('click', function (e) {
      if (g.getAttribute('aria-disabled') === 'true') {
        e.preventDefault();
        pickGroup(n);
      }
    });
  });

  document.getElementById('back').addEventListener('click', leave);

  // WASD и стрелки. e.code не зависит от раскладки: на русской W - это «Ц».
  var KEYS = {
    KeyW: 'w', ArrowUp: 'w',
    KeyS: 's', ArrowDown: 's',
    KeyA: 'a', ArrowLeft: 'a',
    KeyD: 'd', ArrowRight: 'd'
  };

  function flash(k) {
    caps.forEach(function (cap) {
      if (cap.dataset.k !== k) return;
      cap.classList.add('hit');
      setTimeout(function () { cap.classList.remove('hit'); }, 160);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && atWall()) { leave(); return; }

    var k = KEYS[e.code];
    if (!k || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    // Настройки открыты: стрелки и буквы принадлежат им
    if (document.getElementById('gear').getAttribute('aria-expanded') === 'true') return;
    e.preventDefault();
    flash(k);

    var step = k === 'w' ? -1 : k === 's' ? 1 : 0;
    if (atWall()) {
      if (step) { clearTimeout(drawTimer); pickGroup(group + step); }
      else if (k === 'd') groups[group].click();
      else leave();
    } else {
      if (step) pickCard(card + step);
      else if (k === 'd') cards[card].click();
    }
  });

  window.addEventListener('hashchange', sync);
  pickCard(0);
  sync();
})();
