(function () {
  'use strict';

  // Блог (лента и страница поста): вход из черного, уход в черное. Из комнаты сюда
  // ведет карточка с data-dusk (fog.js): комната гаснет, эта страница проявляется.
  // «Назад» (data-back, back.js): в ленте - комната, на странице поста - лента.
  var dusk = document.getElementById('dusk');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // = .dusk.is-out в blog.css и .fog--dusk в room.css
  var OUT = still ? 0 : 450;
  var leaving = false;

  function enter() {
    leaving = false;
    dusk.classList.remove('is-clear', 'is-out');
    void dusk.offsetWidth;
    requestAnimationFrame(function () { dusk.classList.add('is-clear'); });
  }

  enter();

  // Назад на эту страницу из bfcache: она осталась черной после ухода
  window.addEventListener('pageshow', function (e) { if (e.persisted) enter(); });

  // Уход в черное; go() уводит, когда оно сгустилось
  function leave(go) {
    if (leaving) return;
    leaving = true;
    dusk.classList.add('is-out');
    setTimeout(go, OUT);
  }

  // Назад - тоже через черное. Для страницы поста «назад» - лента, и годится любая ее
  // страница: /blog/page/2/ → пост → назад вернет на вторую.
  wayBack({
    also: function (from, link) {
      return /\/blog\/$/.test(link.pathname) && from.pathname.indexOf(link.pathname + 'page/') === 0;
    },
    hold: leave
  });

  // Любая другая ссылка на этот же сайт уходит через черное: следующая страница блога
  // проявится из него, комната снимет его сама (fog.js, pageshow). Клик по «назад»
  // сюда приходит уже с defaultPrevented (back.js).
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if (!a || a.target || a.origin !== location.origin) return;
    if (a.pathname === location.pathname && a.hash) return;
    e.preventDefault();
    leave(function () { location.href = a.href; });
  });
})();
