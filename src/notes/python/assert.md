---
title: Assert
layout: note.njk
reading_time: 5

upd_date: 2026-09-26

tg_desc: python-assert
tg_pub_time: 2026-03-17

tags:
  - Python
  - Отладка
  - Тесты

lede: >-
  Инструкция assert проверяет выражение на истинность и роняет программу
  с AssertionError, если проверка не прошла. Удобна для отладки и тестов,
  но опасна там, где на нее полагаются всерьез.

tldr:
  - "<b>Что это.</b> Инструкция языка: <code>assert условие, сообщение</code>. Ложное условие - <code>AssertionError</code> с сообщением."
  - "<b>Главный подвох.</b> С флагом <code>-O</code> все assert вырезаются еще при компиляции - проверки просто нет."
  - "<b>Где уместно.</b> Отладка, внутренние инварианты, тесты в pytest."
  - "<b>Где нельзя.</b> Проверка пользовательского ввода, прав доступа и всего, от чего зависит корректность программы."
  - "<b>Ловушка синтаксиса.</b> <code>assert (x, \"msg\")</code> - это проверка непустого кортежа, она всегда истинна."
---

<figure class="note-media note-media--sm">
  <div class="note-media__image-wrapper">
    <img
      class="note-media__image"
      data-image-dark="{{ pathPrefix }}/images/notes/assert/snake-dark-500.png"
      data-image-light="{{ pathPrefix }}/images/notes/assert/snake-light-500.png"
      src="{{ pathPrefix }}/images/notes/assert/snake-dark-500.png"
      alt="assert vibes, just relax"
      loading="lazy"
      decoding="async"
    >
  </div>
  <figcaption class="note-media__caption"><b>Настроение</b>assert под флагом -O</figcaption>
</figure>

## Интро

Есть такая инструкция **assert** для проверки выражения на истинность: если проверка накрылась, возникает `AssertionError` + выводится кастомное сообщение (если указано).

<div class="flow">
условие <i>→</i> истинно? <i>→</i> идем дальше / <b>AssertionError</b>
</div>

```python check.py
def check(x):
    assert x > 0, "x must be positive"
    return x

check(-1)
```

::: out
```
Traceback (most recent call last):
  File "check.py", line 5, in <module>
    check(-1)
  File "check.py", line 2, in check
    assert x > 0, "x must be positive"
           ^^^^^
AssertionError: x must be positive
```
:::

По смыслу `assert` - это сокращенная запись такого кода:

```python
if __debug__:
    if not x > 0:
        raise AssertionError("x must be positive")
```

`__debug__` - встроенная константа: `True` в обычном режиме и `False` при запуске с `-O`. Отсюда и главный подвох, о нем ниже.


## Отключение assert

При запуске python скрипта с флагом **-O** (optimize) или под `PYTHONOPTIMIZE=1` (непустым) все инструкции assert удаляются из кода. Вернее, они просто не попадают в байт-код при компиляции - и в `.pyc`-файлы тоже. Формально это ускоряет выполнение программы, так как код с проверками просто пропускается.

Видно через `dis` (подробнее о нем - в заметке [Disassemble](/notes/python/disassemble/)):

```python assert_dis.py @3.12
import dis

def check(x):
    assert x > 0, "x must be positive"

dis.dis(check)
```

::: out
```
# python assert_dis.py
  3           0 RESUME                   0

  4           2 LOAD_FAST                0 (x)
              4 LOAD_CONST               1 (0)
              6 COMPARE_OP              68 (>)
             10 POP_JUMP_IF_TRUE         7 (to 26)
             12 LOAD_ASSERTION_ERROR
             14 LOAD_CONST               2 ('x must be positive')
             16 CALL                     0
             24 RAISE_VARARGS            1
        >>   26 RETURN_CONST             0 (None)

# python -O assert_dis.py
  3           0 RESUME                   0
              2 RETURN_CONST             0 (None)
```
:::

Без флага условие вычисляется, и если оно ложно, `LOAD_ASSERTION_ERROR` кладет на стек класс исключения, `CALL` создает его с сообщением, а `RAISE_VARARGS` бросает. С `-O` от строки не остается ничего - функция сразу возвращает `None`.

::: warn
Именно поэтому assert НЕ должен использоваться для проверки пользовательского ввода или критичных ошибок - только для отладки и тестирования. Для остального - явный `if` + `raise ValueError` / `TypeError` / свое исключение.
:::


## Когда assert уместен

:::: verdict

::: yes Можно
- Отладка: быстро проверить гипотезу о состоянии программы.
- Внутренние инварианты - то, что «не может случиться», если код написан правильно.
- Тесты: pytest целиком построен на assert.
:::

::: no Нельзя
- Проверка пользовательского ввода и аргументов публичного API.
- Права доступа, авторизация, безопасность.
- Любая логика, без которой программа работает неправильно.
:::

::::


## Момент со скобками

`assert` - инструкция, а не функция. Если обернуть условие и сообщение в скобки, получится кортеж из двух элементов, а непустой кортеж всегда истинен:

```python//0 always_true.py
assert (1 == 2, "never fails")
```

::: out
```
always_true.py:1: SyntaxWarning: assertion is always true, perhaps remove parentheses?
  assert (1 == 2, "never fails")
```
:::

Проверка молча проходит, компилятор выдает только предупреждение. Правильно - без скобок: `assert 1 == 2, "fails"`.


## Assert в тестах

Популярный пакет pytest позволяет лаконично оформлять проверки с помощью assert. Никаких `assertEqual` / `assertIn` (как в unittest), обычное выражение:

```python test_math.py
def test_sum():
    assert sum([1, 2, 3]) == 7
```

При падении pytest подробно показывает, из чего состояло выражение:

::: out
```
    def test_sum():
>       assert sum([1, 2, 3]) == 7
E       assert 6 == 7
E        +  where 6 = sum([1, 2, 3])
```
:::

Тесты работают даже под `-O`: pytest сам переписывает assert в тестовых модулях еще до компиляции. А вот assert в обычном коде, который тесты вызывают, все равно исчезнут - pytest честно предупредит об этом.
