# Kabuqina brand assets (proprietary)

**License:** [LICENSE](./LICENSE) — All Rights Reserved. **Not MIT.**  
**Copyright:** ladylydia · lilyreso@gmail.com · [github.com/ladylydia](https://github.com/ladylydia)

These paths in the monorepo ship **preview / distribution copies** of the
Kabuqina visual identity. Do not treat them as freely reusable clip art.

## Directories

| Location | Role |
| -------- | ---- |
| `Na_logo/` | **Source tree** — authoritative copies, exports, and generator scripts |
| `web/public/` | **App bundle copies** — same `kabuqina_*` / `mascot_*` files consumed by the web shell and Tauri build |
| `tauri/icons/` | **Generated app icons** — from `web/public/kabuqina_na_256.png` via `cargo tauri icon` |

Keep `Na_logo/` and `web/public/` in sync when changing marks. Regenerate with
the scripts below where noted.

## File patterns (`Na_logo/` and `web/public/` unless noted)

| Pattern | Contents |
| ------- | -------- |
| `kabuqina_mascot.svg` | Coffee-cup mascot — **vector master** |
| `kabuqina_mascot_{64,128,256,512}.png` | Mascot raster exports (transparent PNG) |
| `kabuqina_na_{16,32,48,128,256}.png` | **Na** app-mark / wordmark PNGs |
| `kabuqina_na.ico` | Windows ICO (multi-size) |
| `mascot.png` | Full mascot export (`Na_logo/` only) |
| `mascot_wide.png` | Wide-layout mascot export (`Na_logo/` only) |
| `mascot_round_coaster.png` | Round avatar / coaster crop |
| `mascot_square_standard.png` | Square avatar — standard crop |
| `mascot_square_strong.png` | Square avatar — tighter crop |
| `mascot_squre_coaster.*` | Coaster-style square crop (`.jpg` in `Na_logo/`, `.png` in `web/public/`) |
| `kabuqina_social_preview.png` | Social / OG preview (`Na_logo/` only) |

## Generator scripts (`Na_logo/`) — All Rights Reserved

These Python files encode mascot geometry, palette, and export pipelines. They
are **proprietary brand tooling**, not MIT-licensed application code:

| Script | Purpose |
| ------ | ------- |
| `generate_mascot.py` | Regenerate `kabuqina_mascot.svg` + `kabuqina_mascot_*.png`; copies to `web/public/` |
| `generate_na_mark.py` | Regenerate `kabuqina_na_*.png` + `kabuqina_na.ico`; copies to `web/public/` |
| `fix_mascot_png_alpha.py` | Remove checkerboard / flat backdrop from mascot PNG exports |

Run from repo root, e.g. `python Na_logo/generate_mascot.py`.

## Related code (MIT)

The **CSS-rendered companion cup** in `web/src/` (e.g. `CompanionCup.tsx`) is
**MIT-licensed source code**. The **visual identity** it implements is still
proprietary — do not reuse the look for another product without permission.

## UI screenshots

Product screenshots (`Na_logo/chat_*.png`, etc.) are covered separately under
[assets/ui/](../ui/) — also All Rights Reserved.
