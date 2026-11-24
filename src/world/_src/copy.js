(function () {
  'use strict';

  // Кнопка в шапке блока кода копирует его код (заметка и блог: бандлы note.js, blog.js)
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
