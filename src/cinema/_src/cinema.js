/* Cinema · общее поведение.
   Склеивается с JS страницы в /cinema/<страница>.js (см. bundles.njk).
   Всё необязательное — страница полностью читается и без этого файла. */
(function () {
  'use strict';

  // Инлайн-скрипт в <head> снимет .js на load, если этого флага не будет.
  window.cinemaReady = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- появление блоков при скролле ---
  var risers = document.querySelectorAll('.rise');
  if (reduce || !('IntersectionObserver' in window)) {
    risers.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
    risers.forEach(function (el) { io.observe(el); });
  }
})();
