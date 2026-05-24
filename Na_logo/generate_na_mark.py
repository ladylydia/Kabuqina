#!/usr/bin/env python3
# Copyright (c) 2026 ladylydia. All Rights Reserved.
# NOT MIT — proprietary brand tooling. See assets/brand/LICENSE.
"""Generate Kabuqina Na app-mark PNGs + ICO (brand purple palette)."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
WEB_PUBLIC = REPO / "web" / "public"

# Kabuqina companion palette (index.css)
BG_BOTTOM = (107, 85, 128)  # #6B5580
BG_TOP = (122, 101, 144)  # lighter purple highlight
TEXT = (255, 248, 242)  # warm cream #FFF8F2
SIZES = (16, 32, 48, 128, 256)
STEM = "kabuqina_na"

FONT_CANDIDATES = (
    Path(r"C:\Windows\Fonts\segoeuib.ttf"),
    Path(r"C:\Windows\Fonts\arialbd.ttf"),
)


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in FONT_CANDIDATES:
        if path.is_file():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def rounded_rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def render_mark(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    radius = max(2, round(size * 0.22))

    # Vertical gradient fill inside rounded square.
    base = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = base.load()
    for y in range(size):
        t = y / max(size - 1, 1)
        r = round(BG_TOP[0] * (1 - t) + BG_BOTTOM[0] * t)
        g = round(BG_TOP[1] * (1 - t) + BG_BOTTOM[1] * t)
        b = round(BG_TOP[2] * (1 - t) + BG_BOTTOM[2] * t)
        for x in range(size):
            px[x, y] = (r, g, b, 255)

    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    img = Image.composite(base, img, mask)

    draw = ImageDraw.Draw(img)
    font_size = max(8, round(size * 0.52))
    font = load_font(font_size)
    label = "Na"
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) / 2 - bbox[0]
    ty = (size - th) / 2 - bbox[1] - size * 0.02
    draw.text((tx, ty), label, font=font, fill=TEXT)
    return img


def write_outputs() -> None:
    WEB_PUBLIC.mkdir(parents=True, exist_ok=True)
    icons: list[Image.Image] = []

    for size in SIZES:
        mark = render_mark(size)
        icons.append(mark)
        name = f"{STEM}_{size}.png"
        mark.save(ROOT / name, optimize=True)
        mark.save(WEB_PUBLIC / name, optimize=True)

    ico_path = ROOT / f"{STEM}.ico"
    web_ico = WEB_PUBLIC / f"{STEM}.ico"
    icons[-1].save(
        ico_path,
        format="ICO",
        sizes=[(s, s) for s in SIZES],
        append_images=icons[:-1],
    )
    shutil.copy2(ico_path, web_ico)

    # Retire legacy blue filenames if present.
    for legacy in WEB_PUBLIC.glob("kabuqina_na_blue*"):
        legacy.unlink(missing_ok=True)
    for legacy in ROOT.glob("kabuqina_na_blue*"):
        legacy.unlink(missing_ok=True)


def main() -> int:
    write_outputs()
    print(f"Wrote {STEM}_*.png + {STEM}.ico -> {ROOT} and {WEB_PUBLIC}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
