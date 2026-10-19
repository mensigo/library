# CLAUDE.md

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server with live reload (eleventy --serve --watch)
npm run build     # Build to _site/
npm test          # Run Jest tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:links    # Check _site/ for dangling internal links
npm run build:check   # build + test:links
```

Build output goes to `_site/`. In production (`NODE_ENV=production`), the path prefix `/library` is prepended to all asset URLs via the `pathPrefix` global.

## Architecture

This is an [Eleventy](https://www.11ty.dev/) static site — a personal library/notes site. Two designs live side by side:

- **The world** (`docs/world.md`) — `/` is the room, `/#notes` the wall with the note groups, `/notes/<group>/` a group page, `/notes/<group>/<note>/` a note. The way into `/cinema/` (a hand-authored world of its own, `src/cinema/`) starts from the room.
- **The old shell** (`DESIGN.md`) — used only by reviews: anime (`reviews/anime/*.md`) and philosophy (`reviews/philosophy/<author>/*.md`). Hidden for now: `reviews/reviews.11tydata.js` sets `permalink: false`, so none is built; the room's Reviews card still counts them. They move to the new design later, as their own migration.

### Key files

- **`.eleventy.js`** — all Eleventy config: collections, filters, shortcodes, passthrough copies, and the markdown pipeline. Defines `anime`, `notes`, `philosophyCategories`, `reviews`, and `searchIndex` collections; registers the `bundle` filter and the filters from `lib/filters.js`; loads `src/notes/groups.js` as the global `noteGroups`.
- **`lib/filters.js`** — the world's filters (`groupNotes`, `groupDrafts`, `topics`, `toc`, `shortDate`, `isFresh`), kept out of `.eleventy.js` so Jest can import them.
- **`DESIGN.md`** — the old shell's design foundation, plus the markdown authoring syntax both designs use. **`docs/world.md`** — the new design: files, bundles, transitions, values that must stay in sync, images. Read the right one before touching CSS or adding markup patterns.

The world:

- **`src/index.njk`** (the room), **`src/notes/group.njk`** (group pages, paginated over `noteGroups`), **`src/notes/index.njk`** (`/notes/` → `/#notes` redirect). One-off pages keep their markup inline.
- **`src/_includes/world/`** — layouts several pages share: `shell.njk` (`<head>` + body slot; page data `bundle`, `groupId`, `expectReady`), `note.njk` (the note page), `note-sigils.njk` (macro `sigil(id, "wall" | "mark")`). `src/_includes/meta.njk` holds the OG/Telegram tags for both designs.
- **`src/world/_src/`** — CSS/JS sources, never published. **`src/world/bundles.njk`** joins them into `/world/{home,note-group,note}.{css,js}`. `src/cinema/_src/` + `src/cinema/bundles.njk` do the same for Cinema.
- **`src/notes/groups.js`** — one entry per note group (`id`, `title`, `desc`, `tag`, `embers`, `find`, `enabled`). **`src/notes/notes.11tydata.js`** gives every note `layout: world/note.njk` and `groupId` from its folder name.
- **`src/drafts/`** — drafts with no group tag: not built, in no collection (`drafts.11tydata.js`). A draft with a group's tag lives in that group's folder with `draft: true`.

The old shell (reviews only; delete these files, the `searchIndex` collection, the `src/css` / `src/js` passthroughs and `test/scripts.test.js` when reviews move):

- **`src/_includes/`** — `base.njk` (shell), `page.njk` (reviews), `plain.njk` (index pages — no hero).
- **`src/js/scripts.js`** — all old-shell JS in one file. Top section exports pure utility functions (`applyTheme`, `highlightMatch`, `generateSlug`, `compareValues`, `resolvePalette`, `tocLinkClass`, `PALETTES`) for testability. Bottom section is browser-only initialization (`initTheme`, `initTableOfContents`, `initDrawer`, `initRail`, `initScrollSpy`, `initProgress`, `initCopy`, `initTerms`, `initTableSorting`, `initSearch`, `initConfig`, `initPalette`).
- **`src/search-index.njk`** — generates `search-index.json` at build time from the `searchIndex` collection; consumed by the drawer's Fuse.js search.
- **`src/css/styles.css`** — single stylesheet with CSS custom properties for theming (`data-theme="dark"` / `data-theme="light"`).

### Images

Image files live in the images repo `library_static` under `src/images/`; deploy rsyncs them into `src/images/` here (`deploy.yml`, gitignored, only `logo.png` is committed), and `addPassthroughCopy("src/images")` publishes them at `/images/…`. For `npm run dev`, copy them in by hand.

The top-level `images/` folder is the meta image of `library_static/src/images/`: same subfolders, one `meta.md` each (`images/cinema/meta.md`, `images/world/meta.md`) listing which file is used where and its size. Only `meta.md` files are tracked there (`.gitignore`); anything else in `images/` is local scratch. When adding, replacing or removing an image, update its folder's `meta.md`.

### Layout

**The world.** Every page carries its own markup inside `world/shell.njk`; there is no shared chrome. The room is one screen (`.stage` + `.wall`, the camera pans between them); group and note pages put the wall behind a darkened header, a `.hud` with breadcrumbs on top, and a `.side` column (topics and embers, or the note's TOC) next to the content. One breakpoint at `1100px`: below it the page goes to one column (topics become a chip strip above the rows, embers sit under them), the note's TOC collapses under the header, and key hints hide. Navigation is by view transitions, W/A/S/D and `history.back()`; state between pages goes through `sessionStorage` (`fog`, `wall`, `note`, `cine`, `cineIn`). Details: `docs/world.md`.

**The old shell (reviews).** Fixed `.topbar` (breadcrumbs + reading progress), off-canvas `.drawer` for navigation at every width, `.shell` grid holding the reading column `.doc` and the table-of-contents `.rail`. One breakpoint at `1100px`: above it the rail is a docked grid column, below it a right-hand overlay. Navigation is flat `.navgroup`s — no tree, no tabs.

`localStorage` keys: `theme` (`light`/`dark`), `rail` (`open`/`closed`), `accent` (palette id). The inline script in `base.njk` applies theme *and* accent before first paint; the palette map is duplicated there on purpose, so keep it in sync with `PALETTES` in `scripts.js`.

### Markdown pipeline

`.eleventy.js` extends markdown-it via `amendLibrary` (**not** `setLibrary` — that would drop the syntax highlighter registered by `addMarkdownHighlighter`). Authoring syntax:

- ` ```python/3,5-7 slots.py ` — language, 0-indexed highlighted lines, optional file name. A second slash-group marks error lines: ` ```python//2 ` → `.highlight-line-remove`. A trailing `@3.12` token → version badge (`.code__ver`) next to the language badge. Line highlighting comes from `eleventy-plugin-syntaxhighlight`, which emits `.highlight-line` / `.highlight-line-active`.
- `::: note` / `::: tip` / `::: warn` / `::: stop` … `:::` → callouts. Text after the keyword overrides the bold title.
- `::: out` … `:::` directly after a fence → output block attached to it. A nested fence inside it renders without chrome, so indented output (bytecode dumps, tracebacks) survives markdown; bare text inside wraps as a paragraph.
- `::: split` … `:::` → two code blocks side by side; `:::: verdict` around `::: yes` / `::: no` → the two-column verdict block; `::: finale` … `:::` → the closing block. Nesting needs four colons outside, three inside.
- `[^1]` footnotes → `.fnref` links and a `.notes-block` list (`markdown-it-footnote`, re-rendered into the design's markup).
- `*[CNCF]: расшифровка` on its own line → every `CNCF` in that file becomes `<abbr class="term" data-tip="…">`: dotted underline plus a hover/focus caption (`markdown-it-abbr`, re-rendered so the text sits in `data-tip`, not `title`).
- `![alt](src "caption")` alone in a paragraph → `<figure class="fig">`; a caption of the form `"Label | text"` splits into an accent label and body. Hand-drawn SVG diagrams live in `src/_includes/figures/*.njk` and are pulled in with `{% include %}` — keep those partials free of blank lines, or markdown-it breaks the HTML block apart.
- Tables are auto-wrapped in `.tablewrap` + `table.tbl`; `markdown-it-attrs` is available for `{:.modifier}` (the delimiter is `{:` … `}`, so dicts inside `::: out` are not eaten). `{:.ok}` / `{:.no}` colour a table cell.
- Headings marked `.u-kicker` (the `finale` and footnote titles) are skipped by the TOC (so are the `.verdict` column titles) and the `01/02/03` section counter.

Heading anchors are generated at build time by a copy of `generateSlug` from `scripts.js` — the two must stay identical, or the old shell's TOC stops matching. The world's TOC is built from those ids at build time (`toc` filter), with no browser copy.

### Content frontmatter

Content files use these frontmatter fields:
- `title` — required for search indexing; drives the page heading and breadcrumbs. `titleHtml` — optional markup for the heading (e.g. muted dunders)
- `layout` — reviews only: `page.njk` or `plain.njk`. Notes have no `layout:` line (it would override `notes.11tydata.js`)
- `upd_date` — orders a group's rows (newest first, then `title`) and drives the "fresh" marker (45 days); `tg_pub_time`, `tg_desc` — metadata for OG/Telegram tags. A note posted to Telegram keeps its URL
- `tags` — a note's tags include its group's `tag` (`Python`, `Docker`; `test/note-drafts.test.js` checks it); the rest become row tags and topic buttons. In reviews, `.chip`s in the hero (first one gets the accent)
- `lede` — optional one-paragraph subtitle (also the row's description); `tldr` — optional list rendered as a key-points block
- `reading_time` — optional override of the computed reading time
- `score`, `anime_status`, `manga_status`, `manga_author` — reviews only; surface in the rail's `.railcard`
- `draft: true` — excludes item from search index and from the group's rows; a draft in `notes/<group>/` is listed in the group page's embers block

### Tests

`test/scripts.test.js` covers the exported utility functions from `scripts.js`; `test/filters.test.js` covers `lib/filters.js`; `test/note-drafts.test.js` checks that drafts sit where their tag says. `test/links.test.js` walks every `href` and `src` in `_site/` and every `url()` in the `/world/` and `/cinema/` bundles, and fails on dangling internal links and on `a.row[href="#"]` (run a build first; images are skipped when `src/images/world/` wasn't copied in). No CI runs the tests: run `npm run build:check` before pushing. Jest runs with jsdom environment. Coverage includes `src/js/**/*.js` and `lib/**/*.js`.

`scripts.js` binds its bootstrap to `DOMContentLoaded` rather than calling `init()` immediately — that keeps the module safe to `require()` in jsdom, where the event never fires.
