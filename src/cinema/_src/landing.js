/* Cinema · главная. Склеивается после cinema.js в /cinema/landing.js. */
(function () {
  'use strict';

  // --- фон списка следует за наведением и за фокусом (Tab работает так же) ---
  var stage = document.getElementById('stage');
  if (!stage) return;
  stage.querySelectorAll('.row').forEach(function (row) {
    var on = function () { stage.dataset.active = row.dataset.title; };
    var off = function () { stage.removeAttribute('data-active'); };
    row.addEventListener('mouseenter', on);
    row.addEventListener('mouseleave', off);
    row.addEventListener('focus', on);
    row.addEventListener('blur', off);
  });
  stage.addEventListener('mouseleave', function () { stage.removeAttribute('data-active'); });
})();
