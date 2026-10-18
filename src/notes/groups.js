// Группы заметок: одна запись на группу, порядок - порядок на стене.
// Глобальные данные noteGroups (.eleventy.js): стену в комнате рисует src/index.njk,
// который лежит вне notes/. Сам файл не публикуется: Eleventy собирает только md/njk.
//   id      - папка notes/<id>/ и data-g (цвет в world/_src/note-groups.css)
//   tag     - собственный тег группы: его нет в кнопках тем и тегах строк, и по нему
//             черновик попадает в папку группы
//   embers  - заголовок блока черновиков на странице группы
//   find    - подсказка в поле поиска на странице группы
//   enabled - false: группа на стене приглушена и никуда не ведет (.group--draft)
// Знак группы - world/note-sigils.njk, его --done - note-groups.css.
module.exports = [
  {
    id: 'python',
    title: 'Python',
    desc: 'Изнутри: от tuple до async.',
    tag: 'Python',
    embers: 'Тлеет',
    find: 'slots, байт-код, await...',
    enabled: true
  },
  {
    id: 'docker',
    title: 'Docker',
    desc: 'Контейнеры без магии.',
    tag: 'Docker',
    embers: 'В пути',
    find: 'слои, образ, кеш...',
    enabled: true
  }
];
