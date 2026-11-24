(function () {
  'use strict';

  // Путь назад (GLOSSARY.md: way back) - общий для страницы группы, заметки, блога и Cinema.
  // Первая часть их бандлов (world/bundles.njk, cinema/bundles.njk); страница вызывает
  // wayBack(...) один раз.
  //
  // «Назад» - ссылки [data-back]; цель - последняя из них. Клик по любой из них, A, стрелка
  // влево или Escape уводят назад: по истории, если страницу открыли с этой цели (сверяем
  // origin и путь referrer и ссылки: у ссылки бывает хеш, у referrer его нет), иначе по
  // ссылке. В новой вкладке referrer есть, а истории нет - тогда тоже по ссылке.
  //
  // Странице остается свое:
  //   also(from, link)  - другие пути, которые считаются целью (лента: любая ее страница)
  //   before(byHistory) - метки для следующей страницы (sessionStorage) перед уходом
  //   hold(go)          - пауза перед уходом (затемнение, полосы); go() уводит.
  //                       Без hold уходим сразу.
  function cameFrom(link, also) {
    try {
      var from = new URL(document.referrer);
      if (from.origin !== link.origin) return false;
      return from.pathname === link.pathname || !!(also && also(from, link));
    } catch (err) {
      return false;
    }
  }

  // Клик с модификатором или не левой кнопкой - открыть в новой вкладке, скачать:
  // это обычная ссылка
  function plainClick(e) {
    return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button);
  }

  window.wayBack = function (opts) {
    opts = opts || {};
    var backs = Array.prototype.slice.call(document.querySelectorAll('[data-back]'));
    if (!backs.length) return;
    var link = backs[backs.length - 1];
    var byHistory = cameFrom(link, opts.also) && history.length > 1;
    var leaving = false;

    backs.forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (!plainClick(e)) return;
        e.preventDefault();
        if (leaving) return;
        leaving = true;
        if (opts.before) opts.before(byHistory);
        var go = function () {
          if (byHistory) history.back();
          else location.href = a.href;
        };
        if (opts.hold) opts.hold(go);
        else go();
      });
    });

    // Вернулись на страницу из кеша (bfcache): с нее уже уходили
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) leaving = false;
    });

    // Клавиши идут тем же путем, что и клик по ссылке.
    // e.code не зависит от раскладки: на русской A - это «Ф».
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.key === 'Escape') {
        e.preventDefault();
        link.click();
      }
    });
  };
})();
