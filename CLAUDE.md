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

This is an [Eleventy](https://www.11ty.dev/) static site — a personal library/notes site with two main sections:

- **Reviews** (`src/reviews/`) — anime (`reviews/anime/*.md`) and philosophy (`reviews/philosophy/<author>/*.md`)
- **Notes** (`src/notes/`) — technical notes organized by topic (e.g. `notes/python/`)

### Key files

- **`.eleventy.js`** — all Eleventy config: collections, filters, shortcodes, passthrough copies, and the markdown pipeline. Defines `anime`, `notes`, `pythonNotes`, `philosophyCategories`, `drafts`, `recentUpdates`, and `searchIndex` collections.
- **`src/_includes/`** — Nunjucks layouts: `base.njk` (shell), `note.njk` (notes), `page.njk` (reviews), `plain.njk` (index pages — no hero).
- **`src/js/scripts.js`** — all client-side JS in one file. Top section exports pure utility functions (`applyTheme`, `highlightMatch`, `generateSlug`, `compareValues`, `resolvePalette`, `tocLinkClass`, `PALETTES`) for testability. Bottom section is browser-only initialization (`initTheme`, `initTableOfContents`, `initDrawer`, `initRail`, `initScrollSpy`, `initProgress`, `initCopy`, `initTableSorting`, `initSearch`, `initConfig`, `initPalette`).
- **`src/search-index.njk`** — generates `search-index.json` at build time from the `searchIndex` collection; consumed at runtime by Fuse.js for fuzzy search.
- **`src/css/styles.css`** — single stylesheet with CSS custom properties for theming (`data-theme="dark"` / `data-theme="light"`).
- **`DESIGN.md`** — the design foundation: tokens, layout, reusable patterns, and the markdown authoring syntax. Read it before touching CSS or adding markup patterns.

### Layout shell

Fixed `.topbar` (breadcrumbs + reading progress), off-canvas `.drawer` for navigation at every width, `.shell` grid holding the reading column `.doc` and the table-of-contents `.rail`. One breakpoint at `1100px`: above it the rail is a docked grid column, below it a right-hand overlay. Navigation is flat `.navgroup`s — no tree, no tabs.

`localStorage` keys: `theme` (`light`/`dark`), `rail` (`open`/`closed`), `accent` (palette id). The inline script in `base.njk` applies theme *and* accent before first paint; the palette map is duplicated there on purpose, so keep it in sync with `PALETTES` in `scripts.js`.

### Markdown pipeline

`.eleventy.js` extends markdown-it via `amendLibrary` (**not** `setLibrary` — that would drop the syntax highlighter registered by `addMarkdownHighlighter`). Authoring syntax:

- ` ```python/3,5-7 slots.py ` — language, 0-indexed highlighted lines, optional file name. Line highlighting comes from `eleventy-plugin-syntaxhighlight`, which emits `.highlight-line` / `.highlight-line-active`.
- `::: note` / `::: tip` / `::: warn` / `::: stop` … `:::` → callouts. Text after the keyword overrides the bold title.
- `::: out` … `:::` directly after a fence → output block attached to it.
- `![alt](src "caption")` alone in a paragraph → `<figure class="fig">`.
- Tables are auto-wrapped in `.tablewrap` + `table.tbl`; `markdown-it-attrs` is available for `{.modifier}`.

Heading anchors are generated at build time by a copy of `generateSlug` from `scripts.js` — the two must stay identical, or the TOC stops matching.

### Content frontmatter

Content files use these frontmatter fields:
- `title` — required for search indexing; drives the hero and breadcrumbs
- `layout` — `note.njk`, `page.njk`, or `plain.njk`
- `upd_date`, `tg_pub_time`, `tg_desc` — metadata for OG/Telegram tags
- `tags` — rendered as `.chip`s in the hero (first one gets the accent)
- `lede` — optional one-paragraph subtitle; `tldr` — optional list rendered as a key-points block
- `score`, `anime_status`, `manga_status`, `manga_author` — reviews only; surface in the rail's `.railcard`
- `draft: true` — excludes item from search index, includes it in the Черновики nav group

### Tests

`test/scripts.test.js` covers the exported utility functions from `scripts.js`; `test/links.test.js` walks every `href` in `_site/` and fails on dangling internal links (run a build first). Jest runs with jsdom environment. Only `src/js/**/*.js` is included in coverage.

`scripts.js` binds its bootstrap to `DOMContentLoaded` rather than calling `init()` immediately — that keeps the module safe to `require()` in jsdom, where the event never fires.
