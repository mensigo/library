(function () {
  'use strict';

  // Вариант G: уход со стены на страницу группы и возвращение к стене.
  // Сам переход делает браузер (vt.css), здесь только то, что до и после него.
  var hero = document.getElementById('hero');
  var groups = Array.prototype.slice.call(hero.querySelectorAll('.group'));
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // wall.js рисует знак группы по mouseenter; тем же событием выбираем ее отсюда
  function pick(g) { g.dispatchEvent(new Event('mouseenter')); }

  groups.forEach(function (g) {
    g.addEventListener('click', function (e) {
      if (g.getAttribute('aria-disabled') === 'true') return;
      // Открытие в новой вкладке остается обычной ссылкой
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      if (hero.classList.contains('is-going')) return;
      pick(g);
      // Пауза перед уходом: остальные группы гаснут, ореол знака гаснет, вспыхивает и втягивается в линию
      // и знак моргает (sigil-pulse и sigil-blink в g.css, длительность та же)
      hero.classList.add('is-going');
      g.classList.add('is-going');
      setTimeout(function () { location.href = g.href; }, still ? 0 : 350);
    });
  });

  // Возврат кнопкой «назад»: страница достается из кеша такой, какой с нее ушли
  window.addEventListener('pageshow', function () {
    hero.classList.remove('is-going');
    groups.forEach(function (g) { g.classList.remove('is-going'); });
  });

  // Возврат по ссылке со страницы группы: знак уже на стене, заново его не рисуем,
  // иначе ему не из чего вырасти
  var from = null;
  try {
    from = sessionStorage.getItem('wall');
    sessionStorage.removeItem('wall');
  } catch (e) {}

  if (from && location.hash === '#notes') {
    hero.classList.add('is-instant');
    groups.forEach(function (g) { if (g.dataset.g === from) pick(g); });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.remove('is-instant'); });
    });
  }
})();
