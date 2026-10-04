(function () {
  'use strict';

  // Приход с главной: страница открывается уже в дыму, и он рассеивается.
  // При прямом заходе или обновлении дыма нет.
  var fog = document.getElementById('fog');
  var arrived = null;
  try {
    arrived = sessionStorage.getItem('fog');
    sessionStorage.removeItem('fog');
  } catch (e) {}

  if (arrived) {
    var inner = fog.querySelector('.fog__inner');
    fog.style.transition = inner.style.transition = 'none';
    fog.classList.add('on');
    void fog.offsetWidth;
    fog.style.transition = inner.style.transition = '';
    setTimeout(function () { fog.classList.remove('on'); }, 350);
  }

  // Фильтр: тема из колонки справа и строка поиска работают вместе.
  var rows = Array.prototype.slice.call(document.querySelectorAll('.row'));
  var topics = Array.prototype.slice.call(document.querySelectorAll('.topic'));
  var find = document.getElementById('find');
  var empty = document.getElementById('empty');
  var tag = '';

  function apply() {
    var q = find.value.trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (row) {
      var byTag = !tag || row.dataset.tags.split(',').indexOf(tag) !== -1;
      var byText = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
      row.hidden = !(byTag && byText);
      if (!row.hidden) shown++;
    });
    empty.hidden = shown > 0;
  }

  topics.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tag = btn.dataset.tag;
      topics.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      apply();
    });
  });

  find.addEventListener('input', apply);

  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== find) {
      e.preventDefault();
      find.focus();
    } else if (e.key === 'Escape' && document.activeElement === find) {
      find.value = '';
      find.blur();
      apply();
    }
  });
})();
