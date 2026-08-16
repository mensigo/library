/* Главная раздела «Аниме» · поведение.
   Всё необязательное — reveal при скролле и подсветка фона списка.
   Страница полностью работоспособна и без этого файла. */
(function () {
  'use strict';

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

  // --- фон списка следует за наведением и за фокусом (Tab работает так же) ---
  var stage = document.getElementById('stage');
  if (stage) {
    stage.querySelectorAll('.row').forEach(function (row) {
      var on = function () { stage.dataset.active = row.dataset.title; };
      var off = function () { stage.removeAttribute('data-active'); };
      row.addEventListener('mouseenter', on);
      row.addEventListener('mouseleave', off);
      row.addEventListener('focus', on);
      row.addEventListener('blur', off);
    });
    stage.addEventListener('mouseleave', function () { stage.removeAttribute('data-active'); });
  }

  // --- фильтры сортировки (демо: переключают только состояние) ---
  var filters = document.querySelector('.filters');
  if (filters) {
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      filters.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
    });
  }
})();
