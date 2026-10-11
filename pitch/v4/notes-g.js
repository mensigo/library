(function () {
  'use strict';

  // Страница группы в варианте G: возврат к стене. Фильтр и поиск - в notes.js.
  var backs = Array.prototype.slice.call(document.querySelectorAll('[data-back]'));
  var group = document.body.dataset.g;
  // Пришли со стены: возвращаемся по истории, а не кладем в нее стену второй раз
  var fromWall = /index-g\.html/.test(document.referrer);

  // Строки появляются по одной только при входе, а не каждый раз, когда фильтр
  // возвращает их в список
  setTimeout(function () { document.body.classList.remove('arriving'); }, 1600);

  function leave(e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    // Стена по этой метке сразу покажет знак группы (g.js)
    try { sessionStorage.setItem('wall', group); } catch (err) {}
    if (fromWall && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  }

  backs.forEach(function (a) { a.addEventListener('click', leave); });

  // A, стрелка влево и Escape ведут к стене, как A у стены ведет в комнату.
  // e.code не зависит от раскладки: на русской A - это «Ф».
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.code !== 'KeyA' && e.code !== 'ArrowLeft' && e.key !== 'Escape') return;
    e.preventDefault();
    backs[backs.length - 1].click();
  });
})();
