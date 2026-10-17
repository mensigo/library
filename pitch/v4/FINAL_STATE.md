# Pitch v4, variant G: current state

The current variant is `index-g.html`: a still frame of the room (no video) and a wall
to the right of it that the camera pans to. This file lists the files the variant uses
and what ties them together.

## Files in use

| File | Role |
|---|---|
| `index-g.html` | The page. |
| `main.css` | Base: stage geometry (`--sw`, `--ratio: 1.7768`), panel, cards, glows, scrim, fog. Shared with all variants. |
| `wall.css` | Camera pan, wall layer, group list, sigils, key hints. Shared with D, E, F. |
| `g.css` | Variant G only, loaded after `wall.css`: wall image, wall mask, `.world` isolation, sigil position. |
| `main.js` | Fog transition on the cards. A card with `data-soon` (Reviews in G) says "в работе" in the fog, shows that text under the title and holds the fog 3.2 s instead of 2.3 s; the line (`#fogSoon`, styled in `g.css`) exists only in `index-g.html`. |
| `wall.js` | Pan to the wall on `#notes`, W/A/S/D keys, group and sigil selection. |
| `g.js` | Variant G only: the pause before leaving the wall for a group page, and the return to the wall. |
| `vt.css` | Cross-document view transitions: wall and group page, group page and note, room and Cinema. Loaded by every page of G. |
| `cine.css`, `cine.js` | Variant G only: the room turns into a film frame before Cinema opens, and back. |
| `smoke.js` | Smoke on the `#smoke` canvas. Only the wisp from the coals runs (`data-exhale="off"`). |
| `img/room-g.jpg` | The room frame, 1672x941. |
| `img/wall-g.jpg` | The wall, 2688x1152. |
| `img/shisha-start-10d-good.png` | Source of `room-g.jpg`. |
| `img/wall-g-source.png` | Source of `wall-g.jpg`. |
| `../../src/fonts/YsabeauInfant-VariableFont_wght.woff2` | Text font, referenced from `main.css`. |
| Google Fonts, JetBrains Mono | Mono font, loaded from the network. |

`notes-python.html` is the target of the Python group link. It loads `main.css`,
`notes.css`, `notes-g.css` (wall backdrop, group colour, sigil mark, row entrance), `vt.css`,
`notes.js` (filter and search) and `notes-g.js` (back to the wall on A, Left, Escape).
`notes.html` is the older all-notes page and is no longer linked from G.

`note-async.html` is the target of the Async row, the only row with a page so far. It
loads `main.css`, `notes.css`, `notes-g.css`, `note-g.css` (faint wall behind the header,
reading text, progress line, contents), `vt.css` and `note-g.js` (progress, contents
highlight, W/S between sections, back to the list on A, Left, Escape). Its text is a
shortened hand copy of `src/notes/python/async.md`.

`note-slots.html` is the target of the `__slots__` row and the page for checking every
note element. Its body is the built markup from `_site/notes/python/slots/` pasted as is,
plus a section "Чего в этой заметке нет" with fragments from the built Assert, Async and
docker-1 pages (version badge, bytecode output, note callout, collapsible block, flow,
term). It also loads `prose.css`, which styles that real markup: code bar, highlighted
lines, output, figures and diagram colours, callouts, table, verdict, footnotes, finale.
The page was assembled once by a throwaway script; after a change in the source note it
has to be pasted again.

`notes-docker.html` is the Docker group page, same markup as the Python one with
`data-g="docker"`. Its three rows open `note-docker-history.html` (the built body of
`_site/drafts/docker-1/` as is, lede and key points from the frontmatter of
`src/drafts/docker-1.md`), `note-docker-image.html` and `note-docker-layers.html` (two short
test notes written for the pitch, material from `src/drafts/docker_todo.md`). The three
note pages were generated once by a throwaway script, like `note-slots.html`.

What differs on Docker pages:

- **The light swaps.** On Python the lantern leads and the window neon is second; on
  Docker the neon leads (`--acc` is the sigil's `#4fd6c9`) and the lantern is second.
  `prose.css` swaps `--amber` and `--neon` under `body[data-g="docker"]`: warnings stay
  lantern, tips and "yes" cells are neon, code keywords neon, strings warm.
- **Square markers.** The fresh-note marker and the key-point bullets are small squares,
  like the crates in the sigil (`notes-g.css`). The "В пути" (drafts) embers stay round.
- The small mark in the note's breadcrumbs needs `.hud .mark__line` (`note-g.css`): the
  whale is drawn with `mark__line`, not `mark__brush`.

`cinema-g.html` is the target of the Cinema card: a copy of `src/cinema/index.html` with
pitch paths, `href="index-g.html"` in the HUD and the Bebop row on `href="#"`. It loads
`cinema-land.css` and `cinema-land.js`, copies of the built `/cinema/landing.*` bundles
(sources from `src/cinema/_src/`, font path changed to `../../src/fonts/`; regenerate
after a change there, do not edit by hand), plus `cinema-g.css` (the view-transition name),
`vt.css` and `cinema-g.js` (back to the room).

## Room to Cinema

- **Leaving** (`cine.js`, `cine.css`). The click holds the page for 1600 ms
  (`.is-cine`): panel, key hints, HUD and the bottom line fade (.4 s ease-in-out), black 2.39:1 bars slide
  in (`--bar`: what is left above and below a 2.39:1 frame, clamped to 8-22% of the
  height), the eight lanterns go out one by one left to right (through `filter`, since
  `flicker` owns `opacity`), the room dims to `brightness(.36)`. At 0.6-0.9 s the space
  between the bars goes black (`.cine__frame` has a black background), so the room
  never shows through the frame; at 0.9 s the picture on it comes up like a projector
  lamp warming up (`cine-on`, .7 s: one soft dip, no overexposure). `LEAVE` in
  `cine.js` = delay + duration of `cine-on`. Tried and rejected: a hard flicker with
  `brightness(1.8)`, it flashed out of the dark room.
- **The frame.** `.cine__frame` covers the whole hero under the bars (`z-index: 1` on the
  bars) and holds `hero.jpg` cover, `scale: 1.04` (the start of the landing's `drift`),
  so it is pixel for pixel the Cinema hero. Only the band between the bars is seen.
- **Shared name** `cinema-frame`, forward only: `.is-cine .cine__frame` in the room,
  `.hero` on the Cinema page, the same size on both. In `vt.css` both snapshots keep their
  own size, centred, and the image pair clips them. The page's scrim and text fade in
  over the frame. Tried and rejected: `object-fit: cover` on both snapshots (the old one
  scales up, the new one does not, the frame doubles); a frame only between the bars
  (what the bars uncovered came from the new page halfway through its fade, so the top
  bar seemed to fade out rather than slide away).
- **Bars and HUD in the transition.** `.is-cine` also names the bars `cine-bar-top` /
  `cine-bar-bot`. They have no pair on the Cinema page, so `vt.css` slides their old
  snapshots off the edge with the frame's timing (.9 s, same curve), uncovering the same
  picture underneath. The Cinema `.hud` is named `cinema-hud` and fades in
  last (.35 s from .55 s). Before this the bars sat in the root snapshot and just faded
  with it, and the HUD showed in the new root, got covered by the opening frame and then
  appeared a second time when the transition ended.
- **Skipped transition fallback.** Chrome sometimes skips the transition (seen on the
  first navigation in a freshly started browser). The new page then appears at once, and
  the room's bars vanished with no motion. The room's click now sets
  `sessionStorage.cineIn`; on `pagereveal` with no transition (or a skipped one),
  `cinema-g.js` adds `.is-arriving` for two frames, so the Cinema page's own bars are in
  place on the first frame and slide out (.5 s). The page holds first paint for its
  scripts with `<link rel="expect" blocking="render">`, like the room.
- **Returning** mirrors leaving. The HUD link, or A / Left / Escape (`cinema-g.js`, hint
  `A в комнату` at the right of the HUD, hidden on touch), adds `.is-leaving` on the
  Cinema page for 1200 ms: the same bars slide in over the page (`.cine` in
  `cinema-g.html`, fixed, above the HUD; `--bar` repeats the room's formula) and the
  hero text and scroll cue fade (.6 s ease-in-out; the page's `--ease` at .3 s cut
  them off abruptly), leaving only the picture, then the
  picture between them darkens to black (.7 s, like the lamp warming up in reverse).
  `.hero` loses its name, nothing travels. Then `history.back()` if the page was opened
  from the room, otherwise `sessionStorage.cine` + the link.
  The room opens in the same picture (`.is-cine-dark`: bars, `.cine__black` between
  them, lights off, no frame, no transitions). On a cache restore that happens in
  `pagereveal`, before the first paint; on a direct visit in `cine.js` at load. The
  view transition between two identical black screens is skipped (it held the black
  for an extra .55 s). Two frames later `.is-cine-lift` starts fading the black (.45 s),
  and 150 ms in (`LIFT`) `.is-cine-back` already unwinds the room: the bars slide out
  (.5 s), the room brightens (.45 s), the lanterns come back almost together (.35 s,
  .03 s apart), panel, HUD and bottom line last (.3 s delay). `.is-cine-lift` stays on
  until the end, or the black would snap off mid-fade. Tried and rejected: waiting for
  the black to clear first, the half-dark room in bars stood still for half a second. Without `pagereveal` (Firefox) all of this runs on
  `pageshow`, after the first paint.
  Tried and rejected: shrinking the Cinema hero back into the band with the view
  transition, then fading the frame over the dark room.

## Wall to group page

- **Same backdrop.** `notes-g.css` places `img/wall-g.jpg` exactly where the camera stops
  (`--cam-at: .95`, `.8` under 1100 px). If `--cam` in `g.css` or `wall.css` changes,
  `--cam-at` has to follow, or the background jumps on navigation.
- **Shared names.** `sigil`: `.sigil.on` on the wall and `.mark` on the page.
  `group-title`: `.group.is-on .group__t` and the page `h1`. The mark's SVG paths are a
  copy of the sigil in `index-g.html`.
- **Active sigil.** Once drawn, the sigil's halo breathes (`sigil-breathe` in `g.css`).
  `--done` per sigil is when its last stroke finishes; a new sigil needs its own value.
- **Leaving.** `g.js` holds the click for 350 ms (`.is-going`): other groups dim and the
  sigil's halo pulses (`sigil-pulse` in `g.css`: it fades out completely by 30%, flares
  to 17px at 95% by 65%, then shrinks into the line) and its eye blinks (`sigil-blink`: `.sigil__dot` squeezes
  to a slit, closed at the same 65%), then the browser navigates. The sigil travels without a halo;
  its own colour and thickness do not change. On the page the mark's glow fades in after
  the move (`glow-in`). The pulse and blink durations have to match the delay in `g.js`.
  Tried and rejected for the pulse: scaling the sigil, brightening the line (amber turns
  yellow-green), saturating it with a tight glow (too strong).
- **Returning.** From the wall, back is `history.back()`. On a direct visit it is a link to
  `index-g.html#notes`; `sessionStorage.wall` tells `g.js` to show the sigil at once.
  `<link rel="expect" href="#ready">` in `index-g.html` holds the first frame until the
  scripts have put the camera at the wall.
- **A new group** needs: a `.group` and a `.sigil` in `index-g.html`, a colour in
  `wall.css` and in `notes-g.css` (`body[data-g]`), and its own page with `data-g` and
  the mark.
- Cross-document view transitions need http: on `file://` the page just opens. Serve
  from the repo root (`python3 -m http.server`), since the font lives in `src/fonts/`.

## Group page to note

- **Keys on the group page** (`notes-g.js`). W/S (and Up/Down) move the selection through
  the visible rows, D opens the selected one. The selected row is the focused one plus
  `.is-on`. While keys are in use `body.by-keys` switches hover off on the rows, so only
  one row is lit; the first real mouse move hands the selection back to the cursor.
- **Shared names.** `note-title`: `.row.is-open .row__t` and the note's `h1`. `sigil` and
  `group-title` continue from the wall: on the note they are the small mark and `python`
  in the breadcrumbs.
- **Leaving.** `notes-g.js` holds the click for 300 ms (`body.is-going`): everything dims except
  what travels: the open row's title, the group title and the sigil. The selection line
  and the rule above the open row fade out too.
  The transition on those elements in `notes-g.css` has to match the delay.
- **Progress line.** `.progress` at the top of the note; `note-g.js` drives its length
  through `--p`, never below `.012`. Tried and rejected: the row's ember line travelling
  up to become it (too much going on at once).
- **Wall on the note.** `.sky` is one screen tall and absolute, so the wall sits where
  the camera stopped, darkened to .86, and scrolls away with the header.
- **Returning.** From the list, back is `history.back()` and the row is still selected.
  On a direct visit it is a link to `notes-python.html`; `sessionStorage.note` tells
  `notes-g.js` which row to open and select. `.is-open` is dropped 1 s after the return.
- **A new note** needs its own page and the row's `href`; rows with `href="#"` do nothing.
  `note-g.js` treats the page as opened from its list when the referrer ends with the
  href of the page's "к списку" link, so a note in a new group needs no script change.

## JPEG conversion

The page loads the JPEG copies, not the PNG sources. After changing a source, regenerate
its copy:

```bash
magick img/shisha-start-10d-good.png -quality 92 img/room-g.jpg
magick img/wall-g-source.png -quality 90 img/wall-g.jpg
```

Sizes stay the same: 1672x941 for the room, 2688x1152 for the wall.

## What depends on what

- **The wall is tied to the frame.** The left 450 px of `wall-g-source.png` are the right
  368 px of `shisha-start-10d-good.png`, scaled up, and the wall's carpet is drawn as a
  continuation of them. On the floor the frame's pixels fade into the wall's carpet over
  the last 150 px before the post, and only below the sofa base. If the lower right
  corner of the frame changes (right sofa, carpet), this left end of the wall has to be
  rebuilt. Changes to the window, the man or the hookah do not affect the wall.
- **Geometry.** The wall has the height of the frame and starts `--lap` (16.75% of its
  width) before the frame's right edge, so the post's left edge (16.7%) sits on the
  frame's right edge. Wall scale relative to the frame: 1152 / 941 = 1.2242.
- **Wall mask** (`g.css`). The top 85% of the wall is cut hard at the post (16.7%). The
  bottom 15.2%, the floor, fades in from 4% to 10%: in that zone the wall holds the
  frame's own pixels, so the overlap is invisible in the room.
- **Floor line.** The post and the bookshelf end at 993 px of 1152 (86.2%). The sofa's
  wooden base in the frame ends at about 811 px of 941 at the right edge, the same line.
- **Layer order** (`g.css`). `.world { isolation: isolate; }` keeps the wall under
  `.scrim` at all times. Without it the wall's strip of carpet at the right edge of the
  frame looks lit in the room and goes dark when the pan starts.
- **Lights.** The eight `.glow` coordinates in `index-g.html` are fractions of the frame.
  A new frame with moved candles or lanterns needs them updated.
- **Smoke.** `data-coal="465,187"` on `#smoke` is the hookah bowl on the half-resolution
  canvas (836x470).

## Not done, not checked

- Room to Cinema was checked in headless Chrome only (1600x900, screencast frames, three
  paths: forward, back by history, back by the HUD link on a direct visit). Not watched
  in motion, not opened under 1100 px or in Safari/Firefox. Screens under 560 px tall:
  the room's bars are computed from the 560 px hero, the Cinema page's from the
  viewport, so they would not match on return. The smoke and projector beam from the
  first sketch are not done.

- Docker pages were checked as stills at 1600 px only. The wall to Docker and Docker to
  note transitions were not watched, and the pages were not opened under 1100 px.

- The camera pan was only checked on still screenshots (headless Chrome, 1600x900, with
  the camera stopped mid-pan). It was not watched in motion.
- Screens narrower than 1100 px were not opened.
- The frame is 1672x941 and the wall 2688x1152, so the wall is sharper than the frame.
  The frame has not been upscaled.
- The carpet in the frame is seen at an angle and the wall's carpet straight on, so the
  diagonal bands of the pattern straighten out near the post.
- The shelf top on the wall is at about 62% of the height, while the sigil and the group
  list are still placed for 61%.
- `notes.html` still shows the old `img/shisha-start.png`.
- The wall to group page transition was checked in headless Chrome only (1600x900, frames
  captured mid-transition, both directions). Not watched in motion, not opened in Safari
  or Firefox. The group page at 420 px was checked as a still, the transition there was not.
- The pulse before leaving the wall was sampled in headless Chrome, never judged in motion.
- The group page to note transition was checked in headless Chrome only (1600x900, frames
  captured mid-transition, both directions). Not watched in motion. The note page was
  not opened under 1100 px.
- `note-slots.html` was checked as stills at 1400 px only. Not checked: under 1100 px, the
  term tooltip on hover, the copy button, the collapsed state of the collapsible block.
- `note-async.html` still uses its own hand markup, not the real one that `prose.css` styles.
- The prompts for the current window view and the current wall are not written down.
- `img/` is not tracked by git: `room-g.jpg` and `wall-g.jpg` are untracked and the PNG
  sources are gitignored, so a fresh checkout shows the page without the room or the wall.
