(function () {
  'use strict';

  // Блог (лента и страница поста): вход из черного, уход в черное. Из комнаты сюда
  // ведет карточка с data-dusk (fog.js): комната гаснет, эта страница проявляется.
  // «Назад» (data-back): в ленте - комната, на странице поста - лента. Пришли оттуда -
  // возвращаемся по истории, иначе переходим по ссылке.
  var dusk = document.getElementById('dusk');
  var backs = Array.prototype.slice.call(document.querySelectorAll('[data-back]'));
  var back = backs[backs.length - 1];
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // = .dusk.is-out в blog.css и .fog--dusk в room.css
  var OUT = still ? 0 : 450;
  var leaving = false;

  // Пришли со страницы «назад»: та же сверка путей, что в note.js. Для страницы поста
  // «назад» - лента, и годится любая ее страница: /blog/page/2/ → пост → назад вернет
  // на вторую.
  function cameFrom(link) {
    try {
      var from = new URL(document.referrer);
      if (from.origin !== link.origin) return false;
      if (from.pathname === link.pathname) return true;
      return /\/blog\/$/.test(link.pathname) && from.pathname.indexOf(link.pathname + 'page/') === 0;
    } catch (err) {
      return false;
    }
  }

  var fromBack = cameFrom(back);

  function enter() {
    leaving = false;
    dusk.classList.remove('is-clear', 'is-out');
    void dusk.offsetWidth;
    requestAnimationFrame(function () { dusk.classList.add('is-clear'); });
  }

  enter();

  // Назад на эту страницу из bfcache: она осталась черной после ухода
  window.addEventListener('pageshow', function (e) { if (e.persisted) enter(); });

  function leave(href, useHistory) {
    if (leaving) return;
    leaving = true;
    dusk.classList.add('is-out');
    setTimeout(function () {
      if (useHistory && fromBack && history.length > 1) history.back();
      else location.href = href;
    }, OUT);
  }

  // Любая ссылка на этот же сайт уходит через черное: следующая страница блога
  // проявится из него, комната снимет его сама (fog.js, pageshow)
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if (!a || a.target || a.origin !== location.origin) return;
    if (a.pathname === location.pathname && a.hash) return;
    e.preventDefault();
    leave(a.href, a.hasAttribute('data-back'));
  });

  // A, стрелка влево и Escape - назад. e.code не зависит от раскладки: на русской A - «Ф».
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.key === 'Escape') {
      e.preventDefault();
      leave(back.href, true);
    }
  });

  // Кнопка в шапке блока кода копирует его код (как в note.js)
  Array.prototype.forEach.call(document.querySelectorAll('.copy'), function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.closest('.code').querySelector('pre');
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(pre.textContent).then(function () {
        btn.classList.add('is-done');
        setTimeout(function () { btn.classList.remove('is-done'); }, 1400);
      });
    });
  });
})();
