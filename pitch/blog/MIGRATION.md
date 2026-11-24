# Migration: blog pitch → the site

Plan for moving the blog pitch (`pitch/blog/`, variant A "тетрадь") into `src/`. The blog
takes the room's second card (now "Обзоры", `data-soon`). Reviews stay hidden; later
they come back as blog posts with their own tags (`аниме`, `книги`), as a separate
migration. Section 1 holds the decisions, section 7 the work order with a definition of
done for each step.

## 0. What we're merging

| | Pitch (`pitch/blog/`) | Site now (`src/`) |
|---|---|---|
| Room card 02 | "Блог", leads to the feed | "Обзоры", `data-soon`, fog with "в работе" |
| Way in | the room goes black, the feed fades in from black | light smoke fog (`fog.js`) |
| Feed | one column, full posts, handwritten date, `· · ·` between posts, pager | none |
| Post page | none (the date is an anchor) | none |
| Way back | breadcrumb / A / Escape: the page goes black, `history.back()` | same pattern as notes (`[data-back]`) |
| Theme | dark only, world tokens, grain + warm glow from the top | the world's tokens (`shell.css`) |

## 1. Decisions

1. **URLs.** Feed `/blog/` (`/library/blog/` in production), older pages
   `/blog/page/2/`, `/blog/page/3/`… Every post, short or long, also builds its own page
   `/blog/<id>/`: `/blog/1/`, `/blog/2/`… The date in the feed links to it. Reason: an
   anchor on the feed (`/blog/#hello`) moves to page 2 once ten newer posts come in,
   and a post posted to Telegram has to keep its URL.
2. **Sources and ids.** One `.md` per post in `src/blog/`, with a readable file name
   (`hello.md`, `keyboard.md`) that doesn't reach the URL. The URL number is the
   `id` in front matter, written by hand: 1 for the first post, then the next free
   number. Never computed from the post's position, or publishing a draft or deleting a
   post would shift every later link. Ids are unique (a test checks); gaps after a
   deleted post are fine; an id is never reused.
3. **Long posts: `<!-- more -->`.** A line `<!-- more -->` in a post ends its preview: the
   feed shows the text above it plus `Читать дальше →` linking to `/blog/<id>/`; the post
   page shows everything (the marker is an HTML comment and stays invisible). A post
   without the marker is shown in full in the feed. Eleventy 2's markdown-it keeps raw
   HTML on (`html: true`), so the comment survives rendering, and the cut happens on
   the built HTML.
4. **Front matter.**

   ```yaml
   ---
   id: 1                    # required (except drafts): the URL /blog/1/
   title: Привет            # required: <title>, OG, post heading
   date: 2026-11-24         # required: order (newest first) and the shown date
   tags: [claude]           # optional: the kind; several are joined with " · "
   tg_desc: …               # optional, as for notes (meta.njk)
   tg_pub_time: …           # optional
   untitled: true           # optional: no heading in the feed (short "daily life" posts)
   draft: true              # optional: not built, not in the feed
   ---
   ```

   `date` is Eleventy's own field, not `upd_date`: posts are written once and don't move
   when edited. The known kinds for now: `claude`, `программы`, `железо`, `жизнь`.
   There's no fixed list, and no test checks it. A post with no tags shows no kind
   label (the first post, `hello.md`, has none).
5. **Order and pages.** Newest `date` first, then `title` (`localeCompare`, `'ru'`), so
   two builds in a row are identical. 10 posts per page. The pager shows only when
   there's more than one page.
6. **Drafts.** A blog draft sits in `src/blog/` with `draft: true`: it's not built and
   not in `posts`. It may go without an `id` until it's published. That differs from notes, where a draft builds at its URL and shows as
   an ember; a blog has no embers. `src/drafts/` stays for drafts with no home.
7. **Links and images inside posts.** The same post body renders at two depths
   (`/blog/` and `/blog/<id>/`), so relative links (`../notes/…`) can't work in both.
   Posts use **root** links (`/notes/python/slots/`, `/images/blog/x.avif`), and both
   templates pass the body through a `rootLinks(pathPrefix)` filter that prefixes
   `href="/` and `src="/`. `test/markdown-links.test.js` skips `src/blog/` and gets a
   reverse check: in `src/blog/` a **relative** link fails.
8. **Markdown.** Post bodies get `class="prose"` and the blog bundle includes
   `prose.css`, so every authoring syntax from `CLAUDE.md` (code with a file name,
   callouts, figures, footnotes, terms) works in posts without new CSS. The pitch's own
   `pre` / `code` / `.fig` rules are dropped in favour of prose's. Section numbers
   (`h2::before` counter) are off inside posts.
9. **Way in: darkening, not smoke.** The card gets `data-dusk`. `fog.js` turns the fog
   black with no title (`.fog--dusk`), waits 450 ms and goes to the href. The blog page
   starts black and fades in (`.dusk`, .7 s). The blog bundle has **no `vt.css`**: the
   page doesn't opt into cross-document view transitions, so there's no black→black
   crossfade on top of the darkening (see "Don't repeat" in `docs/world.md`).
10. **Way back.** Breadcrumb `БИБЛИОТЕКА`, A / Left / Escape: the page goes black
   (450 ms), then `history.back()` if the page was opened from its `[data-back]` target
   (same referrer check as `note.js`), otherwise `location.href`. The room comes back
   from bfcache with the black fog still on; `fog.js`'s `pageshow` takes it off, and the
   room lightens. On a post page `[data-back]` is the feed, and any `/blog/` page counts
   as opened-from (page 2 → post → back returns to page 2).
11. **Fonts.** Caveat's `@font-face` moves from `room.css` to `shell.css`: the blog
    title uses it too. An unused face costs nothing; the browser loads it on first use.
12. **The `reviews` collection goes.** Its only consumer is the room card's count.
    `reviews.11tydata.js` stays (reviews stay unbuilt); its comment changes.
13. **`data-soon` stays** in `fog.js` / `room.css` with no card using it, for the next
    unfinished section. Say so in `docs/world.md`.

## 2. URL map

| URL | Source |
|---|---|
| `/blog/` | `src/blog/index.njk`, page 1 |
| `/blog/page/<n>/` | the same template, pages 2… |
| `/blog/<id>/` | the `src/blog/*.md` with that `id`, layout `world/post.njk` |

## 3. Files

New:

| File | Role |
|---|---|
| `src/blog/index.njk` | Feed: paginated over `collections.posts`, size 10; head (kicker `02 / блог`, Caveat title, sub), posts, pager. `bundle: blog`. |
| `src/blog/blog.11tydata.js` | For every post: `layout: world/post.njk`, `bundle: blog`; `eleventyComputed.permalink` → `/blog/<id>/`, `false` for `draft: true`. `index.njk` sets its own layout and permalink. |
| `src/blog/hello.md` | The first post, text from `pitch/blog/index.html`. |
| `src/_includes/world/post.njk` | Post page: dusk, HUD `БИБЛИОТЕКА / блог / <title>`, one post, `A · к ленте`. |
| `src/_includes/world/post-macro.njk` | Macro `post(item, full)`: `article.post` with meta (date linking to `/blog/<id>/`, kinds), optional heading, body. `full` false (feed): the body up to `<!-- more -->` + `Читать дальше →`; true (post page): the whole body. One markup for both pages. |
| `src/world/_src/blog.css` | From `pitch/blog/blog.css` minus what `shell.css` has (tokens, Ysabeau, `.hud`, `.dot`, `.kicker`), minus `pre` / `code` / `.fig` (prose has them). `.fog` renamed `.dusk`. |
| `src/world/_src/blog.js` | From `pitch/blog/blog.js`, `.dusk`, referrer check from `note.js`, A / Left / Escape. |

Changed:

| File | Change |
|---|---|
| `src/world/bundles.njk` | `blog.css` = shell, blog, prose; `blog.js` = blog. No `vt.css`, no `note-groups.css`. |
| `src/world/_src/shell.css` | Caveat `@font-face` (both subsets) moved here from `room.css`; `--hand` token. |
| `src/world/_src/room.css` | `.fog--dusk`: black, no `.fog__inner`, transition .45 s. |
| `src/world/_src/fog.js` | `data-dusk` branch: `fog--dusk` + `on`, 450 ms, `location.href`. `pageshow` removes `fog--dusk` too, or the next smoke card turns black. |
| `src/index.njk` | Card 02 (section 5); `postsCount` instead of `reviewsCount`; the panel kicker stays "Заметки и обзоры". |
| `lib/filters.js` | `blogPosts`, `longDate`, `rootLinks`, `beforeMore` (section 4). |
| `.eleventy.js` | `posts` collection; `reviews` collection removed. |
| `src/reviews/reviews.11tydata.js` | Comment: no card counts reviews now; they return as blog posts. |
| `test/markdown-links.test.js`, `test/filters.test.js`, new `test/blog-posts.test.js` | Section 8. |
| `docs/world.md`, `CLAUDE.md` | Section 9. |

## 4. Data and filters

`lib/filters.js` (Jest imports it; `.eleventy.js` registers everything it exports):

- `blogPosts(collection)`: items whose `filePathStem` is `/blog/<file>`, without
  `draft: true`, sorted by `date` desc, then `title`. Pagination must sit on a
  collection, so `.eleventy.js` adds
  `addCollection("posts", c => blogPosts(c.getAll()))`.
- `longDate(date, now = new Date())`: `24 ноября`; `24 ноября 2025` when the year isn't
  the build year. Genitive month names. Format in UTC: YAML dates are UTC midnight,
  and a local time zone west of UTC would show the day before.
- `rootLinks(html, prefix)`: `href="/` and `src="/` (not `//`) → `href="<prefix>/`.
  With an empty prefix (dev) it returns the html unchanged.
- `beforeMore(html)`: `{ html, cut }`: the html before the first `<!-- more -->` and
  `cut: true`, or the whole html and `cut: false` when there's no marker.

In templates the post body is `(item.templateContent | beforeMore).html | rootLinks(pathPrefix) | safe`
(feed, with `Читать дальше →` when `cut`) and `content | rootLinks(pathPrefix) | safe` (post page).

Feed permalink:

```njk
permalink: "/blog/{% if pagination.pageNumber > 0 %}page/{{ pagination.pageNumber + 1 }}/{% endif %}"
```

The pager: `← новее` to `pagination.href.previous`, `<b>n</b> / total`, `старее →` to
`pagination.href.next`, inactive ends as `span.pager__l.is-off`. All hrefs through
`{{ pathPrefix }}`. With zero posts, pagination builds no page and `/blog/` 404s: the
card in the room would dangle and `test:links` fails. Keep at least one published post.

Heading ids: two posts on one feed page with the same `## Итог` give duplicate ids.
Posts are short and rarely have headings, and long ones are cut in the feed; accept it
for now.

## 5. The room

```njk
<a class="card" href="{{ pathPrefix }}/blog/" data-title="Блог" data-dusk>
  <span class="card__k">02 / блог</span>
  <span class="card__t">Блог</span>
  <span class="card__d">Программы, обзоры, жизнь.</span>
  <span class="card__m"><b>{{ postsCount }}</b> {{ postsCount | plural('пост', 'поста', 'постов') }} <i>→</i></span>
</a>
```

`fog.js`, before the smoke branch:

```js
if (card.hasAttribute('data-dusk')) {
  e.preventDefault();
  fog.classList.add('fog--dusk', 'on');
  clearTimeout(fogTimer);
  fogTimer = setTimeout(function () { location.href = card.getAttribute('href'); }, 450);
  return;
}
```

Keyboard: `D` on a card calls `cards[card].click()` (`wall.js`), so the dusk branch runs
for keys too; nothing to change there.

## 6. Values that must stay in sync

Add to `docs/world.md`:

- The 450 ms of darkening: `.fog--dusk` transition (`room.css`) = the delay in the
  `data-dusk` branch (`fog.js`) = `.dusk.is-out` transition (`blog.css`) = the delay
  before leaving in `blog.js`.
- `.dusk` fade-in (.7 s, `blog.css`) is free to change alone.

## 7. Work order

Each step ends with `npm run build:check` green.

1. **Filters.** `blogPosts`, `longDate`, `rootLinks`, `beforeMore` in `lib/filters.js`
   with tests.
   Done when `npm test` passes and nothing else changed.
2. **Posts and pages.** `posts` collection, `src/blog/` (data file, `hello.md`, feed),
   `post.njk`, `post-macro.njk`. The pages can use the `note` bundle for now. Done when
   `/blog/` and `/blog/1/` build and show the post with its date, and a throwaway post
   with `<!-- more -->` shows its preview and `Читать дальше →` in the feed and in full
   on its page.
3. **Bundle.** `blog.css` / `blog.js` sources, `bundles.njk` entry, Caveat moved into
   `shell.css`, `bundle: blog` on both templates. Done when the feed looks like the
   pitch (`pitch/blog/index.html` side by side) at 1440, 1100 and 390 px wide, and the
   room's heading still renders in Caveat.
4. **Way in and back.** Card 02, `data-dusk` in `fog.js`, `.fog--dusk`. Done when
   room → blog goes black and fades in; A, Left, Escape and the breadcrumb go black and
   back to the room, which lightens; a smoke card (if any) still smokes after a round
   trip; a direct visit to `/blog/` still has a working breadcrumb.
5. **Reviews cleanup.** Remove the `reviews` collection and `reviewsCount`, update the
   `reviews.11tydata.js` comment. Done when `grep -rn reviewsCount src` is empty.
6. **Pager.** Temporarily add 11 throwaway posts (don't commit them). Done when
   `/blog/page/2/` builds, the pager links both ways, and page 1 has no pager once
   they're removed.
7. **Docs** (section 9).

## 8. Tests

- `test/filters.test.js`: `blogPosts` (drafts out, order by date then title, notes out),
  `longDate` (this year / other year / UTC midnight), `rootLinks` (prefixes `href="/`
  and `src="/`, leaves `//host`, `#x`, `https:` and relative ones alone), `beforeMore`
  (with and without the marker, only the first marker cuts).
- `test/markdown-links.test.js`: add `src/blog/` to `SKIP`, plus a test that
  `src/blog/*.md` has no relative links (`](../`, `](./`, `href="../`).
- `test/blog-posts.test.js` (gray-matter, like `note-drafts.test.js`): every post has
  `title` and a `date`; every published post has an `id` that is a positive integer;
  no two files in `src/blog/` share an `id` (drafts included); no file is named
  `index.md`; no
  post carries a note group's `tag` (`Python`, `Docker`): that would be a note in the
  wrong folder.
- `test/links.test.js` covers the feed, pager and post pages after a build. It skips
  image references only when `_site/images/world/` is missing (`HAS_IMAGES`), so once
  posts have images, `npm run dev` / `build:check` need `src/images/blog/` copied in too,
  or `HAS_IMAGES` checks both folders.

## 9. Docs

- `docs/world.md`: the intro (card 02 leads to the blog, `data-soon` has no card now);
  Files rows for every new file; the blog bundle in the bundle list (and why there's no
  `vt.css`); a "Room ↔ blog" section (decisions 9, 10); the sync values (section 6);
  "Adding things → Post" (one `.md` in `src/blog/`, the next free `id`, `<!-- more -->` for long posts, root links, `draft: true`).
- `CLAUDE.md`: the blog in Architecture and Key files; `date`, `untitled` and the blog's
  `draft` in Content frontmatter; the root-links rule for `src/blog/` next to the
  relative-links rule for notes; Reviews: "the room's Reviews card still counts them"
  → reviews come back as blog posts.
- Images for posts: `library_static/src/images/blog/`, listed in a new
  `images/blog/meta.md` when the first one is added.

## 10. Checks before merging to `main`

- `npm run build:check` green; `NODE_ENV=production npm run build`, then the feed and
  `/blog/1/` have `/library/` on every internal link and asset (including links
  inside the post body).
- Safari and Chrome: room → blog → back, and back after a reload of the blog page.
- Phone width: 16 px gutters, no horizontal scroll, the `· · ·` separator centred, key
  hint hidden.
- `prefers-reduced-motion`: no fade, still navigates.
- The Telegram preview of `/blog/1/` (OG tags from `meta.njk`).

## 11. Later, not part of this migration

- Reviews as posts: `аниме` / `книги` posts, score and status, maybe a kind filter on the
  feed.
- RSS / Atom feed for the blog.
- Kind filter chips above the feed (like the topics on group pages), once there are
  enough posts.
- Preloading Caveat on blog pages if the title flashes in the fallback font.
