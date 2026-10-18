# Migration: variant G → the site

Plan for moving pitch v4 variant G (`FINAL_STATE.md`) into `src/`. G replaces the home
page, the notes section and the way into Cinema. Reviews stay on the current shell for now.
Section 1 holds the decisions (all made except phones), section 9 the work order with a
definition of done for each step.

## 0. What we're merging

| | Pitch G (`pitch/v4/`) | Site now (`src/`) |
|---|---|---|
| Home | room → wall pan, cards, fog, smoke | `index.md`, recent updates list |
| Notes index | wall with group sigils | `notes/index.md`, nearly empty |
| Group page | `notes-python.html`, `notes-docker.html`: rows, topics, search, embers | none (the drawer lists notes) |
| Note page | `note-*.html`: sky, progress, breadcrumb mark, TOC in the side column, W/S/A | `note.njk` in the `base.njk` shell: topbar, drawer, rail, pager |
| Cinema | `cinema-g.html` = landing + return to the room | `src/cinema/` (bundled from `_src/`) |
| Reviews | "в работе" fog only | `page.njk`, anime + philosophy |
| Theme | dark only, colour per group (`data-g`) | light/dark + 8 accent palettes |
| Search | per-group filter (`notes.js`) | global Fuse.js in the drawer |

Built markup works in G as is: `prose.css` already styles what `.eleventy.js` outputs
(Prism `.token`, `.code`, `.code__out`, `.callout`, `.fig`, `.d-*` in SVG figures, `.verdict`,
`.finale`, `.notes-block`, `.term`, `.more`). The markdown pipeline needs no changes.

## 1. Decisions first

Decided, except 3 (phones), which is still open. 8 was added during step 2.

1. **Scope.** G covers `/`, `/notes/**` and the entrance to `/cinema/`. `/reviews/**` stays
   on the old shell (`base.njk` + `css/styles.css` + `js/scripts.js`, left where they are,
   section 4) and its pages are not touched. The Reviews card keeps `data-soon`. The old
   shell gets ported to G later, as its own migration.
2. **URLs of published notes don't change.** `/notes/python/slots/` and the rest have been
   posted to Telegram (`tg_pub_time`). Only drafts may move.
3. **Phones: open.** People open notes from Telegram, often on a phone. What the pitch does
   at 390x844 now (Chrome phone emulation with touch; not checked on a real phone or in Safari):
   - *Room*: title on top, then a strip of cards you swipe sideways (Cinema is off-screen
     to the right), the frame below cropped to the man and the window. No key hints.
   - *Wall* (`#notes`): the two groups stacked, the Python sigil drawn under them, then the shelf.
   - *Group page*: works. Topics become a chip strip you swipe sideways, rows go to one
     column without numbers, embers and "к стене" sit under the list.
   - *Note page*: reads well in one column with lede, key points, code, tables and callouts,
     and the bar with breadcrumbs and progress stays pinned. Gaps:
     **no table of contents at all** (`.toc` is hidden under 1100 px), and the **SVG figures
     shrink until their labels are ~7 px** and can't be read.
   - *Cinema*: the shipped landing, fine, but the `A в комнату` key hint shows on touch.

   Before launch, at least: figures readable on a phone (scroll inside `.fig__frame` at a
   minimum width, or tap to open full screen), a TOC on phones (collapsed under the
   header, or a button in the bar), the key hint hidden on touch, and the transitions tried
   on a real iPhone. The full mobile view stays a later feature, as in `FINAL_STATE.md`.
4. **Drafts: grouped by tag.**
   - A draft whose tags include a group's tag (`Python`, `Docker`) sits in that group's
     folder with `draft: true`, for example `src/drafts/python-gil.md` → `src/notes/python/python-gil.md` (file names are kept).
     The group page lists it in the embers block under the group's own heading
     (`Тлеет` for Python, `В пути` for Docker). Embers are not links, as in the pitch.
     The draft still builds at its URL (a better way to read drafts is a TODO, section 13).
   - A draft with no group tag stays in `src/drafts/` and shows up nowhere: it isn't built
     (`permalink: false` from `drafts.11tydata.js`) and isn't in any collection. These are
     todos.
   - The old drawer's `Черновики` group goes, so drafts don't appear there either.
5. **Docker launches with `docker-1` as a published note**: `src/notes/docker/docker-1.md` → `/notes/docker/docker-1/` (file name kept; `/notes/docker/` itself is the group page),
   title `История Docker`, `draft: false` (section 7). The group is enabled on the wall.
   `.group--draft` / `aria-disabled` stay in the code for a future group that has no notes yet.
6. **Global search is dropped on G pages.** The group filter covers notes;
   `search-index.json` still builds for the old shell's drawer.
7. **Row order and numbers.** Rows are sorted by `upd_date` (newest first), as in the
   pitch, then by `title` when dates are equal (decision 8). `01..NN` is the position in that order, so the number of a note changes when
   another note is updated. The note's kicker `01 / python` uses the same number.
   "Fresh" (square/round marker) = `upd_date` within 45 days of the build date. It is
   computed at build time, so a note stays fresh until the first deploy after those 45 days.
8. **Builds are deterministic: `title` breaks ties.** Eleventy's `getAll()` doesn't return
   pages in a fixed order, so anything sorted only by date, or not sorted at all, could
   come out in a different order on every build. Found in step 2: `assert` and `async`
   (both 26 Sep) swapped on the home page, and `search-index.json` came out in a different
   order on almost every build. Every list
   the site outputs is sorted, and `title` (`localeCompare`, `'ru'`, `sensitivity: 'base'`,
   as the other collections use) is the last key. Done in step 2 for `recentUpdates` and
   `searchIndex`; `groupNotes` / `groupDrafts` follow it (section 7). This is what makes
   "same as before the step" (`diff -r`) mean anything.

## 2. URL map

| Pitch | Site URL | Source |
|---|---|---|
| `index-g.html` | `/` | `src/index.njk` (replaces `index.md`) |
| `index-g.html#notes` | `/#notes` | same page, `wall.js` reads the hash |
| — | `/notes/` | `src/notes/index.njk`: meta refresh + link to `/#notes` |
| `notes-python.html` | `/notes/python/` | `src/notes/group.njk`, paginated over `noteGroups` |
| `notes-docker.html` | `/notes/docker/` | same |
| `note-slots.html`, `note-async.html` | `/notes/python/slots/` etc. (unchanged) | `src/notes/python/*.md`, layout `world/note.njk` |
| `note-docker-history.html` | `/notes/docker/docker-1/` | `src/drafts/docker-1.md` → `src/notes/docker/docker-1.md` |
| `note-docker-image/layers.html` | — | not migrated (test notes) |
| — | `/notes/python/python-gil/`, `/notes/python/unlimited-ints/` | drafts moved from `src/drafts/` (decision 4) |
| — | `/drafts/*` | gone: tagged drafts moved, untagged ones aren't built |
| `cinema-g.html` | `/cinema/` | `src/cinema/index.html`, patched (section 8) |
| — | `/reviews/**` | unchanged |

All links in templates go through `{{ pathPrefix }}` (`/library` in production).

## 3. Images

Deploy syncs `library_static:src/images/` → `src/images/` (`deploy.yml`), and
`src/images/` is gitignored here. Everything the pages load goes into that repo; for
`npm run dev`, copy it into `src/images/` by hand, as for Cinema. The files list with
sizes is `images/world/meta.md`.

Done: the files are exported (upscaled to frame height 1280, AVIF + JPEG fallback,
`FINAL_STATE.md` "Images and geometry"), committed and pushed to `library_static/src/images/world/`,
and copied into local `src/images/world/`. The pitch already loads them from there.

| Images repo | Size | Used by |
|---|---|---|
| `src/images/world/room.avif`, `room.jpg` | 2274x1280, 189 / 498 KB | home `<picture>` → `<img class="stage__img">`, `.cine__frame` sits over it |
| `src/images/world/wall.avif`, `wall.jpg` | 2987x1280, 244 / 614 KB | `room.css` `.wall`, `notes.css` `.backdrop`, `<link rel=preload>` on group and note pages |
| `src/images/cinema/index/hero.jpg` | already there | Cinema hero and the room's `.cine__frame` |

On the site:

- Room in `index.njk`: `<source type="image/avif" srcset="{{ pathPrefix }}/images/world/room.avif">`,
  `<img src="{{ pathPrefix }}/images/world/room.jpg">`.
- Wall in the bundles (published to `/world/`): `url("../images/world/wall.jpg")`, then
  `image-set(url("../images/world/wall.avif") type("image/avif"), url("../images/world/wall.jpg") type("image/jpeg"))`.
- Preload: `<link rel="preload" as="image" href="{{ pathPrefix }}/images/world/wall.avif" type="image/avif">`.

Sources sit next to them: `src/images/world/room.png` (1672x941) and `wall.png` (2688x1152),
the generated originals the upscale starts from (recipe in `FINAL_STATE.md`). Committed together with them.
No page loads them, and deploy's rsync skips them (`--exclude '/world/*.png'` in
`deploy.yml`), so they never reach `src/images/` here or the site. Don't copy them in for
`npm run dev` either.

Not migrated: every other file in `pitch/v4/img/` (other room takes, toon/regen,
`wall-f*`, `wall-right*`, `shisha-loop-draft.mp4`, comparison sheets, `wall-g-1152.*`).
They stay local, and `pitch/v4/.gitignore` already excludes them.

## 4. `src/` after the migration

`+` new, `←` moved or made from, `~` edited, `−` removed, no mark = unchanged.

Files about note groups say `note` in their name unless their folder already does:
`notes/group.njk` and `notes/groups.js` sit in `notes/`, `note-sigils.njk` and
`note-groups.css` don't. The global variable is `noteGroups`, since every page sees it.

```
src/
├── _includes/
│   ├── meta.njk                  + OG/Telegram <meta>, taken out of base.njk; both shells include it
│   ├── world/                    + layouts shared by many pages
│   │   ├── shell.njk             + <head> + body slot for every new page: fonts, meta.njk, bundle CSS, rel=expect
│   │   ├── note.njk              ← pitch note-slots.html: the note layout
│   │   └── note-sigils.njk       ← sigil SVGs from index-g.html: macro sigil(id, mode "wall" | "mark")
│   ├── figures/                    SVG diagrams for notes
│   │   ├── dis-columns.njk
│   │   ├── slots-inherit.njk
│   │   ├── slots-layout.njk
│   │   └── slots-memory.njk
│   ├── base.njk                  ~ old shell: includes meta.njk, drawer without Черновики
│   ├── page.njk                    old shell
│   ├── plain.njk                   old shell
│   └── note.njk                  − replaced by world/note.njk
├── world/                        + new design's assets, laid out like cinema/
│   ├── _src/                     + sources, never published
│   │   ├── shell.css             ← main.css: what every page needs
│   │   ├── room.css              ← rest of main.css + wall.css + g.css
│   │   ├── cine.css              ← cine.css
│   │   ├── note-groups.css       ← per-group colours from wall.css, notes-g.css, prose.css
│   │   ├── notes.css             ← notes.css + notes-g.css: group page and note page
│   │   ├── note.css              ← note-g.css
│   │   ├── prose.css             ← prose.css
│   │   ├── vt.css                ← vt.css
│   │   ├── fog.js                ← main.js
│   │   ├── wall.js               ← wall.js + g.js
│   │   ├── cine.js               ← cine.js
│   │   ├── smoke.js              ← smoke.js
│   │   ├── note-group.js         ← notes.js + notes-g.js
│   │   └── note.js               ← note-g.js
│   └── bundles.njk               + joins _src/ → /world/{home,note-group,note}.{css,js}
├── index.njk                     + → /: the room, markup inline (pitch index-g.html)
├── index.md                      − replaced by index.njk
├── notes/
│   ├── groups.js                 + note groups: id, title, desc, tag, embers, done, enabled;
│   │                               global data `noteGroups` (loaded in .eleventy.js), never published
│   ├── notes.11tydata.js         + layout world/note.njk + group id from the folder name, for every note
│   ├── index.njk                 + → /notes/: redirect to /#notes
│   ├── index.md                  − replaced by index.njk
│   ├── group.njk                 + → /notes/<id>/: group page, markup inline (pitch notes-python.html),
│   │                               pagination over noteGroups
│   ├── python/                     every note: ~ `layout:` line removed (section 7)
│   │   ├── assert.md
│   │   ├── async.md
│   │   ├── classmethod-staticmethod.md
│   │   ├── disassemble.md
│   │   ├── property.md
│   │   ├── slots.md
│   │   ├── tuple.md
│   │   ├── python-gil.md         ← drafts/, still draft: true → embers "Тлеет"
│   │   └── unlimited-ints.md     ← drafts/, still draft: true → embers "Тлеет"
│   └── docker/                     same
│       └── docker-1.md           ← drafts/, published → /notes/docker/docker-1/
├── drafts/                         drafts with no group tag: not built, not listed
│   ├── drafts.11tydata.js        + permalink: false, eleventyExcludeFromCollections: true
│   ├── docker_todo.md              (untracked)
│   ├── python_todo.md              (untracked)
│   └── python_async_todo.md        (untracked)
├── cinema/
│   ├── _src/
│   │   ├── cinema.css
│   │   ├── cinema.js
│   │   ├── landing.css
│   │   ├── landing.js
│   │   ├── bebop.css
│   │   ├── return.css            ← pitch cinema-g.css
│   │   └── return.js             ← pitch cinema-g.js
│   ├── bundles.njk               ~ parts as paths from src/; landing gains return.* and world/_src/vt.css
│   ├── index.html                ~ rel=expect, data-back, key hint, .cine return block
│   └── bebop/index.html
├── reviews/                        on the old shell, as now
│   ├── anime/{index,made-in-abyss,platinum-end}.md
│   └── philosophy/seneca/letters-to-lucilius.md
├── css/styles.css                ~ old shell; recent-updates rules removed
├── js/scripts.js                   old shell
├── fonts/                          Ysabeau Infant, shared by both shells
├── images/                         gitignored, synced from library_static
│   ├── world/room.{avif,jpg}     + 2274x1280, section 3
│   ├── world/wall.{avif,jpg}     + 2987x1280, section 3
│   ├── cinema/…
│   └── notes/…
└── search-index.njk                old shell's drawer search
```

Outside `src/`:

- `lib/filters.js` (+): the new filters, so Jest can import them.
- `.eleventy.js` (~): `bundle` filter, `world/_src/` watch target, filters from `lib/`,
  `addGlobalData('noteGroups', …)` for `src/notes/groups.js`.
- `test/links.test.js` (~): `src`/`url()` checks.
- `test/filters.test.js`, `test/note-drafts.test.js` (+).

Three places, three jobs: `_includes/world/` holds the shared HTML layouts, `world/_src/`
the CSS/JS sources, and `world/bundles.njk` joins those sources into the files browsers
load from `/world/`. `world/` follows Cinema's layout and rule: nothing under any `_src/`
is published. Eleventy only builds `md`/`njk`, and no passthrough copy covers `world/_src/`.

One-off pages keep their markup in the page itself (`index.njk`, `notes/group.njk`), the
same way Cinema pages do; `_includes/world/` holds only what several pages share.

The old shell stays where it is: `_includes/{base,page,plain}.njk`, `css/styles.css`,
`js/scripts.js`, plus `search-index.njk` for its drawer search. Only reviews use it. When
reviews move to the new design, delete those files, the `searchIndex` collection,
the `src/css` and `src/js` passthroughs, and `test/scripts.test.js`.

Everyday jobs:

| Job | Where |
|---|---|
| Write a note | one `.md` file in `notes/<group>/` |
| Add a draft for a group | same folder, `draft: true` |
| Add a note group | `notes/groups.js`, `note-sigils.njk`, `note-groups.css`, the `notes/<id>/` folder |
| Change how a note page looks | `_includes/world/note.njk`, `world/_src/note.css`, `prose.css` |
| Change the room | `index.njk`, `world/_src/room.css` |

`prose.css` keeps a generic name: it styles markdown output, not notes as such, and
reviews will use it once they move to the new design.

## 5. CSS

One CSS file per page type, joined at build time, the same way as Cinema. Rename
`cinemaBundle` to `bundle`, resolve parts from `src/`, and add `addWatchTarget("src/world/_src/")`:

```yaml
# src/world/bundles.njk
- out: home.css        parts: [shell, room, cine, note-groups, vt]
- out: note-group.css  parts: [shell, notes, note-groups, vt]
- out: note.css        parts: [shell, notes, note, prose, note-groups, vt]
# each part is world/_src/<name>.css
```

`note-groups.css` comes after the files whose rules it recolours. `src/cinema/bundles.njk`
switches to the same filter, with parts written as `cinema/_src/cinema.css`.

| Pitch file | Becomes | Changes |
|---|---|---|
| `main.css` | `world/_src/shell.css` + start of `room.css` | split: whatever the group and note pages use (tokens, `@font-face`, `.hud`, `.kicker`, `.frameline`…; find it with the same unused-class scan, run against those pages) goes to `shell.css`, the rest (stage, panel, cards, glows, scrim, fog) to `room.css`. Drop the leftovers of other variants: `.hero--dim`, `.patch`, `.settings*`, `.switch`, `.stage__loop`. `@font-face` → `../fonts/` |
| `wall.css` + `g.css` | `world/_src/room.css` | fold `g.css` into `wall.css` (G overrides D-F there); drop `.unblue`, `.settings`, the `wall-right.jpg` background; keep `.group--draft` (unused at launch, decision 5); `url()` → `../images/world/wall.jpg` + `image-set` with `wall.avif` (section 3) |
| group colours | `world/_src/note-groups.css` | every `[data-g="…"]` rule from `wall.css`, `notes-g.css`, and the Docker `--amber`/`--neon` swap from `prose.css`, in one file |
| `cine.css` | `world/_src/cine.css` | none |
| `vt.css` | `world/_src/vt.css` | none; also goes into the Cinema landing bundle |
| `notes.css` + `notes-g.css` | `world/_src/notes.css` | drop `.band`, `.band__img`; backdrop `url()` → `../images/world/wall.jpg` + `image-set` with `wall.avif`; `.dim` → `.u-dim` (the class `titleHtml` already emits) |
| `note-g.css` | `world/_src/note.css` | none |
| `prose.css` | `world/_src/prose.css` | none |
| `cinema-g.css` | `cinema/_src/return.css` | appended to the landing bundle |
| `cinema-land.css/js` | — | were copies of the built bundle, gone |

All bundles go to `/world/`, so every `url()` is relative to `/world/` (`../fonts/`,
`../images/`) and works with or without the path prefix.

The "Values that must stay in sync" in `FINAL_STATE.md` stay as they are. Folding files
together makes most of these pairs end up in one file, so leave a comment at each one.

## 6. JS

| Pitch | Becomes | Changes |
|---|---|---|
| `main.js` | `world/_src/fog.js` | comment "только в варианте G" removed |
| `wall.js` + `g.js` | `world/_src/wall.js` | merge (G is the only consumer) |
| `cine.js` | `world/_src/cine.js` | none |
| `smoke.js` | `world/_src/smoke.js` | none |
| `notes.js` + `notes-g.js` | `world/_src/note-group.js` | merge; drop the fog-on-arrival code from `notes.js` (group pages have no `#fog` in G); fixes below |
| `note-g.js` | `world/_src/note.js` | fixes below |
| `cinema-g.js` | `cinema/_src/return.js` | appended to `landing.js` bundle; fixes below |

Bundles: `home.js = [fog, wall, cine, smoke]`, `note-group.js = [note-group]`, `note.js = [note]`.

Fixes needed because of pretty URLs and the prefix:

- `notes-g.js` `fromWall = /index-g\.html/` and `cinema-g.js` `fromRoom = /index-g\.html/`
  → compare the referrer's pathname with the pathname of the page's own `[data-back]` link.
  `note-g.js` already works this way; copy its approach.
- `note-g.js` stores `location.pathname.split('/').pop()` in `sessionStorage.note`,
  and `notes-g.js` looks for `.row[href="<that>"]`. With `/notes/python/slots/` that's `''`.
  Store `location.pathname` and match rows by `row.pathname`.
- `sessionStorage.wall` = group id: no change. Keys used by G: `fog`, `wall`, `note`,
  `cine`, `cineIn`. The old shell uses `localStorage` `theme`/`rail`/`accent`; the two
  sets don't overlap.

`js/scripts.js` stays as it is, for the old shell. New pages don't load it: the copy
button lives in `note.js`, the term tooltip and `.more` need no JS, and table sorting is
only used in reviews.

## 7. Templates and data

**`notes/groups.js`** (one entry per note group; colours live in `note-groups.css`).
Not in `_data/`: it sits next to the group folders it lists. It still has to be global data,
because the room (`src/index.njk`, outside `notes/`) draws the groups on the wall, so
`.eleventy.js` loads it:

```js
eleventyConfig.addGlobalData('noteGroups', () => require('./src/notes/groups.js'));
```

It is never published: Eleventy builds only `md`/`njk` here, and no passthrough copies
`notes/*.js`. Check in step 4 that `npm run dev` rebuilds on an edit to it; if not, add
`addWatchTarget('src/notes/groups.js')`, or move it to `_data/noteGroups.js`.

```js
module.exports = [
  { id: 'python', title: 'Python', desc: 'Изнутри: от tuple до async.', tag: 'Python', embers: 'Тлеет',  done: '…', enabled: true },
  { id: 'docker', title: 'Docker', desc: 'Контейнеры без магии.',       tag: 'Docker', embers: 'В пути', done: '…', enabled: true },
];
```

`tag` is the group's own tag. It's left out of the topic buttons and the row tags, and it
decides where a draft lives (decision 4). Every Python note has `Python` as its first tag.
`embers` is the heading of the drafts block; when a group has no drafts, the block isn't shown.

**`notes/notes.11tydata.js`** gives every note its layout and group id, so no group needs
a data file of its own:

```js
module.exports = {
  layout: 'world/note.njk',
  eleventyComputed: {
    // notes/<group>/<file>.md → group id; index.njk and group.njk one level up get none
    groupId: (data) => {
      const parts = data.page.filePathStem.split('/');   // ['', 'notes', 'python', 'slots']
      return parts.length === 4 ? parts[2] : undefined;
    }
  }
};
```

`index.njk` and `group.njk` set their own `layout` in front matter, which wins over the
directory data. A new group needs no data file: its folder name is its id.

Front matter wins for notes too, and today every Python note and every draft to be moved
has `layout: note.njk`. Remove that line from each (notes in step 6, drafts in step 10),
or the directory layout never applies and deleting `_includes/note.njk` breaks the build.

The names differ on purpose: notes get a computed `groupId`, and `group.njk` (same folder,
so it gets this data too) paginates with the alias `noteGroup`. One name for both, and the
computed `undefined` could shadow the alias and break the group page permalinks.

**New filters** in `lib/filters.js`:

- `groupNotes(collection, id)` → published notes of the group, sorted by `upd_date` desc,
  then `title` (decision 8); `groupDrafts` → the group's drafts (`draft: true` in its folder), same order.
- `topics(notes, ownTag)` → `[{tag, count}]` for the side buttons, `все` first.
- `toc(content)` → `[{id, text}]` from `<h2 id>` without `.u-kicker`. The TOC is built at build time
  (the pitch has a static `<ol>`) instead of by `initTableOfContents`, so G does not need a
  copy of `generateSlug` in the browser.
- `shortDate` → `26 сен`; `isFresh(date)` → decision 7.

**`index.njk`** (the room, layout `world/shell.njk`). Card numbers come from collections
(`notes | length` + `plural`, reviews count); Cinema `1 разбор` stays hardcoded, like the
Cinema counters. The wall lists `noteGroups`, and the sigils come from `note-sigils.njk`
in `wall` mode (`pathLength`, `--w/--d`, `--done`). The `.glow` coordinates, `data-coal`,
and the alt text are copied as is.

**`notes/group.njk`** (layout `world/shell.njk`, pagination over `noteGroups` with alias
`noteGroup`, permalink `/notes/{{ noteGroup.id }}/`). Rows: `row__t` = `titleHtml or title`, `row__d` = `lede`, tags =
`tags` minus `tag`, meta = `reading_time or readingTime` + `shortDate`. Short notes with no
lede and no tags get the low row. Embers = `groupDrafts`. The mark comes from
`note-sigils.njk` in `mark` mode.

**`_includes/world/note.njk`.** Pitch structure: `.sky`, `.progress`, `.hud` with the mark and
`hud__gt`, `.nhead` (kicker, `h1` from `titleHtml or title`, meta), `article.note.prose`
(`.lede` and `ul.tldr` from frontmatter, then `content`), `.side` (`.toc` from `toc`,
back link). Not ported from the current `note.njk`: `.pager` and `.doc__foot`, because
W/S/A cover navigation. Notes get this layout from `notes.11tydata.js`; the only edit to
the note files is dropping `layout:` (above). A draft's page (decision 4) has no row number,
so its kicker is just the group: `python`.

**`docker/docker-1.md`** (moved from `src/drafts/`): `title: История Docker`,
`draft: true` removed, `tags` stay (`Docker`, `Linux`, `История`), plus `tg_desc` /
`tg_pub_time`. The text starts with a `::: warn Черновик` callout: "check dates, kernel
versions and names against primary sources before publishing". Do that check first, then
remove the callout.

**`meta.njk`.** OG/Telegram tags out of `base.njk`. Both shells include it, or note
links in Telegram lose their previews.

## 8. Cinema

Port the `cinema-g.html` diff into `src/cinema/index.html`:

- `<link rel="expect" blocking="render" href="#ready">` in `<head>`, `<i id="ready" hidden>`
  at the end of `<body>`;
- HUD `БИБЛИОТЕКА` gets `data-back` (href stays `../`) and the `hud__keys` hint `A в комнату`;
- the `.cine` return block (bars + black) before the scripts;
- landing bundles: CSS gains `cinema/_src/return.css` + `world/_src/vt.css`, JS gains
  `cinema/_src/return.js`.

The pitch-only changes are not ported: image paths and the Bebop row `href="#"`.

The room's `.cine__frame` img is `{{ pathPrefix }}/images/cinema/index/hero.jpg`, the
same file as the Cinema hero. It has to be: the transition relies on the two being
identical, pixel for pixel.

Bebop (`/cinema/bebop/`) gets no transition. Its `БИБЛИОТЕКА` → `../../` opens the room
the normal way. That's fine for now.

## 9. Work order

Run `npm run build:check` after each step. Every step leaves the site working.

Each step ends with its definition of done, in two parts:

- **Done when**: checks in the terminal (grep, `diff -r`, tests). `npm run build:check`
  passing is part of every step and isn't repeated. "Same as before the step" means: build
  before starting, keep a copy of `_site/` aside, `diff -r` after.
- **In the browser**: what to open and look at, in order. The site runs with `npm run dev`
  at `http://localhost:8080/`. The pitch is served from the repo root with
  `python3 -m http.server` at `http://localhost:8000/pitch/v4/` (view transitions need
  http, not `file://`). "Side by side" means Chrome at 1470x956, pitch and site in two
  windows. Steps 2-4 change nothing you can see; their list is a short look that nothing broke.

The tests from section 10 are spread over the steps that make them possible.

1. **Images.** Done: exported, committed and pushed to `library_static` with the source
   PNGs (section 3).

   Done when (met):
   - `room.{avif,jpg}`, `wall.{avif,jpg}` and the two source PNGs are in
     `library_static/src/images/world/`, pushed.
   - `images/world/meta.md` lists each file with its size and where it's used.
   - `deploy.yml` rsync has `--exclude '/world/*.png'`.

   In the browser (met):
   1. `:8000/pitch/v4/index-g.html`: room and wall show; the Network tab loads `room.avif`
      and `wall.avif` from `src/images/world/`, nothing from `pitch/v4/img/`.
2. **Bundle filter.** Done. Rename `cinemaBundle` to `bundle`, resolve parts from `src/`, add the
   `world/_src/` watch target. Cinema builds byte-for-byte the same. The comment header in
   each bundle still names just the file (`/* ── cinema.css ── */`), so the output didn't change.
   Also done in this step: `title` as the tie-breaker for `recentUpdates` and `searchIndex`
   (decision 8).

   Done when (met):
   - `grep -r cinemaBundle .eleventy.js src/` finds nothing; `src/cinema/bundles.njk`
     writes its parts as `cinema/_src/…`.
   - `diff -r` of `_site/` before and after shows nothing (Cinema included). Met for
     `_site/cinema/`. `index.html` and `search-index.json` differed only in order, because
     those lists weren't sorted in a fixed way before the step (decision 8). With the
     tie-breaker in place, two builds in a row are identical.
   - `addWatchTarget("src/world/_src/")` is in `.eleventy.js` (the rebuild itself is checked in step 3).

   In the browser (met):
   1. `/cinema/` and `/cinema/bebop/` look and work as before.
3. **Sources.** Copy the G CSS/JS into `world/_src/`, apply the splits, merges and cuts
   (sections 5-6), and add `world/bundles.njk`. Nothing uses the bundles yet.

   Done when:
   - Every `world/_src/` file in the tables of sections 5 and 6 exists. `cinema/_src/return.*`
     belong to step 9.
   - The cuts are gone: grepping `src/world/_src/` for `hero--dim`, `.patch`, `settings`,
     `.switch`, `stage__loop`, `unblue`, `wall-right`, `.band`, `index-g`,
     `только в варианте G` finds nothing; `notes.css` uses `.u-dim`, not `.dim`.
   - The JS fixes from section 6 are in: `note-group.js` compares pathnames with
     `[data-back]` and matches rows by `row.pathname`; `note.js` stores `location.pathname`.
   - Every `url()` points to `../fonts/` or `../images/world/`; the wall has the `image-set` with AVIF.
   - Each pair from "Values that must stay in sync" has a comment at both ends.
   - `_site/world/` holds exactly `home`, `note-group`, `note` × `.css`/`.js`, with parts in
     the section 5 order; `_site/world/_src/` doesn't exist.
   - `links.test.js` checks `src="…"` and `url(…)` (section 10) and passes; `_site/` outside
     `world/` is the same as before the step.

   In the browser (no page uses the bundles yet):
   1. `/world/home.css` and `/world/note.js` open; `/world/_src/shell.css` is a 404.
   2. With `npm run dev` running, change a value in `src/world/_src/shell.css`, reload
      `/world/home.css`: the change is there. Undo it.
4. **Partials and data.** Add `meta.njk` (wire it into `base.njk` as well),
   `notes/groups.js` (and its `addGlobalData`), `note-sigils.njk`, `world/shell.njk`, and the
   new filters with unit tests.

   Done when:
   - `_site/` is the same as before the step, apart from whitespace in `<head>`: `meta.njk`
     outputs the same OG/Telegram tags `base.njk` did.
   - `noteGroups` reaches templates, and under `npm run dev` an edit to `src/notes/groups.js`
     rebuilds (or the fallback from section 7 is applied).
   - `lib/filters.js` exports `groupNotes`, `groupDrafts`, `topics`, `toc`, `shortDate`,
     `isFresh`, and `.eleventy.js` registers them from there.
   - `test/filters.test.js` covers at least: drafts left out of `groupNotes`, `upd_date`
     order, own tag left out of `topics` with `все` first, `.u-kicker` `h2` skipped by `toc`,
     `26 сен`, and `isFresh` on both sides of 45 days.

   In the browser:
   1. `/notes/python/slots/` and a review page still look as before; view source shows the
      `og:` tags in `<head>`.
5. **Group pages.** `notes/group.njk`. Check `/notes/python/` against `notes-python.html`
   by eye, side by side.

   Done when:
   - `links.test.js` fails on any `a.row[href="#"]` in `_site/notes/` (section 10) and passes.
   - `_site/notes/python/index.html` loads `/world/note-group.{css,js}` and neither
     `css/styles.css` nor `js/scripts.js`.

   In the browser (the first step with something new to see):
   1. `/notes/python/` side by side with `notes-python.html`: layout, colours, mark, rows
      (including low rows), topic buttons and "к стене" match.
   2. Rows: every published Python note, newest `upd_date` first, numbered `01..NN`; fresh
      markers only on notes updated in the last 45 days. No embers block yet (step 10).
   3. Topic buttons start with `все` and have no `Python`. Click a topic, then type in the
      search: rows filter.
   4. Click a row: the note opens (still the old shell); back returns to the group page.
   5. "к стене" goes to `/#notes`, which is still the old home until step 8.
   6. `/notes/docker/`: no rows, no embers, nothing broken (it fills in step 10).
6. **Note layout.** Add `notes/notes.11tydata.js` and `_includes/world/note.njk`, and remove
   `layout: note.njk` from every note in `src/notes/python/` (section 7). Check `slots` against `note-slots.html` (the page that has every prose element) and
   `async` against `note-async.html`. The old `_includes/note.njk` is now unused.

   Done when:
   - `grep -rl '^layout:' src/notes/python/` finds nothing.
   - The list of `_site/notes/**/index.html` is the same as before the step (no URL moved),
     and every note page loads `/world/note.css`, none `css/styles.css`.
   - The `<head>` of a note has the same OG/Telegram tags as before the step.
   - Nothing in `src/` uses `_includes/note.njk` (grep for `note.njk` finds only `world/note.njk`).

   In the browser:
   1. `/notes/python/slots/` side by side with `note-slots.html`, element by element: code
      with highlighted and error lines, version badge, file name, `out`, callouts, figures,
      verdict, finale, footnotes, terms, tables.
   2. `/notes/python/async/` side by side with `note-async.html`.
   3. Side TOC: the note's `h2`s, without the finale and footnote titles; clicking jumps to them.
   4. The kicker number equals the note's row number on `/notes/python/`.
   5. W/S/A work; the copy button copies a code block.
   6. `/notes/python/` → a note → back: the group page finds the row again, as in the pitch.
   7. Open every other Python note once: nothing broken.
7. **Phones** (decision 3): figures, TOC, key hint.

   Done when:
   - Nothing beyond `build:check`: this step is checked in the browser.

   In the browser (DevTools device toolbar, 390x844, touch on):
   1. `/notes/python/slots/`: every figure can be read, labels at least ~11 px, by scrolling
      inside `.fig__frame` or by opening it full screen.
   2. The note has a table of contents, and its links jump to the headings.
   3. No `.hud__keys` hint on note and group pages. Cinema's hint (step 9) uses the same rule.
   4. `/notes/python/`: topics are a chip strip you swipe, rows are one column.
   5. Back at 1470x956: `slots`, `async` and `/notes/python/` look as they did after step 6.
   The real iPhone run stays in section 11.
8. **Home.** `src/index.njk` (the room), `/notes/` redirect. Remove `index.md`, the
   `recentUpdates` collection (`index.md` is its only user) and the recent-updates CSS from
   `css/styles.css`.

   Done when:
   - `src/index.md`, `src/notes/index.md` are gone; grepping `.eleventy.js` for
     `recentUpdates` and `src/css/styles.css` for the recent-updates classes finds nothing.
   - After `NODE_ENV=production npm run build`, `_site/notes/index.html` points to
     `/library/#notes`.

   In the browser:
   1. `/` side by side with `index-g.html`: room, cards, fog, smoke, glows match.
   2. The Notes card count equals the number of published notes; Reviews is "в работе".
   3. Pan to the wall: both groups with their sigils. Python → group page with the
      transition; "к стене" → back to the wall.
   4. Open `/#notes` directly: the wall at once. Open `/notes/`: you land on `/#notes`.
   5. Network tab: the room loads `room.avif`.
   6. The Cinema card opens `/cinema/` (the full transition comes in step 9).
9. **Cinema** (section 8). Check the whole room → Cinema → room loop by hand.

   Done when:
   - `src/cinema/index.html` has the four changes from section 8; `cinema/_src/return.{css,js}`
     exist and `return.js` compares pathnames, no `index-g`.
   - The landing bundles contain `return.css` + `world/_src/vt.css` and `return.js`.
   - The room's `.cine__frame` and the Cinema hero both use `images/cinema/index/hero.jpg`.
   - `_site/cinema/bebop/` is the same as before the step.

   In the browser:
   1. `/` → Cinema card: the letterbox/projector transition plays.
   2. On Cinema, `A` and `БИБЛИОТЕКА` each bring you back to the room with the return.
   3. Open `/cinema/` directly, then back and forward: no stuck black screen.
   4. Phone emulation: the `A в комнату` hint is hidden.
   5. `/cinema/bebop/` → `БИБЛИОТЕКА`: the room opens the normal way.
10. **Drafts and Docker.** Move `python-gil` and `unlimited-ints` into `src/notes/python/`,
    add `drafts.11tydata.js` (decision 4). Move `docker-1.md` to `src/notes/docker/` and publish it
    (decision 5). Drop `layout:` from all three. Until step 11 the two Python drafts still
    show in the old drawer's `Черновики`; that's fine.

    Done when:
    - `docker-1.md` has `title: История Docker`, `tg_desc`, `tg_pub_time`, no `draft`, no
      `layout:`; the facts are checked and the `::: warn Черновик` callout is gone.
    - `src/drafts/` holds only untagged files plus `drafts.11tydata.js`; `_site/drafts/`
      doesn't exist and `search-index.json` has no drafts.
    - `test/note-drafts.test.js` passes, and fails when a `Python`-tagged file is put in
      `src/drafts/` (try it once).

    In the browser:
    1. `/notes/python/`: both drafts under `Тлеет`, as plain text; rows and topic counts
       unchanged.
    2. `/notes/python/python-gil/` and `/notes/python/unlimited-ints/` open, with the kicker
       `python` and no number.
    3. `/notes/docker/`: one row `01`. Open it: `История Docker`, no draft callout.
    4. `/`: the Notes card count is up by one; on the wall, Docker opens its group page.
11. **Old shell.** In `base.njk`, the drawer's notes group links to `/notes/python/` etc.
    and the brand links to `/`; the `Черновики` group is removed. Remove `src/_includes/note.njk`,
    the `drafts` collection and the `/drafts/` → `Черновики` breadcrumb in `.eleventy.js`
    (nothing uses them now).

    Done when:
    - `src/_includes/note.njk` is gone; grepping `.eleventy.js` and `src/` for `Черновики`
      and for the `drafts` collection finds nothing.
    - `_site/reviews/` differs from before the step only in the drawer and the brand link.

    In the browser:
    1. A review page (`/reviews/anime/made-in-abyss/`): the drawer's notes group opens the
       group pages, there's no `Черновики`, the brand opens the room.
    2. Drawer search finds a note and opens it.
    3. Theme and accent still switch on the review page.
12. **Docs.** Turn `FINAL_STATE.md` into `docs/world.md`, updating paths and file names
    (keep "Values that must stay in sync" and "Don't repeat" word for word). Add a pointer
    to it in `DESIGN.md`, and rewrite the Architecture/Layout sections of `CLAUDE.md`,
    naming the old shell's files (section 4) as reviews-only.
    Mark `pitch/v4/` as reference only, frozen.

    Done when:
    - Every `src/` path in `docs/world.md` exists; the two kept sections are identical to
      `FINAL_STATE.md` apart from paths and file names.
    - `DESIGN.md` links to `docs/world.md`.
    - `CLAUDE.md` describes the G pages and the old shell as reviews-only, and no longer
      mentions `note.njk`, `recentUpdates`, the `drafts` collection, `Черновики` or `index.md`.
    - `pitch/v4/` says at its top (README or `FINAL_STATE.md`) that it's frozen, reference only.

    In the browser: nothing for this step. The full pass is section 11, the checks before
    merging to `main`.

## 10. Tests

- `links.test.js` only checks `href`. A missing `room.jpg`, bundle or font would still pass.
  Extend it to `src="…"` and to `url(…)` in `_site/world/*.css` and `_site/cinema/*.css`.
  Skip images when `_site/images/world/` is missing (a local build without the images copied
  in; `_site/images/` itself always has the committed `logo.png`). No CI runs the tests:
  `deploy.yml` only builds, so `npm run build:check` before pushing is the check.
- It skips `href="#…"`, so a row left over from the pitch with `href="#"` won't fail it.
  Add a check: no `a.row[href="#"]` in `_site/notes/`.
- Draft placement (`test/note-drafts.test.js`): fail if a file in `src/drafts/` has a note
  group's tag, or a file in a group folder lacks its group's tag. Otherwise a draft can
  silently go missing from its embers.
- Unit tests for the new filters (`groupNotes`, `topics`, `toc`, `shortDate`, `isFresh`).
  They are written straight into `lib/filters.js`, not `.eleventy.js`, so Jest can import them.
- The G browser JS gets no unit tests (it's all DOM and timing); the hand checks below cover it.

## 11. Checks before merging to `main`

- Chrome, MacBook screen (1470x956): every transition from `FINAL_STATE.md`, both directions,
  direct visits and back/forward.
- **Safari and Firefox**: not opened so far. Safari has cross-document view transitions;
  Firefox doesn't have `pagereveal` and takes the `pageshow` path. Both must at least
  navigate correctly, even without the animation.
- Production prefix: `NODE_ENV=production npm run build`, serve `_site/` under `/library/`,
  and go through all the loops (referrer checks, `sessionStorage.note`, VT names).
- Real iPhone (Safari): a note opened by direct link, a figure, the TOC, and room → wall → note
  by taps (decision 3).
- `prefers-reduced-motion`: every page reachable, nothing waits on an animation.
- Short screen (< 560 px tall): known bar mismatch on return from Cinema. Accept it or fix it.

## 12. Not migrated

`index.html`, `index-b..f.html`, `e.css`, `f.css`, `loop.js`, `notes.html`, both prompt
files, `note-docker-image.html`, `note-docker-layers.html`, and every image except the
two in section 3. They stay in `pitch/v4/` (untracked or gitignored) as reference.

## 13. TODO (not part of this migration)

### Self-host JetBrains Mono

Today every page loads it from Google Fonts: `shell.njk` (from the pitch, weights 400/500/700)
and `base.njk` (400/500/600). Cinema has no link at all, so its mono text falls back to
the system font. That makes three behaviours, plus a third-party request on every page.

- Put the variable `JetBrainsMono[wght].woff2` (covers 100-800, one file) in `src/fonts/`,
  next to Ysabeau. Add the italic file too: code comments are `font-style: italic`
  (`prose.css`, `.t-c` in `styles.css`), and right now the browser fakes the slant.
- `@font-face` in `world/_src/shell.css`, `css/styles.css`, `cinema/_src/cinema.css`;
  `url()` is `../fonts/…` in all three, since all three get published one level below the root.
- Remove the Google Fonts `<link>` and `preconnect` from `shell.njk` and `base.njk`.
  Preload the upright file like Ysabeau.
- Check: `.hud`/kicker letter-spacing and the code bar look the same (the metrics are
  identical, but the weight steps change: 600 vs 700).
- Add the licence (OFL) next to the file, like any self-hosted font.

### A convenient view of drafts before publishing

Now (decision 4) a group draft builds at its URL, but nothing links to it: the ember isn't a
link, so you have to type the address. Drafts with no group tag aren't built at all. Neither
can be read the way it will look on the site.

Proposal: everything visible in `npm run dev`, nothing extra in production. Eleventy 2
sets `process.env.ELEVENTY_RUN_MODE` (`serve` / `watch` / `build`), exposed as a global `dev`
flag:

- **Embers become links** in dev (to the draft's note page) and stay plain text in
  production.
- **The draft note page** gets a visible `черновик` mark in the header in dev, so a draft
  can't be mistaken for a published note in a screenshot.
- **Drafts with no group tag** are built in dev only (`drafts.11tydata.js`: `permalink` depends on
  `dev`), with a dev-only `/drafts/` index listing every draft, tagged or not, by `upd_date`.
- **Production**: decide whether group drafts still build at their URL (shareable for
  review by link) or not at all (`permalink: false` when not `dev`). Default: not at all,
  and dev is the place to read them.

Publishing then stays a one-line change: remove `draft: true`. The note was already
readable in dev with the final layout.
