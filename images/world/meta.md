# images/world — meta

This file tracks the images used by the new design's pages: the room (`/`), the
wall, note group pages and note pages. The image files themselves live in the
images repo under `src/images/world/` (synced into `src/images/` on deploy), so
this table records which image is used where and at what size.

| Where | File | Size |
|---|---|---|
| home — room frame (`<picture>`, `.stage__img`) | `src/images/world/room.avif` | 2274×1280, 189 KB |
| same, fallback | `src/images/world/room.jpg` | 2274×1280, 498 KB |
| home — wall (`.wall`); group and note pages — `.backdrop`, `<link rel=preload>` | `src/images/world/wall.avif` | 2987×1280, 244 KB |
| same, fallback | `src/images/world/wall.jpg` | 2987×1280, 614 KB |

Sources, not loaded by any page. Deploy skips them (`--exclude '/world/*.png'` in
`deploy.yml`), so they are never published:

| What | File | Size |
|---|---|---|
| room, generated original | `src/images/world/room.png` | 1672×941, 1.8 MB |
| wall, generated original | `src/images/world/wall.png` | 2688×1152, 3.2 MB |

Processing (full recipe in `pitch/v4/FINAL_STATE.md`, "Images and geometry"):

- Upscaled from the generated originals (room 1672×941, wall 2688×1152) to height 1280:
  Real-ESRGAN `x4plus` 4×, scaled down, blended 30/70 with a plain Lanczos stretch.
- The wall's left 500 px are the room's right 500 px, pixel for pixel, so the two join at
  the post without a seam.
- Exported as AVIF 4:4:4 q70, JPEG fallback 4:4:4 q85. Room and wall use the same
  settings, or a step shows at the seam.
