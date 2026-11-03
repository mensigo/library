(function () {
  'use strict';

  // Переход из комнаты: экран заволакивает дымом, затем он рассеивается.
  var fog = document.getElementById('fog');
  var fogTitle = document.getElementById('fogTitle');
  var fogKicker = document.getElementById('fogKicker');
  var fogSoon = document.getElementById('fogSoon');
  var fogTimer;

  // Возврат кнопкой «назад»: страница достается из кеша уже в дыму
  window.addEventListener('pageshow', function () { fog.classList.remove('on'); });

  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      // Карточка с data-pan не уходит в дым: камера уезжает к стене (wall.js),
      // с data-cine - комната становится кадром фильма (cine.js)
      if (card.hasAttribute('data-pan') || card.hasAttribute('data-cine')) return;
      e.preventDefault();
      fogTitle.textContent = card.dataset.title;
      // Раздел еще не готов: дым говорит об этом и держится дольше, чтобы успеть прочитать
      var soon = fogSoon ? card.dataset.soon : '';
      if (fogSoon) {
        fogSoon.textContent = soon || '';
        fogSoon.hidden = !soon;
        fogKicker.textContent = soon ? 'в работе' : 'переход';
      }
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
      fogTimer = setTimeout(function () { fog.classList.remove('on'); }, soon ? 3200 : 2300);
    });
  });
})();
