(function () {
  'use strict';

  // Вариант G: уход из комнаты в Cinema и возвращение (cine.css).
  // Сам переход между страницами делает браузер (vt.css), здесь то, что до и после него.
  var hero = document.getElementById('hero');
  var card = hero.querySelector('.card[data-cine]');
  if (!card) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Полосы въехали, свет погас, кадр разгорелся (cine.css: .9s + .7s)
  var LEAVE = 1600;
  var backTimer;

  card.addEventListener('click', function (e) {
    // Открытие в новой вкладке остается обычной ссылкой
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    if (hero.classList.contains('is-cine')) return;
    // Только что вернулись из Cinema: у панели и HUD еще задержка возврата
    clearTimeout(backTimer);
    hero.classList.remove('is-cine-back', 'is-cine-lift');
    hero.classList.add('is-cine');
    // Метка для страницы Cinema: если браузер пропустит переход, полосы она уведет сама
    try { sessionStorage.setItem('cineIn', '1'); } catch (err) {}
    setTimeout(function () { location.href = card.href; }, still ? 0 : LEAVE);
  });

  // Возврат из Cinema. Комната открывается в полосах на черном, как ее оставила
  // страница Cinema (cinema-g.js), черное сходит, и почти сразу комната разматывается.
  var LIFT = 150;   // через сколько после начала .is-cine-lift (.45s в cine.css)

  function dark() {
    clearTimeout(backTimer);
    hero.classList.remove('is-cine-back', 'is-cine-lift');
    hero.classList.add('is-cine', 'is-cine-dark');
  }

  function lift() {
    if (!hero.classList.contains('is-cine-dark')) return;
    hero.classList.add('is-cine-lift');
    setTimeout(unwind, still ? 0 : LIFT);
  }

  // .is-cine-lift остается до конца: черное еще сходит, и без класса оно погасло бы рывком
  function unwind() {
    hero.classList.remove('is-cine', 'is-cine-dark');
    hero.classList.add('is-cine-back');
    backTimer = setTimeout(function () { hero.classList.remove('is-cine-back', 'is-cine-lift'); }, 1500);
  }

  // Прямой заход по ссылке со страницы Cinema
  // (<link rel="expect"> в index-g.html держит отрисовку до этого места)
  var fromCinema = null;
  try {
    fromCinema = sessionStorage.getItem('cine');
    sessionStorage.removeItem('cine');
  } catch (e) {}
  if (fromCinema && !location.hash) dark();

  // Возврат кнопкой «назад»: страница достается из кеша с горящим кадром, его надо
  // погасить до первой отрисовки. pagereveal приходит до нее, pageshow - после,
  // поэтому, где pagereveal есть, полагаемся только на него.
  // Переход между страницами пропускаем: обе черные, растворять нечего, а он держал
  // черный экран лишние полсекунды. Черное сходит со следующего кадра: в тот же кадр
  // браузеру не от чего вести переход.
  function reveal(e) {
    if (!hero.classList.contains('is-cine')) return;
    dark();
    if (e.viewTransition) e.viewTransition.skipTransition();
    requestAnimationFrame(function () { requestAnimationFrame(lift); });
  }

  if ('onpagereveal' in window) window.addEventListener('pagereveal', reveal);
  else window.addEventListener('pageshow', reveal);
})();
