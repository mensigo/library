(function () {
  'use strict';

  // Cinema в варианте G: возврат в комнату.
  // Пришли из комнаты: возвращаемся по истории, а не кладем ее в историю второй раз
  var fromRoom = /index-g\.html/.test(document.referrer);
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Полосы въехали, кадр погас (cinema-g.css: .5s + .7s)
  var LEAVE = 1200;

  // Перед уходом въезжают полосы и кадр гаснет (.is-leaving в cinema-g.css).
  // Комната откроется в том же виде и размотается сама (cine.js).
  Array.prototype.forEach.call(document.querySelectorAll('[data-back]'), function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      if (document.body.classList.contains('is-leaving')) return;
      document.body.classList.add('is-leaving');
      setTimeout(function () {
        if (fromRoom) { history.back(); return; }
        // Прямой заход: комнате нужна метка, чтобы открыться в полосах на черном
        try { sessionStorage.setItem('cine', '1'); } catch (err) {}
        location.href = a.href;
      }, still ? 0 : LEAVE);
    });
  });

  // Пришли из комнаты (метка из cine.js). Полосы обычно уводит переход (vt.css), но
  // браузер иногда его пропускает: например, если страница открывалась дольше обычного.
  // Тогда страница появлялась сразу, и полосы пропадали рывком. В этом случае полосы
  // стоят с первого кадра и уезжают сами.
  var cineIn = null;
  try {
    cineIn = sessionStorage.getItem('cineIn');
    sessionStorage.removeItem('cineIn');
  } catch (e) {}

  function arrive() {
    document.body.classList.add('is-arriving');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { document.body.classList.remove('is-arriving'); });
    });
  }

  if (cineIn && !still) {
    if ('onpagereveal' in window) {
      window.addEventListener('pagereveal', function (e) {
        if (!e.viewTransition) arrive();
        else e.viewTransition.ready.catch(arrive);
      }, { once: true });
    } else arrive();
  }

  // Вернулись сюда кнопкой «вперед»: страница достается из кеша уже черной
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) document.body.classList.remove('is-leaving');
  });

  // A, стрелка влево и Escape ведут в комнату, как A у стены и на странице группы.
  // e.code не зависит от раскладки: на русской A - это «Ф».
  var back = document.querySelector('[data-back]');
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.key === 'Escape') {
      e.preventDefault();
      back.click();
    }
  });

  // Строки, у которых в пробе нет страницы
  Array.prototype.forEach.call(document.querySelectorAll('a.row[href="#"]'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });
})();
