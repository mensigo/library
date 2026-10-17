# Pitch v4, variant G

`index-g.html`: a still frame of the room (no video) and a wall to the right of it that
the camera pans to. From the room: Cinema card → film-frame transition to `cinema-g.html`;
`#notes` → pan to the wall → group page → note page. Reviews card has `data-soon` and
only shows "в работе" in the fog.

Serve from the repo root (`python3 -m http.server`): cross-document view transitions
need http (on `file://` pages just open), and the font lives in `src/fonts/`.

## Files

| File | Role |
|---|---|
| `index-g.html` | The room + wall page. |
| `main.css` | Base, shared with all variants: stage geometry (`--sw`, `--ratio: 1.7768`), panel, cards, glows, scrim, fog. |
| `wall.css` | Shared with D, E, F: camera pan, wall layer, group list, sigils, key hints. |
| `g.css` | G only, after `wall.css`: wall image and mask, `.world` isolation, sigil position, `sigil-breathe/pulse/blink`, `#fogSoon`. |
| `main.js` | Fog transition on cards. `data-soon` → "в работе" line (`#fogSoon`, G only), fog held 3.2 s instead of 2.3 s. |
| `wall.js` | Pan on `#notes`, W/A/S/D, group and sigil selection. |
| `g.js` | G only: pause before leaving the wall, return to the wall. |
| `cine.css`, `cine.js` | G only: room → film frame before Cinema, and back. |
| `vt.css` | All view transitions (wall↔group, group↔note, room↔Cinema). Loaded by every G page. |
| `smoke.js` | Smoke on `#smoke`; only the coal wisp (`data-exhale="off"`). |
| `notes-python.html`, `notes-docker.html` | Group pages (`data-g`). Load `main.css`, `notes.css`, `notes-g.css`, `vt.css`, `notes.js` (filter, search), `notes-g.js` (keys, back to wall). |
| `note-*.html` | Note pages. Load `main.css`, `notes.css`, `notes-g.css`, `note-g.css`, `vt.css`, `note-g.js`; real-markup notes also `prose.css`. |
| `prose.css` | Styles the real built note markup: code bar, highlighted lines, output, figures, callouts, table, verdict, footnotes, finale. |
| `cinema-g.html` | Copy of `src/cinema/index.html` with pitch paths, HUD → `index-g.html`, Bebop row `href="#"`. Loads `cinema-land.css/js`, `cinema-g.css` (VT names), `vt.css`, `cinema-g.js`. |
| `cinema-land.css/js` | Copies of built `/cinema/landing.*` (sources in `src/cinema/_src/`, font path → `../../src/fonts/`). **Regenerate, never hand-edit.** |
| `../../src/images/world/room.avif`, `.jpg` ← `img/room-g-source-1280.png` | Room frame, 2274x1280 (upscaled). Same files as the site. |
| `../../src/images/world/wall.avif`, `.jpg` ← `img/wall-g-source-1280.png` | Wall, 2987x1280 (upscaled). Same files as the site. |

Fonts: Ysabeau Infant from `../../src/fonts/` (via `main.css`), JetBrains Mono from Google Fonts.
`notes.html` and the other `index-*.html` are not part of G.

### Note pages

- `note-async.html` — hand markup, shortened copy of `src/notes/python/async.md`. Does not
  use `prose.css` yet.
- `note-slots.html` — built body of `_site/notes/python/slots/` pasted as is, plus
  "Чего в этой заметке нет" with fragments from Assert, Async, docker-1 (version badge,
  bytecode output, note callout, collapsible, flow, term). The test page for every prose element.
- `note-docker-history.html` — built body of `_site/drafts/docker-1/`, lede and key points
  from `src/drafts/docker-1.md` frontmatter.
- `note-docker-image.html`, `note-docker-layers.html` — short test notes from `src/drafts/docker_todo.md`.

All built-markup pages were assembled once by a throwaway script: after the source note
changes they must be pasted again.

### Docker vs Python

- Light swaps: Python — lantern leads, neon second; Docker — neon leads (`--acc` = sigil
  `#4fd6c9`). `prose.css` swaps `--amber`/`--neon` under `body[data-g="docker"]`: warnings
  stay lantern, tips/"yes" cells and code keywords neon, strings warm.
- Square fresh-note marker and key-point bullets (crates of the sigil, `notes-g.css`).
  "В пути" embers stay round.
- The whale mark is drawn with `mark__line`, not `mark__brush`, so breadcrumbs need
  `.hud .mark__line` (`note-g.css`).

## Values that must stay in sync

- `--cam-at` in `notes-g.css` (`.95`, `.8` under 1100 px) = where the camera stops
  (`--cam` in `g.css` / `wall.css`). Otherwise the wall backdrop jumps on navigation.
- `sigil-pulse` / `sigil-blink` durations = the 350 ms hold in `g.js`.
- Dim transitions in `notes-g.css` = the 300 ms hold in `notes-g.js`.
- `LEAVE` in `cine.js` = delay + duration of `cine-on`.
- `--bar` formula is repeated in `cine.css` (room) and `cinema-g.html` (Cinema return bars).
- `--done` per sigil = when its last stroke ends; a new sigil needs its own value.
- The `.mark` SVG paths on group/note pages are a copy of the sigil in `index-g.html`.
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
In `vt.css` both `cinema-frame` snapshots keep their own size, centred, clipped by the
image pair. Bars have no pair on Cinema, so their old snapshots slide off the edge with
the frame's timing (.9 s, same curve). Cinema `.hud` (`cinema-hud`) fades in last
(.35 s from .55 s). Cinema scrim and text fade in over the frame.

**Skipped-transition fallback.** Chrome sometimes skips the VT (first navigation in a
fresh browser). The click sets `sessionStorage.cineIn`; on `pagereveal` with no/skipped
transition, `cinema-g.js` adds `.is-arriving` for two frames so Cinema's own bars are in
place on frame one and slide out (.5 s). Cinema holds first paint with
`<link rel="expect" blocking="render">`, like the room.

**Returning** — HUD link or A / Left / Escape (hint `A в комнату`, hidden on touch):
- `.is-leaving` on Cinema for 1200 ms: bars (`.cine`, fixed, above HUD) slide in, hero
  text and scroll cue fade (.6 s ease-in-out), then the picture goes black (.7 s).
  `.hero` loses its VT name, nothing travels.
- Then `history.back()` if opened from the room, else `sessionStorage.cine` + link.
- Room opens in the same picture (`.is-cine-dark`: bars, `.cine__black`, lights off, no
  frame, no transitions) — in `pagereveal` on cache restore (before first paint), in
  `cine.js` at load on a direct visit. The VT between the two identical black screens is
  skipped.
- Two frames later `.is-cine-lift` fades the black (.45 s); 150 ms in (`LIFT`)
  `.is-cine-back` unwinds: bars out (.5 s), room brightens (.45 s), lanterns back almost
  together (.35 s, .03 s apart), panel/HUD/bottom line last (.3 s delay).
  `.is-cine-lift` stays on until the end.
- Firefox (no `pagereveal`): all of it runs on `pageshow`, after first paint.

## Wall ↔ group page

- `notes-g.css` places the wall (`wall.avif`, JPEG fallback) exactly where the
  camera stops (`--cam-at`).
- Active sigil: halo breathes (`sigil-breathe`) once drawn.
- **Leaving**: `g.js` holds 350 ms (`.is-going`): other groups dim, halo pulses
  (`sigil-pulse`: gone by 30%, flares to 17px at 95% by 65%, shrinks into the line), the
  eye blinks (`sigil-blink`: `.sigil__dot` squeezes to a slit, closed at 65%). The sigil
  travels without halo, colour and thickness unchanged; on the page the mark's glow
  fades in after the move (`glow-in`).
- **Returning**: `history.back()` from the wall; on a direct visit a link to
  `index-g.html#notes`, and `sessionStorage.wall` tells `g.js` to show the sigil at once.
  `<link rel="expect" href="#ready">` holds the first frame until the camera is at the wall.

## Group page ↔ note

- Keys (`notes-g.js`): W/S, Up/Down move through visible rows, D opens. Selected = focused
  + `.is-on`. `body.by-keys` disables row hover; first real mouse move hands selection back.
- `sigil` and `group-title` continue onto the note (small mark and `python` in breadcrumbs).
- **Leaving**: 300 ms hold (`body.is-going`): everything dims except what travels (row
  title, group title, sigil); the selection line and the rule above the open row fade too.
- Note: `.progress` at the top, `note-g.js` drives `--p`, never below `.012`. `.sky` is one
  screen tall and absolute: the wall where the camera stopped, darkened to .86, scrolls
  away with the header. W/S between sections, A / Left / Escape back.
- **Returning**: `history.back()` keeps the row selected; on a direct visit a link to the
  group page, `sessionStorage.note` tells `notes-g.js` which row to open/select.
  `.is-open` is dropped 1 s after return.
- `note-g.js` treats the page as opened from its list when the referrer ends with the
  href of its "к списку" link, so notes in new groups need no script change.

## Adding things

- **Group**: `.group` + `.sigil` (with its own `--done`) in `index-g.html`, colour in
  `wall.css` and `notes-g.css` (`body[data-g]`), own page with `data-g` and the mark
  (copy of the sigil SVG).
- **Note**: own page + the row's `href` (rows with `href="#"` do nothing).

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
`src/images/world/`; deploy syncs them into `src/images/world/` here, and the pitch loads them
from there (`../../src/images/world/…`), the way it loads the Cinema hero. For a local run,
copy them in by hand. Sizes and the list of files: `images/world/meta.md`.

| File | Size | From (`pitch/v4/img/`) |
|---|---|---|
| `room.avif` / `.jpg` | 2274x1280, 189 / 498 KB | `room-g-source-1280.png` |
| `wall.avif` / `.jpg` | 2987x1280, 244 / 614 KB | `wall-g-source-1280.png` |

- Room: `<picture>` with an AVIF `<source>`. Wall (`g.css`, `notes-g.css`): plain
  `url(wall.jpg)`, then `image-set(… type("image/avif"), … type("image/jpeg"))`; a browser
  without `type()` drops the second line. Group and note pages preload `wall.avif` with
  `type="image/avif"`.
- A browser takes AVIF for both images or JPEG for both, so the seam always joins one
  format. Export both with the same settings.
- Target height 1280: the frame is 1:1 on a 1920x1280 window (stage height is
  `max(100vw / 1.7768, 100svh)`). Smaller windows scale it down; no `srcset`.
- 4:4:4 because the frame is mostly near-black with saturated reds and neon. WebP (always
  4:2:0) makes the dark plaster blotchy and drops its grain; AVIF 4:2:0 smears it.

Both sources are upscales of the generated images (room `img/shisha-start-10d-good.png`
1672x941, wall `img/wall-g-source.png` 2688x1152): Real-ESRGAN `x4plus` 4×, scaled down to
height 1280, then 30% of it over 70% of a plain Lanczos stretch. Real-ESRGAN alone sharpens
edges but wipes the plaster grain and the rain on the window and makes the face waxy
(`img/room-g-esrgan-only.png`); the blend keeps them. Real-ESRGAN lives in
`~/.local/opt/realesrgan-ncnn-vulkan/` (v0.2.5.0 macOS build).

```bash
E=~/.local/opt/realesrgan-ncnn-vulkan
up() {  # up <in> <WxH> <out>
  $E/realesrgan-ncnn-vulkan -i $1 -o x4.png -n realesrgan-x4plus -m $E/models -s 4
  magick x4.png -filter Lanczos -resize $2! esr.png
  magick $1 -filter Lanczos -resize $2! lz.png
  # blend: the first number is the share of the second image (esr.png)
  magick lz.png esr.png -compose blend -define compose:args=30,70 -composite $3
}
up img/shisha-start-10d-good.png 2274x1280 img/room-g-source-1280.png
up img/wall-g-source.png 2987x1280 wall-up.png

# wall's left end = the room's right 500 px, 1:1 (wall col c = room col 1773.68 + c,
# 1773.68 = 2274 - .1675 * 2987), fading into the wall over cols 334-500
magick img/room-g-source-1280.png -virtual-pixel edge -define distort:viewport=501x1280+0+0 \
  -filter Lanczos -distort SRT '0,0 1 0 -1773.68,0' -background black -extent 2987x1280 frame.png
magick \( -size 334x1280 xc:white \) \( -size 1280x167 gradient:white-black -rotate -90 \) \
  \( -size 2486x1280 xc:black \) +append -colorspace gray mask.png
magick wall-up.png frame.png mask.png -composite img/wall-g-source-1280.png

# export, then copy the four files to library_static/src/images/world/ and ../../src/images/world/
for n in room wall; do
  magick img/$n-g-source-1280.png -strip -define heic:chroma=444 -quality 70 $n.avif
  magick img/$n-g-source-1280.png -strip -sampling-factor 4:4:4 -quality 85 $n.jpg
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
- Wall mask (`g.css`): top 85% cut hard at the post (16.7%); bottom 15.2% (floor) fades
  in 4%→10%, where the wall holds the frame's own pixels.
- Floor line: post and bookshelf end at ~1103/1280 (86.2%) = sofa base at the frame's
  right edge.
- `.glow` coordinates in `index-g.html` are frame fractions; move with candles/lanterns.
- `data-coal="465,187"` on `#smoke` = hookah bowl on the smoke canvas (836x470, half the
  original frame, stretched over the stage; does not depend on the image size).

## Open issues

- `img/` (sources) is not in git, and `src/images/` comes from the images repo: a fresh
  checkout has no room or wall until they are copied in.
- Checked by hand in Chrome on the MacBook's built-in screen (1470x956 CSS px, the
  viewport a bit shorter after the browser's toolbars), transitions included: good enough.
  Not opened in Safari/Firefox.
- TODO: smaller and bigger screens. Known catch for short screens (under 560 px tall):
  room bars use the 560 px hero, Cinema bars use the viewport, so they won't match on return.
- TODO, a separate feature for later: the mobile view.
- TODO: the copy button on code blocks (`.copy`, handler in `note-g.js`). Term tooltip and
  the collapsible block were checked by hand and work.
- Shelf top on the wall is at ~62% height; sigil and group list still placed for 61%.
- Carpet diagonals straighten near the post (angled vs straight-on view).
- Not done: smoke and projector beam in the Cinema transition.
- Prompts for the current window view and wall are not written down.
