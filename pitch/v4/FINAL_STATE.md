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
| `main.js` | Fog transition on the cards. |
| `wall.js` | Pan to the wall on `#notes`, W/A/S/D keys, group and sigil selection. |
| `smoke.js` | Smoke on the `#smoke` canvas. Only the wisp from the coals runs (`data-exhale="off"`). |
| `img/room-g.jpg` | The room frame, 1672x941. |
| `img/wall-g.jpg` | The wall, 2688x1152. |
| `img/shisha-start-10d-good.png` | Source of `room-g.jpg`. |
| `img/wall-g-source.png` | Source of `wall-g.jpg`. |
| `../../src/fonts/YsabeauInfant-VariableFont_wght.woff2` | Text font, referenced from `main.css`. |
| Google Fonts, JetBrains Mono | Mono font, loaded from the network. |

`notes.html` (with `notes.css`, `notes.js`) is the target of the Python group link.

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
- The prompts for the current window view and the current wall are not written down.
- `img/`, `g.css` and `index-g.html` are not tracked by git.
