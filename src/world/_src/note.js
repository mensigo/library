(function () {
  'use strict';

  // Страница заметки: линия прочитанного, содержание, шаги по разделам
  // и возврат к списку. Сам переход со списка делает браузер (vt.css).
  var bar = document.getElementById('bar');
  var progress = document.getElementById('progress');
  var heads = Array.prototype.slice.call(document.querySelectorAll('.note h2:not(.u-kicker)'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Раздел считается начатым, когда его заголовок поднялся под крошки
  var EDGE = 96;

  // Метка списка больше не нужна: назад по истории он вернется таким, каким его оставили
  try { sessionStorage.removeItem('note'); } catch (err) {}

  // Текст поднимается только при входе
  setTimeout(function () { document.body.classList.remove('arriving'); }, 1800);

  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    // Линия не гаснет совсем: в начале от нее остается уголек
    progress.style.setProperty('--p', Math.max(.012, Math.min(1, p)).toFixed(4));
    bar.classList.toggle('is-scrolled', window.scrollY > 40);

    var at = -1;
    heads.forEach(function (h, i) {
      if (h.getBoundingClientRect().top <= EDGE) at = i;
    });
    // Оглавлений два (в колонке и свернутое на узком экране), поэтому ссылку ищем
    // по id заголовка, а не по номеру
    var on = at < 0 ? null : '#' + heads[at].id;
    links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === on); });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // W и S ведут к предыдущему и следующему разделу; выше первого - начало заметки
  function step(dir) {
    var y = window.scrollY;
    var tops = heads.map(function (h) {
      return Math.round(h.getBoundingClientRect().top + y - EDGE + 12);
    });
    var to = null;
    if (dir > 0) {
      tops.forEach(function (t) { if (to === null && t > y + 4) to = t; });
    } else {
      to = 0;
      tops.forEach(function (t) { if (t < y - 4) to = t; });
    }
    if (to === null) return;
    window.scrollTo({ top: to, behavior: still ? 'auto' : 'smooth' });
  }

  // Путь назад к списку - back.js. Пришли не со списка: он по метке сразу выберет строку
  // заметки (note-group.js сверяет ее с путем ссылки строки). По истории метка не нужна:
  // список вернется таким, каким его оставили.
  wayBack({
    before: function (byHistory) {
      if (byHistory) return;
      try { sessionStorage.setItem('note', location.pathname); } catch (err) {}
    }
  });

  // Свернутое оглавление закрывается, как только выбран раздел. Закрываем до перехода
  // по якорю, чтобы браузер считал положение заголовка уже без открытого списка.
  Array.prototype.forEach.call(document.querySelectorAll('.toc--m a'), function (a) {
    a.addEventListener('click', function () { a.closest('details').open = false; });
  });

  // W и S - по разделам (A, стрелка влево и Escape к списку - back.js)
  var STEPS = { KeyW: -1, KeyS: 1 };

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var dir = STEPS[e.code];
    if (dir) {
      e.preventDefault();
      step(dir);
    }
  });
})();
