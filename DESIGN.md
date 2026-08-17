# Design Foundation

This project uses a lightweight design foundation, not a full design system. Keep the site readable, calm, text-first, and consistent across notes and reviews.

## Principles

- Prioritize long-form reading over dense interface decoration.
- Keep the visual language quiet: low contrast surfaces, simple borders, limited shadows.
- Preserve strong Cyrillic readability with the existing Ysabeau Infant font stack.
- Treat light and dark themes as equal experiences.
- Prefer existing BEM-style classes and local patterns before adding new abstractions.

## Tokens

Design tokens live in `src/css/styles.css` under `:root`, `[data-theme="dark"]`, and the system dark-mode media query.

Use semantic color tokens for interface decisions:

- `--bg-color`: main page background.
- `--sidebar-bg`: navbar and sidebar surfaces.
- `--page-meta-bg`: soft panels, inline code, code blocks, and hover surfaces.
- `--text-primary`: primary reading text.
- `--text-secondary`: captions, metadata, placeholders, and secondary navigation.
- `--active-color`: selected or emphasized text.
- `--accent-color`: focus, active borders, sortable table states.
- `--border-color`: dividers and control borders.
- `--hover-bg` and `--active-bg`: generic interactive state backgrounds.

Use shared non-color tokens when values repeat across components:

- `--font-sans` and `--font-serif`: both currently use Ysabeau Infant with system fallbacks.
- `--font-mono`: code and preformatted text.
- `--content-max-width`: central reading column width.
- `--navbar-height`, `--sidebar-left-width`, `--sidebar-right-width`: shell layout dimensions.
- `--space-*`: common spacing steps.
- `--radius-*`: common border radii.
- `--shadow-*`: reusable shadows.
- `--motion-*`: transition timing.

Add new tokens only when the same decision appears in multiple places or when a value has a clear semantic role.

## Typography

- Use `.page-title` for template-level page titles. It is centered, large, and should appear once per page.
- Markdown headings inside `.content-center` create the article structure. Start note/review content at `h2` unless the layout already owns the page title.
- Body copy uses `.content-center p`: relaxed line-height, slightly larger text, and left alignment for readability.
- Use `.note-media__caption`, `.page-updated small`, `.search-result-item__preview`, and TOC labels for secondary text.
- Inline code and code blocks share the soft panel background and monospace token. Keep code styles functional and understated.

## Layout

The main shell is a three-column grid:

- `.sidebar-left`: sticky navigation and search.
- `.content-center`: central reading column.
- `.sidebar-right`: page table of contents.

At `1024px`, the right TOC is hidden. At `768px`, the shell becomes a single-column layout, the left sidebar becomes an off-canvas menu, and the navbar becomes relative.

Keep the central reading width constrained on desktop. If a page needs wider content, create a specific modifier instead of changing the default article width.

## Reusable Patterns

Use and extend the existing patterns:

- `.navbar`, `.navbar__section`, `.navbar__section--active`: top-level Reviews/Notes tabs.
- `.menu-toggle` and `.sidebar-overlay`: mobile navigation controls.
- `.sidebar-left`, `.sidebar-header`, `.site-logo`, `.site-title`, `.site-subtitle`: site identity and navigation shell.
- `.search-box`, `.search-input`, `.search-results`, `.search-result-item`: fuzzy search UI.
- `.nav-tree`, `.nav-section`, `.tree-item-self`, `.tree-item-children`: sidebar tree navigation.
- `.content-center`, `.article`, `.article__content`: reading surface.
- `.page-meta`, `.meta-item`, `.meta-label`, `.tag`: review metadata.
- `.note-media`, `.note-media__image-wrapper`, `.note-media__image`, `.note-media__caption`: note images and captions.
- `.toc-header`, `.toc-nav`, `.toc-link`: right-side table of contents.
- `.score-stars-container`, `.stars-wrapper`, `.star-container`: review score display.
- `.theme-toggle`: theme switching control.
- `.sortable`, `.sort-asc`, `.sort-desc`: sortable table states.

Before adding a new pattern, check whether one of these can be extended with a modifier class.

## States

State classes should remain explicit and readable:

- Use BEM modifiers for component-owned variants, such as `.navbar__section--active`.
- Use existing state classes for JS-driven behavior: `.active`, `.show`, `.is-collapsed`, `.mod-active`, `.navbar--hidden`, `.nav-tree--loading`, and `body.menu-open`.
- Keep hover and focus states visible enough to discover controls.
- Use `aria-current="page"` for current navigation links and keep it in sync with visual active states.

## Accessibility

- Prefer semantic landmarks: `nav`, `main`, `aside`, `article`, `button`, and real links.
- Buttons need clear `aria-label` text when their visible content is only an icon.
- Interactive non-button elements need keyboard support if they remain non-button elements.
- Search should preserve its `role="searchbox"` behavior and update result visibility accessibly.
- Focus states must not be removed without a visible replacement.
- Check color changes in both light and dark themes.
- Mobile menu behavior must keep the page from scrolling behind the open sidebar.

## Content Conventions

- Notes use `layout: note.njk`; reviews use `layout: page.njk`.
- Every searchable page should have a clear `title`.
- Use `upd_date` when the visible update date matters.
- Use headings to create the TOC; avoid skipping levels inside the same article section.
- Use fenced code blocks with language labels when possible.
- Wrap images in the note media pattern when they need captions, borders, or theme-specific sources.
- Keep tags short and descriptive.
- Mark unfinished pages with `draft: true` to exclude them from search.
