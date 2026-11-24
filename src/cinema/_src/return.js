(function () {
  'use strict';

  // Возврат из Cinema в комнату (return.css). Уход из комнаты сюда - world/_src/cine.js.
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Полосы въехали, кадр погас (return.css: .5s + .7s)
  var LEAVE = 1200;

  // Путь назад в комнату (ссылка «БИБЛИОТЕКА», A, стрелка влево, Escape) - back.js
  // (world/_src). Перед уходом въезжают полосы и кадр гаснет (.is-leaving в return.css).
  // Комната откроется в том же виде и размотается сама (cine.js).
  wayBack({
    // Пришли не из комнаты: ей нужна метка, чтобы открыться в полосах на черном
    before: function (byHistory) {
      if (byHistory) return;
      try { sessionStorage.setItem('cine', '1'); } catch (err) {}
    },
    hold: function (go) {
      document.body.classList.add('is-leaving');
      setTimeout(go, still ? 0 : LEAVE);
    }
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
})();
