---
title: Disassemble
layout: note.njk

upd_date: 2026-02-05

tg_desc: python-disassemble
tg_pub_time: 2026-02-05
---

## Интро

Модуль `dis` показывает байт-код Python - это промежуточное представление кода между исходным текстом и машинным кодом. Помогает понять, как Python интерпретирует и выполняет тот или иной код.

Python компилирует исходный код в байт-код, который запускает виртуальная машина:
```
исходный код (Python) → компиляция → байт-код → виртуальная машина → результат
```
Модуль `dis` показывает именно байт-код.


## Структура вывода dis.dis()

```python
import dis

def multiply(x, y):
    return x * y

dis.dis(multiply)
```

Вывод:
```
  2           0 LOAD_FAST                0 (x)
              2 LOAD_FAST                1 (y)
              4 BINARY_MULTIPLY
              6 RETURN_VALUE
```

**Колонки:**
- **Первая** - номер строки в исходном коде
- **Вторая** - смещение байт-кода (адрес инструкции)
- **Третья** - название инструкции
- **Четвертая** - аргумент инструкции (если есть)
- **Пятая** - расшифровка аргумента в скобках


## Основные инструкции

**Загрузка значений на стек:**
- `LOAD_FAST` - загрузить локальную переменную
- `LOAD_GLOBAL` - загрузить глобальную переменную
- `LOAD_CONST` - загрузить константу (число, строку, None)

**Операции со стеком:**
- `STORE_FAST` - сохранить значение в локальную переменную
- `POP_TOP` - удалить верхний элемент со стека

**Арифметические операции:**
- `BINARY_ADD` - сложение (+)
- `BINARY_SUBTRACT` - вычитание (-)
- `BINARY_MULTIPLY` - умножение (*)
- `BINARY_TRUE_DIVIDE` - деление (/)

**Управление потоком:**
- `JUMP_ABSOLUTE` - перейти на адрес (для циклов, if-ов)
- `JUMP_IF_FALSE_OR_POP` - если False, прыг; иначе удал со стека
- `RETURN_VALUE` - вернуть значение из функции


## Моменты

### 1. Стек в основе

Все операции работают над стеком:

```python
def example():
    return 1 + 2
```

Байт-код:
```
0 LOAD_CONST               1 (1)     # стек: [1]
2 LOAD_CONST               2 (2)     # стек: [1, 2]
4 BINARY_ADD                         # стек: [3]
6 RETURN_VALUE                       # вернуть 3
```

### 2. dis.dis() для разных объектов

Можно посмотреть раскладку не только для функции:

```python
import dis

dis.dis(my_function)     # Для функции
dis.dis(MyClass.method)  # Для метода
dis.dis(MyClass)         # Для класса
dis.dis(sys)             # Для модуля
dis.dis("x = 1 + 2")     # Для строки с кодом
```

### 3. Сравнение кода через dis

Поможет при выборе оптимального варианта:

```python
import dis

# Вариант 1: через list comprehension
dis.dis("[x * 2 for x in range(10)]")

# Вариант 2: через цикл
dis.dis("""
result = []
for x in range(10):
    result.append(x * 2)
""")
```

List comprehension обычно оптимален.


### 4. Оптимизация при компиляции

Python вычисляет некоторые константные выражения на этапе компиляции:

```python
dis.dis("1 + 2")  # Покажет LOAD_CONST с уже посчитанным 3
```


### 5. Байт-код сохраняется в .pyc файлы

Когда Python запускает модуль, он кэширует байт-код в файлах `.pyc`:

```
__pycache__/
    my_module.cpython-310.pyc
    my_module.cpython-311.pyc
```

Это ускоряет повторный запуск кода (не нужно перекомпилировать).

```python
import py_compile

# Посмотреть байт-код из .pyc файла
py_compile.compile('my_module.py')
dis.dis(compile(open('my_module.py').read(), 'my_module.py', 'exec'))
```


### 6. dis.get_instructions() - просмотр dis на уровне кода

Вместо печати, можно получить инструкции как объекты (на уровне кода):

```python
import dis

def add(a, b):
    return a + b

for instruction in dis.get_instructions(add):
    print(f"{instruction.offset}: {instruction.opname} {instruction.arg}")
```

Output:
```
0: LOAD_FAST 0
2: LOAD_FAST 1
4: BINARY_ADD None
6: RETURN_VALUE None
```
