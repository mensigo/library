# Design Foundation

This project uses a lightweight design foundation, not a full design system. Keep the site readable, calm, text-first, and consistent across notes and reviews.

## Principles

- Prioritize long-form reading over dense interface decoration.
- Keep the visual language quiet: paper-toned surfaces, hairline borders, limited shadows.
- **The shell is constant; only the accent moves.** The accent palette is the one user-facing variable, so components must never hardcode a color — they read `--acc*` and inherit whatever the reader picked.
- Preserve strong Cyrillic readability with the Ysabeau Infant stack; use JetBrains Mono for anything that is code, a label, or a number.
- Treat light and dark themes as equal experiences.
- Prefer existing BEM-style classes and local patterns before adding new abstractions.

## Tokens

Design tokens live in `src/css/styles.css` under `:root` and `[data-theme="dark"]`. There is no `prefers-color-scheme` block: the inline script in `base.njk` always stamps `data-theme` before first paint, so a media-query fallback would be unreachable.

Surfaces and text:

- `--bg`: page background. `--bg-sunk`: recessed tracks (the theme switch rail).
- `--surface` / `--surface-2`: raised panels and soft fills (cards, inline code, hovers).
- `--ink` / `--ink-2` / `--ink-3`: primary text, secondary text, metadata and placeholders.
- `--line` / `--line-2`: dividers and control borders.

Accent — the only tokens a palette swap touches:

- `--acc`: links, active navigation, TOC marker, progress bar.
- `--acc-soft`: tinted backgrounds for active states. `--acc-line`: accent borders.
- `--warn` / `--warn-soft`, `--danger` / `--danger-soft`: callout severities.

The accent is set **only** through `--acc*` written inline on `:root` (by `initPalette`, and pre-painted by the inline head script). Never fork a component's CSS per palette.

Code highlighting has its own family, consumed by both Prism classes and the manual `.t-*` classes:

- `--t-key`, `--t-str`, `--t-num`, `--t-fn`, `--t-com`, `--t-self`, `--t-dunder`, `--t-p`.
- `--code-bg`, `--code-chrome`: code block body and its title bar.
- `--t-str` and `--t-dunder` ride along with the palette, because a cold teal string literal fights a warm accent.

Non-color tokens:

- `--sans`, `--mono`: type stacks.
- `--doc-w` (`68ch`): reading column. `--topbar-h`, `--drawer-w`, `--rail-w`: shell dimensions.
- `--space-*`, `--radius-*`: spacing and radii.
- `--shadow-1` (resting elevation), `--shadow-2` (overlays and popovers).
- `--ease`, `--fast`, `--base`: motion.

Add new tokens only when the same decision appears in multiple places or when a value has a clear semantic role.

## Typography

- The page title lives in the layout's `.hero h1`, in mono, once per page. Markdown content therefore starts at `h2`.
- `.prose` owns article typography: `h2` draws a trailing rule, `h3`/`h4` step down, lists use custom markers, and `> * + *` supplies rhythm.
- Body copy is 17px/1.65 with `text-wrap: pretty`.
- Secondary text: `.hero__meta`, `.doc__foot`, `.note-media__caption`, `.fig figcaption`, `.railcard`, `.search-result-item__preview`. Most of these are mono, uppercase, and tracked out — that is the site's "label" voice.
- Inline code sits on `--surface-2` with a hairline border; code blocks live in the `.code` chrome.

## Layout

The shell is a two-column grid under a fixed bar:

- `.topbar`: fixed, 52px, holds the drawer trigger, breadcrumbs, rail/settings toggles, and the reading `.progress` line.
- `.drawer`: navigation. Off-canvas **at every width**, over a `.scrim`.
- `.shell`: `minmax(0, 1fr)` plus the rail column, which collapses to `0` when the rail is closed.
- `.doc` / `.doc__inner`: reading column capped at `--doc-w`.
- `.rail`: table of contents plus optional `.railcard`.

The single breakpoint is `1100px`. Above it, the rail is a docked grid column whose open/closed state persists in `localStorage`. Below it, the rail becomes a right-hand overlay: closed by default, dimmed by the scrim, closed by Esc or by tapping a TOC entry.

Keep the reading width constrained. If a page needs wider content, add a modifier rather than changing `--doc-w`.

## Reusable Patterns

- `.topbar`, `.topbar__crumbs`, `.iconbtn`, `.progress`: the persistent bar.
- `.drawer`, `.drawer__head`, `.drawer__brand`, `.drawer__search`, `.field`: navigation shell and search input.
- `.navgroup`, `.navgroup__title`, `.navlink`: flat navigation groups. No tree, no tabs.
- `.search-results`, `.search-result-item`: Fuse.js output, anchored under `.drawer__search`.
- `.shell`, `.doc`, `.doc__inner`, `.doc__foot`: reading surface.
- `.hero`, `.hero__tags`, `.hero__lede`, `.hero__meta`, `.chip` (`.chip--acc`): page header.
- `.tldr`: optional key-points block above the article.
- `.prose`: markdown body.
- `.code`, `.code__bar`, `.code__name`, `.code__lang`, `.copy`, `.code__out`: code blocks with a title bar, copy button, and attached output.
- `.callout` with `.callout--tip` / `.callout--warn` / `.callout--stop`, plus `.callout__ico` and `.callout__body`.
- `.fig`, `.fig__frame`, `figcaption`, and the `.d-*` SVG tokens for theme-aware diagrams.
- `.note-media`, `.note-media__image-wrapper`, `.note-media__image`, `.note-media__caption`: raw-HTML images that swap source per theme.
- `.tablewrap` + `table.tbl`: every table, markdown or shortcode-generated.
- `.rail`, `.rail__head`, `.toc` (`.lvl-2` / `.lvl-3` / `.lvl-4`), `.railcard`.
- `.cfg`, `.cfg__group`, `.seg` / `.seg__btn`, `.cfg__pick` / `.cfg__list` / `.cfg__opt`: settings popover.
- `.totop`, `.skip-link`, `.u-sr`, `.u-mono`.
- `.sortable`, `.sort-asc`, `.sort-desc`: sortable table headers.
- `.recent-updates`, `.recent-update-*`, `.badge-review` / `.badge-note` / `.badge-draft`: the home page feed.

Before adding a new pattern, check whether one of these can be extended with a modifier.

## States

- Open/expanded state is expressed through ARIA first — `aria-expanded` on triggers, `aria-pressed` on toggles, `aria-current="page"` on the active nav link, `aria-selected` in the palette list — and CSS styles those attributes directly. A class is added only when a parent needs to react.
- Class-based states: `.is-open` (drawer, scrim, palette list), `.is-active` (TOC entry), `.is-done` (copy button), `.is-on` (back-to-top), `.rail-open` (on `.shell`), `.is-locked` (on `body`, blocks scroll behind an overlay), `.show` (search results).
- Keep hover and focus states visible enough to discover controls; `:focus-visible` draws an accent outline.

## Accessibility

- Prefer semantic landmarks: `nav`, `main`, `aside`, `article`, `button`, and real links.
- Icon-only buttons need an `aria-label`.
- The drawer and the settings popover trap Tab while open, close on Esc, and restore focus to their trigger.
- Search keeps `role="searchbox"`; `/` and `Ctrl`/`Cmd`+`K` both open the drawer and focus it.
- Scroll-spy tuning (`rootMargin` in `initScrollSpy`) is paired with `scroll-margin-top: var(--topbar-h) + 20px` on headings; change them together.
- `prefers-reduced-motion` disables transitions and smooth scrolling — do not reintroduce motion that ignores it.
- Check color changes in both themes and across all eight palettes.

## Content Conventions

Notes use `layout: note.njk`; reviews use `layout: page.njk`; index pages use `layout: plain.njk` (no hero, so they start at `h1`).

Frontmatter: `title` (required, drives search and the hero), `upd_date`, `tags` (become `.chip`s; the first one gets the accent), optional `lede` (one-paragraph subtitle) and `tldr` (a list rendered as the key-points block). Reviews add `score`, `anime_status`, `manga_status`, `manga_author`, which surface in the `.railcard`. `draft: true` keeps a page out of the search index.

Authoring syntax, all handled by `amendLibrary` in `.eleventy.js`:

- Code fences carry the language, optional highlighted lines, and an optional file name:
  ```` ```python/3,5-7 slots.py ```` — line numbers are 0-indexed and go through the syntax-highlight plugin unchanged.
- `::: note`, `::: tip`, `::: warn`, `::: stop` … `:::` produce callouts. Text after the keyword replaces the default bold title.
- `::: out` … `:::` right after a fence renders the program's output attached to the block. A word after `out` relabels it.
- `![alt](/images/x.png "подпись")` alone in a paragraph becomes a `<figure class="fig">`; the title becomes the caption.
- Tables need no markup — every table is wrapped in `.tablewrap` automatically.
- `{.class}` attribute syntax is available via `markdown-it-attrs` for one-off modifiers.

Drop to raw HTML only for `.note-media`, and only when an image needs `data-image-light` / `data-image-dark` sources. Everything else should be markdown.

Headings generate the TOC. Start at `h2` and avoid skipping levels; anchor IDs are generated at build time by the same slug function the browser uses.
