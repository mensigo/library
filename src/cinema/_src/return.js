(function () {
  'use strict';

  // Возврат из Cinema в комнату (return.css). Уход из комнаты сюда - world/_src/cine.js.
  var backs = Array.prototype.slice.call(document.querySelectorAll('[data-back]'));
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Полосы въехали, кадр погас (return.css: .5s + .7s)
  var LEAVE = 1200;

  // Пришли из комнаты (она же ссылка «БИБЛИОТЕКА»): возвращаемся по истории,
  // а не кладем ее в историю второй раз. Сверяем пути referrer и ссылки, как
  // note.js со списком.
  function cameFrom(link) {
    try {
      var from = new URL(document.referrer);
      return from.origin === link.origin && from.pathname === link.pathname;
    } catch (err) {
      return false;
    }
  }

  var fromRoom = cameFrom(backs[backs.length - 1]);

  // Перед уходом въезжают полосы и кадр гаснет (.is-leaving в return.css).
  // Комната откроется в том же виде и размотается сама (cine.js).
  backs.forEach(function (a) {
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
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.key === 'Escape') {
      e.preventDefault();
      backs[backs.length - 1].click();
    }
  });
})();
