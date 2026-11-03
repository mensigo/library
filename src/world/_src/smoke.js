(function () {
  'use strict';

  var canvas = document.getElementById('smoke');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Холст в половину разрешения кадра (1672x941): дым и так размыт.
  var W = 836, H = 470;
  var MOUTH = { x: 190, y: 198 };   // рот на кадре, в координатах холста
  var COAL = { x: 466, y: 180 };    // чашка кальяна

  // Страница может выключить выдох (он уже есть в видео) и переставить угли
  var exhaleOn = canvas.dataset.exhale !== 'off';
  if (canvas.dataset.coal) {
    var xy = canvas.dataset.coal.split(',');
    COAL = { x: +xy[0], y: +xy[1] };
  }
  var PERIOD = 10;                  // один цикл дыхания, секунды
  var EXHALE = 2.8;                 // сколько из них длится выдох

  var ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  function makeSprite(rgb) {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(' + rgb + ',.42)');
    grad.addColorStop(.5, 'rgba(' + rgb + ',.16)');
    grad.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  }

  // Серо-сиреневый дым с легким розовым и бирюзовым отливом от неона.
  // Рисуется обычным наложением: в режиме screen он над ярким окном
  // превращался в белый засвет, а не в дым.
  var sprites = [makeSprite('214,206,216'), makeSprite('216,180,206'), makeSprite('176,204,210')];
  var particles = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function emit(src, angle, speed, o) {
    particles.push({
      x: src.x + rand(-2, 2),
      y: src.y + rand(-2, 2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: o.r,
      grow: o.grow,
      life: 0,
      max: o.max,
      a: o.a,
      seed: Math.random() * 6.28,
      sprite: sprites[Math.random() < .6 ? 0 : (Math.random() < .5 ? 1 : 2)]
    });
  }

  var t = 0, last = 0, puffDebt = 0, wispDebt = 0;

  function frame(ts) {
    var dt = Math.min(.05, (ts - last) / 1000 || 0);
    last = ts;
    t += dt;

    var phase = t % PERIOD;
    if (exhaleOn && phase < EXHALE) {
      // Выдох нарастает и затухает, а не включается рывком
      puffDebt += dt * 90 * Math.sin(Math.PI * phase / EXHALE);
      while (puffDebt >= 1) {
        puffDebt -= 1;
        emit(MOUTH, rand(-.75, -.4), rand(26, 46), { r: rand(3, 5), grow: rand(5, 9), max: rand(5, 8), a: rand(.6, .95) });
      }
    }

    // Тонкая струйка от углей идет постоянно
    wispDebt += dt * 3;
    while (wispDebt >= 1) {
      wispDebt -= 1;
      emit(COAL, rand(-1.8, -1.35), rand(8, 14), { r: rand(2, 3), grow: rand(2, 4), max: rand(3, 5), a: rand(.25, .4) });
    }

    ctx.clearRect(0, 0, W, H);

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life += dt;
      if (p.life >= p.max) { particles.splice(i, 1); continue; }

      var drag = 1 - .45 * dt;
      p.vx *= drag;
      p.vy = p.vy * drag - 5 * dt;                       // дым теплый, тянется вверх
      p.x += (p.vx + Math.sin(t * .7 + p.seed) * 5) * dt;
      p.y += (p.vy + Math.cos(t * .5 + p.seed) * 3) * dt;
      p.r += p.grow * dt;

      var k = p.life / p.max;
      ctx.globalAlpha = p.a * Math.min(1, p.life / .12) * Math.pow(1 - k, 1.3);
      ctx.drawImage(p.sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
