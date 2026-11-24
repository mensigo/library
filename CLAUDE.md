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

This is an [Eleventy](https://www.11ty.dev/) static site — a personal library/notes site. One design, **the world** (`docs/world.md`): `/` is the room, `/#notes` the wall with the note groups, `/notes/<group>/` a group page, `/notes/<group>/<note>/` a note, `/blog/` the blog feed (`/blog/page/<n>/`), `/blog/<id>/` a post. The way into `/cinema/` (a hand-authored world of its own, `src/cinema/`) starts from the room.

Anime and book write-ups come back as blog posts with their own tags (`аниме`, `книги`). Two anime drafts already wait in `src/blog/`: `anime-watched.md` (the table of watched titles, `{:.sortable}`) and `made-in-abyss.md`.

### Key files

- **`.eleventy.js`** — all Eleventy config: collections, filters, passthrough copies. Defines the `posts` collection (the blog, via `blogPosts`); registers the syntax highlighter, `amendLibrary("md", amend)` and the `toc` filter from `lib/markdown.js`, the `bundle` filter, the filters from `lib/filters.js` and `noteGroup` / `noteCount` from `lib/note-group.js`; loads `src/notes/groups.js` as the global `noteGroups`.
- **`lib/markdown.js`** — the markdown pipeline. Two exports: `amend(md)` adds every authoring rule to a markdown-it instance; `toc(html)` returns `[{ id, text }]` of the `h2` sections without `.u-kicker` (the note's TOC, read from that markup). Everything else (slugs, containers, the code bar, footnotes, terms, figures, tables) is private.
- **`lib/note-group.js`** — the note group module (`GLOSSARY.md`: group view). `collections.all | noteGroup(id)` returns `{ group, rows, drafts, topics, rowOf(url) }`: rows are `{ note, n, tags, fresh }` (tags without the group's own tag), drafts the same with `n: null`. The room counts with `noteCount`; `notes.11tydata.js` takes `groupIdOf`. Every rule about a group's notes, numbers and tags lives here, not in templates.
- **`lib/filters.js`** — the world's other filters (`shortDate`; for the blog `blogPosts`, `longDate`, `rootLinks`, `beforeMore`), kept out of `.eleventy.js` so Jest can import them.
- **`docs/world.md`** — the design: files, bundles, transitions, values that must stay in sync, images. Read it before touching CSS or adding markup patterns. The markdown authoring syntax is its "Authoring syntax" section.

Pages and layouts:

- **`src/index.njk`** (the room), **`src/notes/group.njk`** (group pages, paginated over `noteGroups`), **`src/notes/index.njk`** (`/notes/` → `/#notes` redirect). One-off pages keep their markup inline.
- **`src/_includes/world/`** — layouts several pages share: `shell.njk` (`<head>` + body slot; page data `bundle`, `groupId`, `expectReady`), `note.njk` (the note page), `post.njk` (the post page), `post-macro.njk` (macro `post(…)`: one post, shared by the feed and the post page), `note-sigils.njk` (macro `sigil(id, "wall" | "mark")`). `src/_includes/meta.njk` holds the OG/Telegram tags.
- **`src/world/_src/`** — CSS/JS sources, never published. **`src/world/bundles.njk`** joins them into `/world/{home,note-group,note,blog}.{css,js}`. `src/cinema/_src/` + `src/cinema/bundles.njk` do the same for Cinema.
- **`src/world/_src/back.js`** — the way back (`GLOSSARY.md`), the first JS part of every page with `[data-back]` (group page, note, blog, Cinema's landing). The page calls `wayBack({ also, before, hold })` once; the module decides `history.back()` or the link (referrer vs the last `[data-back]`, and the tab must have history) and owns the clicks and A / Left / Escape. Pages keep only their own: marks for the next page (`before`), the pause before leaving (`hold`), extra referrer paths (`also`). `copy.js` is the code blocks' copy button (note and blog).
- **`src/notes/groups.js`** — one entry per note group (`id`, `title`, `desc`, `tag`, `embers`, `find`, `enabled`). **`src/notes/notes.11tydata.js`** gives every note `layout: world/note.njk` and `groupId` from its folder name.
- **`src/blog/`** — `index.njk` (the feed, paginated over `collections.posts`, 10 per page), one `.md` per post, `blog.11tydata.js` (layout `world/post.njk`, bundle `blog`, permalink `/blog/<id>/`, `false` for drafts).
- **`src/drafts/`** — drafts with no group tag: not built, in no collection (`drafts.11tydata.js`). A draft with a group's tag lives in that group's folder with `draft: true`.

### Images

Image files live in the images repo `library_static` under `src/images/`; deploy rsyncs them into `src/images/` here (`deploy.yml`, gitignored, only `logo.png` is committed), and `addPassthroughCopy("src/images")` publishes them at `/images/…`. For `npm run dev`, copy them in by hand.

The top-level `images/` folder is the meta image of `library_static/src/images/`: same subfolders, one `meta.md` each (`images/cinema/meta.md`, `images/world/meta.md`) listing which file is used where and its size. Only `meta.md` files are tracked there (`.gitignore`); anything else in `images/` is local scratch. When adding, replacing or removing an image, update its folder's `meta.md`.

### Layout

Every page carries its own markup inside `world/shell.njk`; there is no shared chrome. The room is one screen (`.stage` + `.wall`, the camera pans between them); group and note pages put the wall behind a darkened header, a `.hud` with breadcrumbs on top, and a `.side` column (topics and embers, or the note's TOC) next to the content. One breakpoint at `1100px`: below it the page goes to one column (topics become a chip strip above the rows, embers sit under them), the note's TOC collapses under the header, and key hints hide. Navigation is by view transitions, W/A/S/D and the way back (`back.js`); state between pages goes through `sessionStorage` (`fog`, `wall`, `note`, `cine`, `cineIn`). Details: `docs/world.md`.

### Markdown pipeline

The pipeline lives in `lib/markdown.js`; `.eleventy.js` applies it with `amendLibrary("md", amend)` (**not** `setLibrary` — that would drop the syntax highlighter registered by `addMarkdownHighlighter`, which stays in `.eleventy.js`). Authoring syntax:

- ` ```python/3,5-7 slots.py ` — language, 0-indexed highlighted lines, optional file name. A second slash-group marks error lines: ` ```python//2 ` → `.highlight-line-remove`. A trailing `@3.12` token → version badge (`.code__ver`) next to the language badge. Line highlighting comes from `eleventy-plugin-syntaxhighlight`, which emits `.highlight-line` / `.highlight-line-active`.
- `::: note` / `::: tip` / `::: warn` / `::: stop` … `:::` → callouts. Text after the keyword overrides the bold title.
- `::: out` … `:::` directly after a fence → output block attached to it. A nested fence inside it renders without chrome, so indented output (bytecode dumps, tracebacks) survives markdown; bare text inside wraps as a paragraph.
- `::: more Заголовок` … `:::` → a collapsible `<details class="more">`, closed by default; the text after `more` is the summary (default «Подробнее»).
- `::: split` … `:::` → two code blocks side by side; `:::: verdict` around `::: yes` / `::: no` → the two-column verdict block; `::: finale` … `:::` → the closing block. Nesting needs four colons outside, three inside.
- `[^1]` footnotes → `.fnref` links and a `.notes-block` list (`markdown-it-footnote`, re-rendered into the design's markup).
- `*[CNCF]: расшифровка` on its own line → every `CNCF` in that file becomes `<abbr class="term" data-tip="…">`: dotted underline plus a hover/focus caption (`markdown-it-abbr`, re-rendered so the text sits in `data-tip`, not `title`).
- `![alt](src "caption")` alone in a paragraph → `<figure class="fig">`; a caption of the form `"Label | text"` splits into an accent label and body. Hand-drawn SVG diagrams live in `src/_includes/figures/*.njk` and are pulled in with `{% include %}` — keep those partials free of blank lines, or markdown-it breaks the HTML block apart.
- Tables are auto-wrapped in `.tablewrap` + `table.tbl`; `markdown-it-attrs` is available for `{:.modifier}` (the delimiter is `{:` … `}`, so dicts inside `::: out` are not eaten). `{:.ok}` / `{:.no}` colour a table cell. Attributes for the whole table go on their own line after a **blank** line below it: `{:.sortable}` → `<table class="tbl sortable">` (other classes and attributes pass through too); without the blank line they land on an extra empty row. The sorting JS doesn't exist in the world yet, so `.sortable` only marks the table for now.
- Headings marked `.u-kicker` (the `finale` and footnote titles) are skipped by the TOC (so are the `.verdict` column titles) and the `01/02/03` section counter.

Heading anchors are generated at build time by `generateSlug` in `lib/markdown.js`; the note's TOC is built from those ids at build time (`toc` filter), with no browser copy.

### Content frontmatter

Content files use these frontmatter fields:
- `title` — required; drives the page heading and breadcrumbs. `titleHtml` — optional markup for the heading (e.g. muted dunders)
- no `layout` — notes and posts have no `layout:` line (it would override `notes.11tydata.js` / `blog.11tydata.js`)
- `upd_date` — orders a group's rows (newest first, then `title`) and drives the "fresh" marker (45 days); `tg_pub_time`, `tg_desc` — metadata for OG/Telegram tags. A note posted to Telegram keeps its URL
- `tags` — a note's tags include its group's `tag` (`Python`, `Docker`; `test/note-drafts.test.js` checks it); the rest become row tags and topic buttons
- `lede` — optional one-paragraph subtitle (also the row's description); `tldr` — optional list rendered as a key-points block
- `reading_time` — optional override of the computed reading time
- `draft: true` — excludes a note from the group's rows; a draft in `notes/<group>/` is listed in the group page's embers block. A blog draft isn't built at all and may go without an `id`

Blog posts (`src/blog/*.md`) use `title`, `tags` (the post's kind, shown in the feed; never a note group's tag), `tg_desc` / `tg_pub_time` as notes, `draft`, and:
- `id` — required once published: the URL `/blog/<id>/`. Written by hand, the next free number; never computed, never reused (`test/blog-posts.test.js`)
- `date` — required: feed order (newest first) and the shown date. Eleventy's own field, not `upd_date`
- `untitled: true` — no heading in the feed (short posts)
- `<!-- more -->` on its own line ends the feed preview; the post page shows everything

### Tests

`test/markdown.test.js` covers `lib/markdown.js` through `amend` and `toc`: markdown in, HTML out, built the way Eleventy builds markdown-it (every authoring rule above, heading anchors, the TOC); `test/filters.test.js` covers `lib/filters.js` (no TOC there); `test/note-group.test.js` covers `lib/note-group.js` through `noteGroup` (rows, numbers, tags, fresh, drafts, topics, `rowOf`); `test/note-drafts.test.js` checks that drafts sit where their tag says; `test/markdown-links.test.js` fails on root links (`](/…)`, `href="/…"`) in `src/**/*.md` outside `src/drafts/` and `src/blog/`, since markdown doesn't get `pathPrefix`: link notes relatively (`../disassemble/`). In `src/blog/` it's the reverse: a post renders at two depths, so it links from the root (`/notes/python/slots/`) and the templates prefix those links (`rootLinks`); a relative link there fails. `test/blog-posts.test.js` checks posts' `title`, `date` and unique `id`s. `test/back.test.js` covers `src/world/_src/back.js` through `wayBack`: each test loads it into its own `jsdom` window (real `referrer` and history length) and clicks or presses keys. `test/links.test.js` walks every `href` and `src` in `_site/` and every `url()` in the `/world/` and `/cinema/` bundles, and fails on dangling internal links and on `a.row[href="#"]` (run a build first; images are skipped when `src/images/world/` wasn't copied in). No CI runs the tests: run `npm run build:check` before pushing. Jest runs in the node environment. Coverage includes `lib/**/*.js`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `library` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical labels plus `done`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
