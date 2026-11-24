/**
 * @jest-environment node
 */

// Путь назад через его интерфейс (src/world/_src/back.js): wayBack({ also, before, hold }),
// ссылки [data-back], клавиши. Каждая проверка - свое окно jsdom: настоящие referrer
// и длина истории, back.js загружен так же, как в бандле, обычным скриптом.
//
// Переход jsdom умеет только внутри страницы, поэтому страница лежит на / , а ее «назад» -
// /#notes, как у страницы группы: уход по ссылке виден по location.hash.

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const SRC = fs.readFileSync(path.join(__dirname, '../src/world/_src/back.js'), 'utf8');
const URL_ = 'http://localhost/';
const LINK = '<a id="back" href="/#notes" data-back>к стене</a>';

function page({ html = LINK, referrer, history = 2 } = {}) {
  const dom = new JSDOM(`<!doctype html><body>${html}<input id="find"></body>`, {
    url: URL_, referrer, runScripts: 'outside-only'
  });
  const w = dom.window;
  // Сколько страниц уже в истории вкладки: новая вкладка - 1
  for (let i = 1; i < history; i++) w.history.pushState(null, '', URL_);
  const went = { back: 0 };
  w.history.back = () => { went.back++; };
  w.eval(SRC);
  const by = [];
  const way = (opts = {}) => w.wayBack({ before: (h) => by.push(h), ...opts });
  const click = (sel = '#back', init = {}) =>
    w.document.querySelector(sel).dispatchEvent(
      new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }));
  const key = (init, target = w.document.body) =>
    target.dispatchEvent(new w.KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
  return {
    w, went, by, way, click, key,
    // Ушли по ссылке, а не по истории
    get linked() { return w.location.hash === '#notes'; }
  };
}

describe('по истории или по ссылке', () => {
  test('пришли с цели: назад по истории, без перехода по ссылке', () => {
    const p = page({ referrer: 'http://localhost/' });
    p.way();
    const done = p.click();
    expect(done).toBe(false);
    expect(p.went.back).toBe(1);
    expect(p.linked).toBe(false);
    expect(p.by).toEqual([true]);
  });

  test('хеш ссылки не мешает: сверяются origin и путь', () => {
    const p = page({ referrer: 'http://localhost/?x=1' });
    p.way();
    p.click();
    expect(p.went.back).toBe(1);
  });

  test('прямой заход (нет referrer): по ссылке', () => {
    const p = page();
    p.way();
    p.click();
    expect(p.went.back).toBe(0);
    expect(p.linked).toBe(true);
    expect(p.by).toEqual([false]);
  });

  test('пришли с другой страницы сайта: по ссылке', () => {
    const p = page({ referrer: 'http://localhost/blog/' });
    p.way();
    p.click();
    expect(p.went.back).toBe(0);
    expect(p.linked).toBe(true);
  });

  test('тот же путь на другом сайте: по ссылке', () => {
    const p = page({ referrer: 'http://example.com/' });
    p.way();
    p.click();
    expect(p.linked).toBe(true);
  });

  test('новая вкладка с цели (referrer есть, истории нет): по ссылке, а не в никуда', () => {
    const p = page({ referrer: 'http://localhost/', history: 1 });
    p.way();
    p.click();
    expect(p.went.back).toBe(0);
    expect(p.linked).toBe(true);
    expect(p.by).toEqual([false]);
  });

  test('also добавляет пути, которые считаются целью', () => {
    const also = (from, link) => from.pathname.indexOf('/page/') === 0 && link.pathname === '/';
    const yes = page({ referrer: 'http://localhost/page/2/' });
    yes.way({ also });
    yes.click();
    expect(yes.went.back).toBe(1);

    const no = page({ referrer: 'http://localhost/page/2/' });
    no.way();
    no.click();
    expect(no.went.back).toBe(0);
  });

  test('цель - последняя [data-back]; любая из них уводит назад', () => {
    const html = '<a id="crumb" href="/blog/" data-back>блог</a>' + LINK;
    const p = page({ html, referrer: 'http://localhost/' });
    p.way();
    p.click('#crumb');
    expect(p.went.back).toBe(1);
  });

  test('без [data-back] ничего не делает', () => {
    const p = page({ html: '' });
    expect(() => p.way()).not.toThrow();
    p.key({ code: 'KeyA', key: 'a' });
    expect(p.by).toEqual([]);
  });
});

describe('клик', () => {
  test.each([
    ['meta', { metaKey: true }],
    ['ctrl', { ctrlKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
    ['средняя кнопка', { button: 1 }]
  ])('с модификатором (%s) - обычная ссылка', (_, init) => {
    const p = page({ referrer: 'http://localhost/' });
    p.way();
    const done = p.click('#back', init);
    expect(done).toBe(true);
    expect(p.went.back).toBe(0);
    expect(p.by).toEqual([]);
  });
});

describe('клавиши', () => {
  test.each([
    ['A', { code: 'KeyA', key: 'a' }],
    ['A на русской раскладке', { code: 'KeyA', key: 'ф' }],
    ['стрелка влево', { code: 'ArrowLeft', key: 'ArrowLeft' }],
    ['Escape', { code: 'Escape', key: 'Escape' }],
    ['Shift+A', { code: 'KeyA', key: 'A', shiftKey: true }]
  ])('%s - назад', (_, init) => {
    const p = page({ referrer: 'http://localhost/' });
    p.way();
    const done = p.key(init);
    expect(done).toBe(false);
    expect(p.went.back).toBe(1);
  });

  test.each([
    ['meta', { metaKey: true }],
    ['ctrl', { ctrlKey: true }],
    ['alt', { altKey: true }]
  ])('с модификатором (%s) - мимо', (_, mod) => {
    const p = page({ referrer: 'http://localhost/' });
    p.way();
    expect(p.key({ code: 'KeyA', key: 'a', ...mod })).toBe(true);
    expect(p.went.back).toBe(0);
  });

  test('в поле ввода - мимо', () => {
    const p = page({ referrer: 'http://localhost/' });
    p.way();
    p.key({ code: 'KeyA', key: 'a' }, p.w.document.getElementById('find'));
    p.key({ code: 'Escape', key: 'Escape' }, p.w.document.getElementById('find'));
    expect(p.went.back).toBe(0);
  });

  test('другие клавиши - мимо', () => {
    const p = page({ referrer: 'http://localhost/' });
    p.way();
    expect(p.key({ code: 'KeyD', key: 'd' })).toBe(true);
    expect(p.went.back).toBe(0);
  });
});

describe('hold и повторный уход', () => {
  test('hold держит уход, пока не вызовет go()', () => {
    let go = null;
    const p = page();
    p.way({ hold: (g) => { go = g; } });
    p.click();
    expect(p.by).toEqual([false]);
    expect(p.linked).toBe(false);
    go();
    expect(p.linked).toBe(true);
  });

  test('второй клик или клавиша во время ухода ничего не делают', () => {
    let go = null;
    const p = page({ referrer: 'http://localhost/' });
    p.way({ hold: (g) => { go = g; } });
    p.click();
    expect(p.click()).toBe(false);
    p.key({ code: 'KeyA', key: 'a' });
    go();
    expect(p.by).toEqual([true]);
    expect(p.went.back).toBe(1);
  });

  test('страница из кеша (pageshow persisted) снова может уйти', () => {
    const p = page({ referrer: 'http://localhost/' });
    p.way();
    p.click();
    p.w.dispatchEvent(new p.w.PageTransitionEvent('pageshow', { persisted: true }));
    p.click();
    expect(p.went.back).toBe(2);
  });

  test('pageshow без persisted уход не сбрасывает', () => {
    const p = page({ referrer: 'http://localhost/' });
    p.way();
    p.click();
    p.w.dispatchEvent(new p.w.PageTransitionEvent('pageshow', { persisted: false }));
    p.click();
    expect(p.went.back).toBe(1);
  });
});
