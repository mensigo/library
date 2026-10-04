(function () {
  'use strict';

  var PERIOD = 30;        // секунды между стартами анимации (ролик + пауза на первом кадре)
  var FADE = 0.6;         // секунды: насколько конец ролика перекрывается первым кадром
  var KEY = 'heroVideo';  // localStorage: 'on' / 'off'
  var videos = Array.prototype.slice.call(document.querySelectorAll('.stage__loop'));
  if (videos.length < 2) return;

  var cur = 0;
  var switching = false;
  var timer = null;

  // Заплатки: участки кадра (data-r — доли кадра), которые двигаются поверх
  // стоп-кадра в паузе: торс «дышит», язычки пламени колышутся
  var patches = Array.prototype.slice.call(document.querySelectorAll('.patch')).map(function (el) {
    var r = el.dataset.r.split(',').map(Number);
    el.style.left = r[0] * 100 + '%';
    el.style.top = r[1] * 100 + '%';
    el.style.width = r[2] * 100 + '%';
    el.style.height = r[3] * 100 + '%';
    return { el: el, r: r };
  });

  function startBreath(v) {
    if (v.readyState < 2) return;
    patches.forEach(function (p) {
      var w = Math.round(v.videoWidth * p.r[2]);
      var h = Math.round(v.videoHeight * p.r[3]);
      p.el.width = w;
      p.el.height = h;
      p.el.getContext('2d').drawImage(v, v.videoWidth * p.r[0], v.videoHeight * p.r[1], w, h, 0, 0, w, h);
      p.el.classList.add('on');
    });
  }

  function stopBreath() {
    patches.forEach(function (p) { p.el.classList.remove('on'); });
  }

  function show(v, seconds) {
    v.style.transition = 'opacity ' + seconds + 's linear';
    v.style.opacity = 1;
  }

  function hide(v) {
    v.style.transition = 'none';
    v.style.opacity = 0;
  }

  function play(v) {
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  // Без сохраненного выбора видео выключено у тех, кто просил в системе меньше движения
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var enabled = saved ? saved === 'on' : !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Играющий ролик растворяется в первом кадре второй копии, которая стоит на паузе.
  // Она и запустится в следующий раз, а отыгравшая перематывается в начало.
  function toStill() {
    if (switching) return;
    switching = true;
    var a = videos[cur];
    var b = videos[1 - cur];
    a.style.zIndex = 1;
    b.style.zIndex = 2;
    show(b, FADE);
    setTimeout(function () {
      a.pause();
      hide(a);
      a.currentTime = 0;
      cur = 1 - cur;
      switching = false;
      startBreath(videos[cur]);
    }, FADE * 1000 + 60);
  }

  function tick() {
    var a = videos[cur];
    if (!switching && !a.paused && a.duration && a.currentTime >= a.duration - FADE) toStill();
    requestAnimationFrame(tick);
  }

  function puff() {
    if (!enabled || switching || !videos[cur].paused || document.hidden) return;
    stopBreath();
    play(videos[cur]);
  }

  function schedule() {
    clearInterval(timer);
    timer = setInterval(puff, PERIOD * 1000);
  }

  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
    if (on) {
      puff();
      schedule();
    } else if (!videos[cur].paused) {
      toStill();
    }
  }

  // Первый показ: кадр проявляется из темноты, без подмены постера на видео
  function reveal() {
    show(videos[0], 0.8);
    if (!enabled) startBreath(videos[0]);
  }

  if (enabled) {
    videos[0].addEventListener('playing', function () { show(videos[0], 0.8); }, { once: true });
    play(videos[0]);
  } else if (videos[0].readyState >= 2) {
    reveal();
  } else {
    videos[0].addEventListener('loadeddata', reveal, { once: true });
  }

  schedule();
  requestAnimationFrame(tick);

  // ---------- настройки ----------

  var gear = document.getElementById('gear');
  var pop = document.getElementById('settings');
  var sw = document.getElementById('videoSwitch');
  if (!gear || !pop || !sw) return;

  function setOpen(open) {
    pop.hidden = !open;
    gear.setAttribute('aria-expanded', String(open));
  }

  sw.setAttribute('aria-checked', String(enabled));

  sw.addEventListener('click', function () {
    var on = sw.getAttribute('aria-checked') !== 'true';
    sw.setAttribute('aria-checked', String(on));
    setEnabled(on);
  });

  gear.addEventListener('click', function () { setOpen(pop.hidden); });

  document.addEventListener('click', function (e) {
    if (!pop.hidden && !e.target.closest('.settings')) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !pop.hidden) {
      setOpen(false);
      gear.focus();
    }
  });
})();
