(function () {
  'use strict';

  // Переход: экран заволакивает дымом, затем он рассеивается.
  var fog = document.getElementById('fog');
  var fogTitle = document.getElementById('fogTitle');
  var fogTimer;

  // Возврат кнопкой «назад»: страница достается из кеша уже в дыму
  window.addEventListener('pageshow', function () { fog.classList.remove('on'); });

  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      // Карточка с data-pan не уходит в дым: камера уезжает к стене (wall.js)
      if (card.hasAttribute('data-pan')) return;
      e.preventDefault();
      fogTitle.textContent = card.dataset.title;
      fog.classList.add('on');
      clearTimeout(fogTimer);
      // У раздела с готовой страницей дым не рассеивается здесь, а уносится на нее
      var href = card.getAttribute('href');
      if (href.charAt(0) !== '#') {
        fogTimer = setTimeout(function () {
          try { sessionStorage.setItem('fog', card.dataset.title); } catch (err) {}
          location.href = href;
        }, 1500);
        return;
      }
      fogTimer = setTimeout(function () { fog.classList.remove('on'); }, 2300);
    });
  });
})();
