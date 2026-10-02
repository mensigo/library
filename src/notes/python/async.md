---
title: Async
layout: note.njk
reading_time: 15

upd_date: 2026-09-26

tags:
  - Python
  - asyncio
  - Конкурентность

lede: >-
  asyncio - конкурентный I/O в одном потоке. Функции выполняются по частям и
  переключаются в заранее заданных точках: пока одна ждет сеть или диск, работают другие.

tldr:
  - "<b>Корутина.</b> Вызов <code>async def</code>-функции не выполняет ее тело, а возвращает объект <code>coroutine</code>."
  - "<b>Цикл событий.</b> Один поток, одна очередь: цикл берет готовую задачу, продвигает ее до ближайшего <code>await</code>, переходит к следующей."
  - "<b>Остановка.</b> Корутина отдает управление циклу только на <code>await</code>, и только если дошла до неготовой <code>Future</code>. Код между <code>await</code> выполняется без переключений."
  - "<b>Главное.</b> Конкурентность появляется, только когда несколько корутин отданы циклу одновременно. <code>await</code> подряд - это последовательный код."
  - "<b>Когда нужен.</b> asyncio ускоряет ожидание (I/O), а не вычисления. Тяжелый расчет или блокирующий вызов внутри <code>async def</code> останавливает весь цикл - их выносят в поток или процесс."
---

## Интро

Модуль **asyncio** появился в Python 3.4 (март 2014) по PEP 3156 - проект Гвидо ван Россума под кодовым именем Tulip. До него асинхронный I/O в Python жил в сторонних библиотеках: Twisted, Tornado, gevent. Первые версии asyncio были в статусе provisional, API менялся от релиза к релизу.

| Версия | Что появилось |
|---|---|
| 3.4 | модуль `asyncio`, корутины на генераторах: `@asyncio.coroutine` + `yield from` |
| 3.5 | `async def` / `await` - нативные корутины (PEP 492) |
| 3.6 | asyncio больше не provisional; асинхронные генераторы (PEP 525) |
| 3.7 | `async` и `await` - зарезервированные слова; `asyncio.run()`, `asyncio.create_task()` |
| 3.8 | REPL с верхнеуровневым `await`: `python -m asyncio` |
| 3.11 | `TaskGroup`, `asyncio.timeout()`; `@asyncio.coroutine` удален |

::: more Версии (язык, stdlib, CPython)
Номера в таблице - версии Python, а не конкретной реализации. Но изменения живут на разных уровнях:

- **язык** - `async def`, `await`, асинхронные генераторы, методы корутины (`send`, `throw`, `close`). Обязательны для любой реализации этой версии;
- **стандартная библиотека** - сам `asyncio`: `run`, `TaskGroup`, `timeout`. Формально тоже часть спецификации, но фактически ее определяет CPython;
- **только CPython** - C-ускоритель `_asyncio` (`Task` и `Future` на C, с 3.6) и момент появления предупреждения `never awaited`: CPython выдает его сразу, как только счетчик ссылок падает до нуля.

CPython - эталонная реализация: версии языка выходят вместе с его релизами. PyPy везет тот же asyncio (в основном на чистом Python), но отстает на версию-две, а предупреждение о забытой корутине там может прийти позже, при сборке мусора. У MicroPython свой урезанный `asyncio` (бывший `uasyncio`), таблица к нему не относится.
:::

Архитектура держится на трех вещах:

- **асинхронная функция** - функция, объявленная через `async def`. Внутри нее можно писать `await`;
- **корутина** - объект, который возвращает вызов асинхронной функции. Позволяет выполнять тело функции по частям: на `await` корутина может приостановиться и отдать управление циклу событий, а не заблокировать весь поток, как `time.sleep`;
- **цикл событий** (event loop) - запускает, останавливает и будит корутины.


## Корутина

Функция, объявленная через `async def` (в документации - coroutine function), при вызове не выполняет свое тело. Она возвращает объект-корутину:

```python hello.py
async def hello():
    print("hi")
    return 42

c = hello()
print(c)
print(type(c))
```

::: out
```
<coroutine object hello at 0x104000940>
<class 'coroutine'>
sys:1: RuntimeWarning: coroutine 'hello' was never awaited
```
:::

`hi` не напечаталось - тело функции не запускалось. А при сборке мусора интерпретатор заметил, что корутину создали и бросили, и выдал предупреждение. Это самая частая ошибка в async-коде: забытый `await` перед вызовом.

Корутину можно продвинуть вручную - тем же методом `send`, что и у генератора:

```python hello_send.py
async def hello():
    print("hi")
    return 42

c = hello()
try:
    c.send(None)
except StopIteration as e:
    print("result:", e.value)
```

::: out
```
hi
result: 42
```
:::

`send(None)` выполняет тело до ближайшей точки остановки. Здесь остановок нет, поэтому корутина доходит до конца, а возвращаемое значение уезжает наружу внутри `StopIteration` - ровно как у генератора. Никакого asyncio для этого не понадобилось.

::: note
Корутины выросли из генераторов: в 3.4 они и были генераторами с `yield from`. `async def` дал им отдельный тип и синтаксис, но механика продвижения через `send` осталась той же.
:::


## Цикл событий

Если в корутине есть `await` на чем-то, что еще не готово (таймер, сокет), `send` вернет управление посреди тела. Кто-то должен запомнить эту корутину и позвать `send` снова, когда ожидание закончится. Этим и занимается цикл событий:

<div class="flow">
взять готовую задачу <i>→</i> <code>send</code> до ближайшего <code>await</code> <i>→</i> отложить до готовности <i>→</i> следующая задача <i>→</i> ничего не готово? ждать I/O или таймер
</div>

Цикл работает в одном потоке. Переключение между корутинами происходит только в точках `await` - корутина сама отдает управление, никто ее не прерывает. Поэтому модель называют кооперативной многозадачностью.

Точка входа - `asyncio.run()`: создает цикл, запускает в нем корутину, ждет ее завершения и закрывает цикл.

```python workers.py
import asyncio
import time

async def worker(name, delay):
    print(f"{name}: start")
    await asyncio.sleep(delay)
    print(f"{name}: done")
    return name

async def main():
    t0 = time.perf_counter()
    await worker("A", 1)
    await worker("B", 1)
    print(f"подряд: {time.perf_counter() - t0:.1f}s")

    t0 = time.perf_counter()
    results = await asyncio.gather(worker("A", 1), worker("B", 1))
    print(results, f"gather: {time.perf_counter() - t0:.1f}s")

asyncio.run(main())
```

::: out
```
A: start
A: done
B: start
B: done
подряд: 2.0s
A: start
B: start
A: done
B: done
['A', 'B'] gather: 1.0s
```
:::

Первый блок - два `await` подряд. `main` ждет, пока закончится `A`, и только потом создает `B`. Цикл все это время простаивает: у него одна задача, и она спит.

Второй блок - `gather` оборачивает обе корутины в задачи (`Task`) и отдает циклу сразу. `A` доходит до `sleep` и отдает управление, цикл тут же запускает `B`, та тоже засыпает. Через секунду таймеры срабатывают, цикл будит обе. Итого секунда вместо двух.

::: warn
`await` не делает код параллельным. Он значит «выполни и дождись». Конкурентность появляется, только когда циклу отдано несколько задач одновременно: `gather`, `create_task`, `TaskGroup`.
:::


## Чуть подробнее

### Future

`asyncio.Future` - заглушка для результата, которого еще нет. Создается пустой (pending), позже кто-то кладет в нее значение (`set_result`) или исключение (`set_exception`). Тот, кто сделал `await` на Future, ждет, пока это произойдет.

```python future.py
import asyncio

async def main():
    loop = asyncio.get_running_loop()
    fut = loop.create_future()
    loop.call_later(1, fut.set_result, "ready")
    print(fut)
    print(await fut)
    print(fut)

asyncio.run(main())
```

::: out
```
<Future pending>
ready
<Future finished result='ready'>
```
:::

Именно на Future корутина и останавливается. Упрощенно `Future.__await__` устроен так:

```python
def __await__(self):
    if not self.done():
        yield self
    return self.result()
```

`yield self` пробрасывается вверх через всю цепочку `await` до цикла событий. Цикл вешает на Future колбэк «когда будет готово - разбудить задачу» и переходит к другим задачам. Так устроен `asyncio.sleep`: создает Future, ставит таймер на `set_result` и ждет. С сокетами то же самое - Future заполняется, когда пришли данные. Если же цепочка `await` так и не дошла до неготовой Future, корутина проходит ее насквозь, не отдавая управление.

Вручную Future создают редко - в основном чтобы обернуть API на колбэках: передать `fut.set_result` как колбэк и сделать `await fut`.

::: note
`concurrent.futures.Future` (потоки, процессы) - другой класс, `await` на нем не работает. Мост между ними - `loop.run_in_executor()` и `asyncio.wrap_future()`.
:::

### Task

`asyncio.Task` - подкласс Future, который заполняет себя сам: продвигает корутину через `send`, а когда та вернула значение, вызывает на себе `set_result`. Поэтому задачу можно ждать через `await`, отменять, проверять `done()`.

Главное отличие от голой корутины: `create_task` сразу ставит задачу в очередь цикла. Она начнет выполняться на ближайшей остановке вызывающего кода, не дожидаясь, пока ее результат кому-то понадобится.

```python task.py
import asyncio
import time

async def fetch(name, delay):
    await asyncio.sleep(delay)
    return name

async def main():
    t0 = time.perf_counter()
    task = asyncio.create_task(fetch("user", 1))
    print(isinstance(task, asyncio.Future))
    config = await fetch("config", 1)
    user = await task
    print(config, user, f"{time.perf_counter() - t0:.1f}s")

asyncio.run(main())
```

::: out
```
True
config user 1.0s
```
:::

`user` грузился, пока `main` ждала `config` - итого секунда вместо двух.

Когда пригодится:

- начать медленное заранее, а результат забрать позже;
- фоновая работа: heartbeat, периодическое обновление, обработчик очереди;
- управление отдельной задачей: `cancel()`, `asyncio.wait_for(task, 5)`, `add_done_callback()`.

::: warn
Цикл держит на задачу только слабую ссылку. Задачу, запущенную «в фон» без сохраненной ссылки, сборщик мусора может удалить посреди работы. А исключение из нее не всплывет - только запись в логе `Task exception was never retrieved`.
:::

### TaskGroup

`asyncio.TaskGroup` (3.11) - контекстный менеджер для задач, которые живут и умирают вместе:

- из блока `async with` нельзя выйти, пока не завершились все задачи группы;
- если одна задача упала, остальные отменяются, а ошибки выбрасываются одним `ExceptionGroup`;
- задачи можно добавлять на ходу, например по одной на каждый входящий элемент.

```python taskgroup.py @3.11
import asyncio

async def work(name, delay, fail=False):
    try:
        await asyncio.sleep(delay)
    except asyncio.CancelledError:
        print(f"{name}: cancelled")
        raise
    if fail:
        raise ValueError(name)
    print(f"{name}: done")

async def main():
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(work("A", 0.1))
            tg.create_task(work("B", 0.2, fail=True))
            tg.create_task(work("C", 1))
    except* ValueError as eg:
        print("errors:", eg.exceptions)

asyncio.run(main())
```

::: out
```
A: done
C: cancelled
errors: (ValueError('B'),)
```
:::

`A` успела закончиться, `B` упала, и группа отменила `C`, не дожидаясь ее. С `gather` было бы иначе:

| | `gather` | `TaskGroup` |
|---|---|---|
| результат | список в порядке аргументов | `.result()` у каждой задачи |
| одна задача упала | ошибка уходит наружу, остальные **продолжают работать** | остальные **отменяются** |
| несколько ошибок | видна только первая | видны все, в `ExceptionGroup` |
| собрать ошибки, не останавливаясь | `return_exceptions=True` | нет |
| добавлять задачи на ходу | нет | да |

::: tip Что выбрать
`await` подряд - нужен результат, и порядок важен. `create_task` - одна задача в фоне. `TaskGroup` - пачка задач, которые должны выполниться все. `gather(..., return_exceptions=True)` - нужны все результаты, включая ошибки.
:::

### async with / async for

Асинхронные версии `with` и `for`. Обычные не годятся, когда вход, выход или получение следующего элемента требуют ожидания: внутри обычных `__enter__` и `__next__` нельзя написать `await`. Асинхронные версии вызывают те же методы, только с `await`. Упрощенно:

```python async_with.py
async with cm as x:
    ...  # тело

# примерно то же, что
x = await cm.__aenter__()
try:
    ...  # тело
finally:
    await cm.__aexit__(exc_type, exc, tb)
```

```python async_for.py
async for x in source:
    ...  # тело цикла

# примерно то же, что
it = source.__aiter__()
while True:
    try:
        x = await it.__anext__()
    except StopAsyncIteration:
        break
    ...  # тело цикла
```

Каждый такой скрытый `await` - точка, где корутина может остановиться и отдать управление циклу. Писать их можно только внутри `async def`.

Когда используются:

- **`async with`** - ресурс, который открывается и закрывается через I/O: соединение с базой, HTTP-сессия, транзакция. Сюда же `asyncio.Lock`, `asyncio.timeout()` и сам `TaskGroup`;
- **`async for`** - данные, которые приходят по частям: курсор базы, потоковый HTTP-ответ, сообщения из сокета или очереди.

Писать `__aenter__` / `__anext__` руками обычно не нужно. Контекстный менеджер проще собрать через `@contextlib.asynccontextmanager`, а асинхронный итератор - через асинхронный генератор: `async def` с `yield` внутри (PEP 525).

```python async_with_for.py
import asyncio
from contextlib import asynccontextmanager

@asynccontextmanager
async def connect(name):
    await asyncio.sleep(0.1)
    print(f"{name}: open")
    try:
        yield name
    finally:
        await asyncio.sleep(0.1)
        print(f"{name}: closed")

async def rows(n):
    for i in range(n):
        await asyncio.sleep(0.1)
        yield i

async def main():
    async with connect("db") as conn:
        async for row in rows(3):
            print(conn, row)
        print([row async for row in rows(3)])

asyncio.run(main())
```

::: out
```
db: open
db 0
db 1
db 2
[0, 1, 2]
db: closed
```
:::

Последняя строка - асинхронный list comprehension: тот же `async for`, только внутри выражения.

::: warn
`async for` не делает итерации конкурентными. Следующий элемент запрашивается только после того, как тело цикла отработало - это тот же последовательный код, просто без блокировки потока на ожидании.
:::


## О применимости

asyncio ускоряет программы, которые большую часть времени ждут: ответа сервера, базы, диска, таймера. Пока одна корутина ждет, цикл продвигает другие. Такие задачи называют I/O-bound.

Вычисления (CPU-bound) asyncio не ускоряет: цикл работает в одном потоке, на одном ядре. Хуже того, долгий расчет внутри `async def` останавливает весь цикл. Переключение возможно только на `await`, а в цикле вычислений его нет - остальные задачи замирают, пока расчет не закончится.

```python blocking.py
import asyncio
import time
from concurrent.futures import ProcessPoolExecutor

def crunch(n):
    return sum(i * i for i in range(n))

async def ticker():
    t0 = time.perf_counter()
    for _ in range(4):
        await asyncio.sleep(0.25)
        print(f"  tick {time.perf_counter() - t0:.2f}s")

async def main():
    n = 30_000_000

    print("в цикле:")
    t = asyncio.create_task(ticker())
    await asyncio.sleep(0)
    crunch(n)
    await t

    print("в процессе:")
    t = asyncio.create_task(ticker())
    loop = asyncio.get_running_loop()
    with ProcessPoolExecutor() as pool:
        await loop.run_in_executor(pool, crunch, n)
    await t

if __name__ == "__main__":
    asyncio.run(main())
```

::: out
```
в цикле:
  tick 0.87s
  tick 1.12s
  tick 1.37s
  tick 1.62s
в процессе:
  tick 0.25s
  tick 0.50s
  tick 0.75s
  tick 1.00s
```
:::

`ticker` должен печатать каждые 0.25 с. В первом случае `crunch` занял цикл почти на секунду, и первый тик опоздал. Во втором расчет ушел в отдельный процесс, а цикл продолжил работать: `run_in_executor` возвращает Future, и `main` просто ждет ее, как любой другой `await`.

Поэтому тяжелую синхронную работу из `async def` выносят:

- **в поток** - `await asyncio.to_thread(func, *args)` (3.9). Подходит для блокирующего I/O без async-версии (`requests`, синхронный драйвер базы) и для C-кода, который отпускает GIL (`hashlib`, большая часть `numpy`);
- **в процесс** - `loop.run_in_executor(ProcessPoolExecutor(), func, *args)`. Нужен для вычислений на чистом Python: из-за GIL отдельный поток им не поможет.

::: warn
Блокирующие вызовы опасны так же, как вычисления. `time.sleep`, `requests.get`, синхронный клиент базы внутри `async def` останавливают весь цикл. Им нужны асинхронные замены (`asyncio.sleep`, `httpx` / `aiohttp`, `asyncpg`) или `to_thread`.
:::

::: tip
`asyncio.run(main(), debug=True)` включает режим отладки: цикл пишет в лог каждый шаг задачи дольше 100 мс. Так удобно искать, кто его блокирует.
:::
