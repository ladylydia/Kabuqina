# Kabuqina brand assets (proprietary)

**License:** [LICENSE](./LICENSE) — All Rights Reserved. **Not MIT.**  
**Copyright:** ladylydia · lilyreso@gmail.com · [github.com/ladylydia](https://github.com/ladylydia)

These paths in the monorepo are treated as brand assets (preview/distribution
copies only; do not treat as freely reusable clip art):

| Location | Contents |
| -------- | -------- |
| `web/public/kabuqina_*` | Wordmarks, mascot PNG/ICO/WebP/AVIF, app icons |
| `Na_logo/kabuqina_*` | Same family of marks (build/source tree copies) |
| `Na_logo/emoji*.png`, `Na_logo/xiaoba_avatar.jpg` | Mascot / avatar art |
| `Na_logo/kabuqina_mascot.svg`, `Na_logo/kabuqina_mascot_*.png` | Coffee-cup mascot (SVG + PNG; regen: `python Na_logo/generate_mascot.py`) |
| `tauri/icons/` | Generated app icons (from `web/public/kabuqina_na_256.png`) |

Vector or layered **source** files (if any) should stay outside public forks;
this tree ships raster previews suitable for building the app and README display.

The **CSS-rendered companion cup** in `web/src/` is source code (MIT). The
**visual identity** of the mascot is still proprietary — do not reuse the
look for another product without permission.
