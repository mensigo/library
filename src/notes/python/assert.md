---
title: Assert
layout: note.njk

upd_date: 2026-03-17

tg_desc: python-assert
tg_pub_time: 2026-03-17
pageClass: note-image-simple
---

<figure class="note-media note-media--full">
  <div class="note-media__image-wrapper">
    <img
      class="note-media__image"
      src="{{ pathPrefix }}/images/notes/assert/snake-dark-500.png"
      alt="assert vibes, just relax"
      loading="lazy"
      decoding="async"
    >
  </div>
</figure>

## Интро

Есть такая инструкция **assert** для проверки выражения на истинность: если проверка накрылась, возникает AssertionError + выводится кастомное сообщение (если указано).

## Моменты

### 1. Assert можно **полностью отключить**

При запуске python скрипта с флагом **-O** (optimize) или под PYTHONOPTIMIZE=1 (непустым) все инструкции assert удаляются из кода. Вернее, они просто не попадают в .pyc файл при компиляции. Формально это ускоряет выполнение программы, так как код с проверками просто пропускается.

Именно поэтому assert НЕ должен использоваться для проверки пользовательского ввода или критичных ошибок - только для отладки и тестирования.


### 2. Assert **удобно** использовать в тестах

Популярный пакет pytest позволяет лаконично оформлять проверки с помощью assert.
