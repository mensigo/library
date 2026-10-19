# World: the room, the wall, notes, the way into Cinema

The site's main design (pitch v4 variant G, moved into `src/` by `pitch/v4/MIGRATION.md`).
`/` is a still frame of the room (no video) and a wall to the right of it that the camera
pans to. From the room: Cinema card → film-frame transition to `/cinema/`; `#notes` → pan
to the wall → group page → note page. The Reviews card has `data-soon` and only shows
"в работе" in the fog.

Reviews (hidden for now) still use the old shell: `base.njk`, `css/styles.css`,
`js/scripts.js`, described in `DESIGN.md`. Nothing here applies to them.

Cross-document view transitions need http: use `npm run dev`, or for back/forward loops a
static server on the build (`python3 -m http.server -d _site`). After a bfcache restore the
dev server's live-reload client sometimes reloads the page, and the room then shows up
without its return from Cinema.

## Files

| File | Role |
|---|---|
| `src/index.njk` | `/`: the room + wall page, markup inline. `#notes` is the wall. |
| `src/notes/group.njk` | `/notes/<id>/`: group page, one per entry of `noteGroups` (pagination, alias `noteGroup`). |
| `src/notes/index.njk` | `/notes/`: redirect to `/#notes` (`location.replace` + meta refresh, `noindex`). |
| `src/notes/<id>/*.md` | Notes. Layout and `groupId` come from `src/notes/notes.11tydata.js`. |
| `src/notes/groups.js` | Note groups: `id`, `title`, `desc`, `tag`, `embers`, `find`, `enabled`. Global data `noteGroups` (`.eleventy.js`). |
| `src/_includes/world/shell.njk` | `<head>` and body slot for every page above: fonts, `meta.njk`, `/world/<bundle>.css` + `.js`, `data-g`, `wall.avif` preload, `rel=expect`. |
| `src/_includes/world/note.njk` | Note layout: sky, progress, HUD with the mark, header, lede/tldr, both TOCs, back link. |
| `src/_includes/world/note-sigils.njk` | Macro `sigil(id, mode)`: the group signs, `"wall"` (drawn stroke by stroke) or `"mark"` (already drawn). |
| `src/_includes/meta.njk` | OG/Telegram `<meta>`, shared with the old shell. |
| `src/world/bundles.njk` | Joins `world/_src/` into `/world/{home,note-group,note}.{css,js}` (filter `bundle`). |
| `src/world/_src/shell.css` | What every page needs: tokens, `@font-face`, `.hud`, `.kicker`, `.frameline`. |
| `src/world/_src/room.css` | Stage geometry (`--sw`, `--ratio: 1.7768`), panel, cards, glows, scrim, fog; camera pan, wall layer and mask, group list, sigils, key hints, `#fogSoon`. |
| `src/world/_src/cine.css`, `cine.js` | Room → film frame before Cinema, and back. |
| `src/world/_src/vt.css` | All view transitions (wall↔group, group↔note, room↔Cinema). In every bundle and the Cinema landing. |
| `src/world/_src/note-groups.css` | Group colours (`--g-python`, `--g-docker`), Docker's `--done`, square markers and light swap. After the parts it recolours. |
| `src/world/_src/notes.css` | Group page and the parts of the note page shared with it: backdrop, head, mark, rows, topics, embers, back link. |
| `src/world/_src/note.css` | Note page: sky, progress, HUD mark, header, TOCs. |
| `src/world/_src/prose.css` | Styles the built note markup: code bar, highlighted lines, output, figures, callouts, tables, verdict, footnotes, finale, terms. |
| `src/world/_src/fog.js` | Fog transition on cards. `data-soon` → "в работе" line (`#fogSoon`), fog held 3.2 s instead of 2.3 s. |
| `src/world/_src/wall.js` | Pan on `#notes`, W/A/S/D, group and sigil selection, pause before leaving the wall, return to the wall. |
| `src/world/_src/smoke.js` | Smoke on `#smoke`; only the coal wisp (`data-exhale="off"`). |
| `src/world/_src/note-group.js` | Group page: filter, search, keys, back to the wall. |
| `src/world/_src/note.js` | Note page: progress, W/S between sections, A back, copy button. |
| `src/cinema/index.html` | Cinema landing: `data-back` HUD link, `A в комнату` hint, `.cine` return block, `rel=expect`. |
| `src/cinema/_src/return.css`, `return.js` | Cinema half of the room ↔ Cinema transition. In the landing bundles with `world/_src/vt.css`. |

Bundles (`src/world/bundles.njk`), in this order:

- `home.css` = shell, room, cine, note-groups, vt; `home.js` = fog, wall, cine, smoke.
- `note-group.css` = shell, notes, note-groups, vt; `note-group.js` = note-group.
- `note.css` = shell, notes, note, prose, note-groups, vt; `note.js` = note.

Nothing under `world/_src/` is published. Every bundle sits in `/world/`, so every `url()` in
a source is relative to `/world/` (`../fonts/`, `../images/`) and works with or without
the `/library` prefix. All links in templates go through `{{ pathPrefix }}`.

Fonts: Ysabeau Infant from `src/fonts/` (`shell.css`), JetBrains Mono from Google Fonts
(`shell.njk`).

`sessionStorage` keys: `fog`, `wall`, `note`, `cine`, `cineIn`. The old shell's
`localStorage` keys (`theme`, `rail`, `accent`) don't overlap with them.

### Lists and numbers

- Rows (`groupNotes`, `lib/filters.js`): published notes of the group, newest `upd_date`
  first, then `title`. `01..NN` is the position in that order, so a note's number changes
  when another note is updated. The note's kicker `01 / python` uses the same number; a
  draft's kicker is just the group.
- "Fresh" marker: `upd_date` within 45 days of the build date (`isFresh`).
- Topics (`topics`): `все` first, then tags by count, ties by name; the group's own tag
  is left out, of the topics and of the row tags.
- Embers (`groupDrafts`): `draft: true` notes in the group's folder, under the group's
  `embers` heading. Not links. A draft still builds at its URL.
- TOC (`toc`): `h2` with an id, without `.u-kicker`, read from the built content.
- Every list is sorted, and `title` (`localeCompare`, `'ru'`) is the last key, so two
  builds in a row are identical.

### Docker vs Python

- Light swaps: Python — lantern leads, neon second; Docker — neon leads (`--acc` = sigil
  `#4fd6c9`). `note-groups.css` swaps `--amber`/`--neon` under `body[data-g="docker"]`:
  warnings stay lantern, tips/"yes" cells and code keywords neon, strings warm.
- Square fresh-note marker and key-point bullets (crates of the sigil, `note-groups.css`).
  "В пути" embers stay round.
- The whale mark is drawn with `mark__line`, not `mark__brush`, so breadcrumbs need
  `.hud .mark__line` (`note.css`).

## Values that must stay in sync

- `--cam-at` in `notes.css` (`.95`, `.8` under 1100 px) = where the camera stops
  (`--cam` in `room.css`). Otherwise the wall backdrop jumps on navigation.
- `sigil-pulse` / `sigil-blink` durations = the 350 ms hold in `wall.js`.
- Dim transitions in `notes.css` = the 300 ms hold in `note-group.js`.
- `LEAVE` in `cine.js` = delay + duration of `cine-on`.
- `--bar` formula is repeated in `cine.css` (room) and `return.css` (Cinema return bars).
- `--done` per sigil = when its last stroke ends; a new sigil needs its own value.
- The `.mark` on group/note pages and the `.sigil` on the wall are drawn from the same
  paths in `note-sigils.njk`; only `--done` lives apart, in `room.css` / `note-groups.css`.
- View-transition names, in pairs: `sigil` (`.sigil.on` ↔ `.mark`), `group-title`
  (`.group.is-on .group__t` ↔ page `h1`), `note-title` (`.row.is-open .row__t` ↔ note `h1`),
  `cinema-frame` (`.is-cine .cine__frame` ↔ `.hero`), `cine-bar-top/bot`, `cinema-hud`.

## Room ↔ Cinema

**Leaving** (`cine.js`, `cine.css`), click held 1600 ms with `.is-cine`:
- panel, key hints, HUD, bottom line fade (.4 s ease-in-out);
- black 2.39:1 bars slide in (`--bar` = space above/below a 2.39:1 frame, clamped 8-22%
  of height; bars `z-index: 1`);
- eight lanterns go out left to right through `filter` (`flicker` owns `opacity`);
  room dims to `brightness(.36)`;
- 0.6-0.9 s the band between bars goes black (`.cine__frame` black background), so the
  room never shows through; at 0.9 s the picture comes up like a projector lamp
  (`cine-on`, .7 s, one soft dip, no overexposure).

`.cine__frame` covers the whole hero under the bars with `hero.jpg` cover at `scale: 1.04`
(start of the landing's `drift`), pixel-identical to the Cinema hero; only the band is seen.
Both use `images/cinema/index/hero.jpg`, and they must stay the same file.
In `vt.css` both `cinema-frame` snapshots keep their own size, centred, clipped by the
image pair. Bars have no pair on Cinema, so their old snapshots slide off the edge with
the frame's timing (.9 s, same curve). Cinema `.hud` (`cinema-hud`) fades in last
(.35 s from .55 s). Cinema scrim and text fade in over the frame.

**Skipped-transition fallback.** Chrome sometimes skips the VT (first navigation in a
fresh browser). The click sets `sessionStorage.cineIn`; on `pagereveal` with no/skipped
transition, `return.js` adds `.is-arriving` for two frames so Cinema's own bars are in
place on frame one and slide out (.5 s). Cinema holds first paint with
`<link rel="expect" blocking="render">`, like the room.

**Returning** — HUD link (`data-back`) or A / Left / Escape (hint `A в комнату`, hidden
under `(hover: none), (max-width: 1100px)`):
- `.is-leaving` on Cinema for 1200 ms (`LEAVE` in `return.js`): bars (`.cine`, fixed,
  above HUD) slide in, hero text and scroll cue fade (.6 s ease-in-out), then the picture
  goes black (.7 s). `.hero` loses its VT name, nothing travels.
- Then `history.back()` if opened from the room (referrer and `[data-back]` compared by
  origin and pathname), else `sessionStorage.cine` + link.
- Room opens in the same picture (`.is-cine-dark`: bars, `.cine__black`, lights off, no
  frame, no transitions) — in `pagereveal` on cache restore (before first paint), in
  `cine.js` at load on a direct visit. The VT between the two identical black screens is
  skipped.
- Two frames later `.is-cine-lift` fades the black (.45 s); 150 ms in (`LIFT`)
  `.is-cine-back` unwinds: bars out (.5 s), room brightens (.45 s), lanterns back almost
  together (.35 s, .03 s apart), panel/HUD/bottom line last (.3 s delay).
  `.is-cine-lift` stays on until the end.
- Firefox (no `pagereveal`): all of it runs on `pageshow`, after first paint.

Bebop (`/cinema/bebop/`) has no transition: its `БИБЛИОТЕКА` opens the room the normal way.

## Wall ↔ group page

- `notes.css` places the wall (`wall.avif`, JPEG fallback) exactly where the
  camera stops (`--cam-at`).
- Active sigil: halo breathes (`sigil-breathe`) once drawn. While the camera is still on
  its way to the wall, hovering only picks the group; the sign starts drawing when the
  camera arrives.
- **Leaving**: `wall.js` holds 350 ms (`.is-going`): other groups dim, halo pulses
  (`sigil-pulse`: gone by 30%, flares to 17px at 95% by 65%, shrinks into the line), the
  eye blinks (`sigil-blink`: `.sigil__dot` squeezes to a slit, closed at 65%). The sigil
  travels without halo, colour and thickness unchanged; on the page the mark's glow
  fades in after the move (`glow-in`).
- **Returning**: `history.back()` from the wall; on a direct visit a link to `/#notes`,
  and `sessionStorage.wall` tells `wall.js` to show the sigil at once. A `pageshow` with
  `persisted` clears that mark, so a later fresh load doesn't find the sign drawn.
  `<link rel="expect" href="#ready">` holds the first frame until the camera is at the wall.

## Group page ↔ note

- Keys (`note-group.js`): W/S, Up/Down move through visible rows, D opens. Selected =
  focused + `.is-on`. `body.by-keys` disables row hover; first real mouse move hands
  selection back.
- `sigil` and `group-title` continue onto the note (small mark and `python` in breadcrumbs).
- **Leaving**: 300 ms hold (`body.is-going`): everything dims except what travels (row
  title, group title, sigil); the selection line and the rule above the open row fade too.
- Note: `.progress` at the top, `note.js` drives `--p`, never below `.012`. `.sky` is one
  screen tall and absolute: the wall where the camera stopped, darkened to .86, scrolls
  away with the header. W/S between sections, A / Left / Escape back.
- **Returning**: `history.back()` keeps the row selected; on a direct visit a link to the
  group page, `sessionStorage.note` (the note's `location.pathname`) tells
  `note-group.js` which row to open/select, matched by `row.pathname`. `.is-open` is
  dropped 1 s after return.
- `note.js` and `note-group.js` treat the page as opened from the page before when the
  referrer's origin and pathname equal those of its `[data-back]` link, so new groups and
  the `/library` prefix need no script change.

## Phones

The full mobile view is a later feature. What is in place, under 1100 px:

- Figures: an SVG in `.fig__frame` keeps `min-width: 720px` and scrolls inside the frame
  (`prose.css`). Images still fit the frame.
- TOC: `note.njk` renders the list twice through the `tocList` macro: the side `.toc` and
  a collapsed `<details class="toc toc--m">` at the top of `.layout`, with the section
  count. A tap on a section closes it before the jump. `note.js` highlights the current
  section by heading id, since there are two lists.
- Key hints (`.keys`, `.tockeys`, `.find kbd`, `.back kbd`, Cinema's `.hud .hud__keys`) are
  hidden under `(hover: none), (max-width: 1100px)`.
- Terms: the `.term` caption is a `position: fixed` strip at the bottom of the screen
  (`prose.css`); hung off the term, it widened the page.
- Bare `<pre>` scrolls inside (`.prose pre { overflow-x: auto }`), long inline `code`
  wraps (`overflow-wrap: break-word`).

## Adding things

- **Note**: one `.md` file in `src/notes/<id>/`, no `layout:` line, the group's `tag`
  among its `tags`. A draft: same folder, `draft: true` (`test/note-drafts.test.js`
  checks the tag both ways).
- **Group**: an entry in `src/notes/groups.js`, its strokes in `note-sigils.njk`, its
  colour and `--done` in `note-groups.css`, and the folder `src/notes/<id>/`. The folder
  name is its id. `enabled: false` shows it dimmed on the wall (`.group--draft`).

## Don't repeat

- Bars left in the root snapshot just fade with it — they need their own
  names. A HUD left in the new root gets covered by the incoming frame and appears twice.
- `object-fit: cover` on both `cinema-frame` snapshots: old one scales, new one does not,
  the frame doubles.
- A frame only between the bars: what the bars uncover comes from the half-faded new
  page, so the top bar seems to fade instead of slide.
- Hard projector flicker with `brightness(1.8)`: flashes out of the dark room.
- Shrinking the Cinema hero back into the band via VT on return, then fading over the
  dark room — rejected.
- Waiting for the black to clear before unwinding the room: half-dark room in bars
  stands still for half a second.
- Removing `.is-cine-lift` early: black snaps off mid-fade.
- Not skipping the black→black VT on return: holds black for an extra .55 s.
- Page `--ease` at .3 s on Cinema hero text: cuts it off abruptly; use .6 s ease-in-out.
- Sigil pulse via scaling, brightening the line (amber turns yellow-green), or a tight
  saturated glow (too strong).
- Row's ember line travelling up to become the progress line: too much at once.
- Without `.world { isolation: isolate; }` the wall's carpet strip at the frame's right
  edge looks lit in the room and goes dark when the pan starts.
- Lantern fade through `opacity`: conflicts with `flicker`; use `filter`.

## Images and geometry

Pages load AVIF (4:4:4, q70) and fall back to JPEG (4:4:4, q85) in browsers without AVIF
(Safari on macOS 12 and older). The files live in the images repo `library_static` under
`src/images/world/`; deploy syncs them into `src/images/world/` here. For `npm run dev`,
copy them in by hand. Sizes and the list of files: `images/world/meta.md`.

| File | Size | From (`library_static/src/images/world/`) |
|---|---|---|
| `room.avif` / `.jpg` | 2274x1280, 189 / 498 KB | `room.png` (1672x941) |
| `wall.avif` / `.jpg` | 2987x1280, 244 / 614 KB | `wall.png` (2688x1152) |

`room.png` and `wall.png` are the generated originals. No page loads them, and deploy's
rsync skips them (`--exclude '/world/*.png'` in `deploy.yml`); don't copy them into
`src/images/` here.

- Room: `<picture>` with an AVIF `<source>`. Wall (`room.css`, `notes.css`): plain
  `url(wall.jpg)`, then `image-set(… type("image/avif"), … type("image/jpeg"))`; a browser
  without `type()` drops the second line. Group and note pages preload `wall.avif` with
  `type="image/avif"`.
- A browser takes AVIF for both images or JPEG for both, so the seam always joins one
  format. Export both with the same settings.
- Target height 1280: the frame is 1:1 on a 1920x1280 window (stage height is
  `max(100vw / 1.7768, 100svh)`). Smaller windows scale it down; no `srcset`.
- 4:4:4 because the frame is mostly near-black with saturated reds and neon. WebP (always
  4:2:0) makes the dark plaster blotchy and drops its grain; AVIF 4:2:0 smears it.

Both are upscales of the originals: Real-ESRGAN `x4plus` 4×, scaled down to height 1280,
then 30% of it over 70% of a plain Lanczos stretch. Real-ESRGAN alone sharpens edges but
wipes the plaster grain and the rain on the window and makes the face waxy; the blend
keeps them. Real-ESRGAN lives in `~/.local/opt/realesrgan-ncnn-vulkan/` (v0.2.5.0 macOS
build). Run in a scratch folder with `room.png` and `wall.png` copied in:

```bash
E=~/.local/opt/realesrgan-ncnn-vulkan
up() {  # up <in> <WxH> <out>
  $E/realesrgan-ncnn-vulkan -i $1 -o x4.png -n realesrgan-x4plus -m $E/models -s 4
  magick x4.png -filter Lanczos -resize $2! esr.png
  magick $1 -filter Lanczos -resize $2! lz.png
  # blend: the first number is the share of the second image (esr.png)
  magick lz.png esr.png -compose blend -define compose:args=30,70 -composite $3
}
up room.png 2274x1280 room-1280.png
up wall.png 2987x1280 wall-up.png

# wall's left end = the room's right 500 px, 1:1 (wall col c = room col 1773.68 + c,
# 1773.68 = 2274 - .1675 * 2987), fading into the wall over cols 334-500
magick room-1280.png -virtual-pixel edge -define distort:viewport=501x1280+0+0 \
  -filter Lanczos -distort SRT '0,0 1 0 -1773.68,0' -background black -extent 2987x1280 frame.png
magick \( -size 334x1280 xc:white \) \( -size 1280x167 gradient:white-black -rotate -90 \) \
  \( -size 2486x1280 xc:black \) +append -colorspace gray mask.png
magick wall-up.png frame.png mask.png -composite wall-1280.png

# export, then copy the four files to library_static/src/images/world/ and src/images/world/
for n in room wall; do
  magick $n-1280.png -strip -define heic:chroma=444 -quality 70 $n.avif
  magick $n-1280.png -strip -sampling-factor 4:4:4 -quality 85 $n.jpg
done
```

CSS places both images by fractions (`aspect-ratio: 1672 / 941` holds for 2274x1280), so
pixel sizes can change without CSS changes. The px numbers below are for the current files.

- **Wall is tied to the frame.** The left 500 px of the wall are the right 500 px of the
  frame, pixel for pixel (pasted in after the upscale, above); over the last 167 px before
  the post they fade into the wall's own carpet. Changing the frame's lower right corner
  (right sofa, carpet) means rebuilding the wall's left end. Window, man, hookah changes
  don't affect it.
- Wall height = frame height, starts `--lap` (16.75% of its width) before the frame's
  right edge, so the post's left edge (16.7%) sits on it. Same scale as the frame.
- Wall mask (`room.css`): top 85% cut hard at the post (16.7%); bottom 15.2% (floor) fades
  in 4%→10%, where the wall holds the frame's own pixels.
- Floor line: post and bookshelf end at ~1103/1280 (86.2%) = sofa base at the frame's
  right edge.
- `.glow` coordinates in `src/index.njk` are frame fractions; move with candles/lanterns.
- `data-coal="465,187"` on `#smoke` = hookah bowl on the smoke canvas (836x470, half the
  original frame, stretched over the stage; does not depend on the image size).

## Open issues

- Checked by hand in Chrome on the MacBook's built-in screen (1470x956 CSS px), transitions
  included. Not opened in Safari or Firefox, not on a real iPhone, not with the
  `/library` prefix served; that list is `pitch/v4/MIGRATION.md` section 11.
- Short screens (under 560 px tall): room bars use the 560 px hero, Cinema bars use the
  viewport, so they won't match on return.
- Phones: figures have no scroll cue and no full screen on tap. The full mobile view is
  a separate feature.
- JetBrains Mono comes from Google Fonts; self-hosting it is a TODO
  (`pitch/v4/MIGRATION.md` section 13, with a nicer way to read drafts).
- Shelf top on the wall is at ~62% height; sigil and group list still placed for 61%.
- Carpet diagonals straighten near the post (angled vs straight-on view).
- Not done: smoke and projector beam in the Cinema transition.
- Prompts for the current window view and wall are not written down.
