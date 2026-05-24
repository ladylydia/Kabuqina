#!/usr/bin/env python3
# Copyright (c) 2026 ladylydia. All Rights Reserved.
# NOT MIT — proprietary brand tooling. See assets/brand/LICENSE.
"""Generate Kabuqina coffee-cup mascot SVG + PNGs (matches web CompanionCup brand CSS)."""

from __future__ import annotations

import math
import sys
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
WEB_PUBLIC = REPO / "web" / "public"

STEM = "kabuqina_mascot"
PNG_SIZES = (64, 128, 256, 512)

# CompanionCup brand palette (web/src/index.css)
COLORS = {
    "body_top": (255, 255, 255),
    "body_mid": (245, 240, 235),
    "body_bottom": (232, 221, 212),
    "body_border": (107, 85, 128, 82),
    "rim_top": (255, 255, 255),
    "rim_bottom": (240, 230, 220),
    "rim_border": (107, 85, 128, 61),
    "handle": (200, 184, 216),
    "eye": (139, 125, 154),
    "blush": (196, 149, 160, 82),
    "latte_center": (245, 230, 208),
    "latte_mid": (232, 207, 168),
    "latte_outer": (212, 176, 128),
    "latte_edge": (184, 146, 106),
}


@dataclass(frozen=True)
class Layout:
    """Geometry as fractions of a square canvas (CSS .kq-companion-cup @ 2rem)."""

    body_x: float = 0.14
    body_y: float = 0.27
    body_w: float = 0.675
    body_h: float = 0.59
    body_br: float = 0.31
    rim_y: float = 0.16
    rim_h: float = 0.21
    handle_x: float = 0.68
    handle_y: float = 0.37
    handle_w: float = 0.26
    handle_h: float = 0.36
    handle_stroke: float = 0.035
    eye_left_x: float = 0.315
    eye_right_x: float = 0.402
    eye_y: float = 0.555
    eye_r: float = 0.025
    eye_gap: float = 0.0875
    blush_y: float = 0.66
    blush_left_x: float = 0.21
    blush_right_x: float = 0.565
    blush_w: float = 0.14
    blush_h: float = 0.08


LAYOUT = Layout()

# Rim sits ±0.05rem on the 2rem CSS cup → 0.025 per side on a 0–1 canvas.
RIM_OVERHANG = 0.025


def _rim_box(layout: Layout) -> tuple[float, float]:
    return layout.body_x - RIM_OVERHANG, layout.body_w + 2 * RIM_OVERHANG


def _hex(rgb: tuple[int, ...]) -> str:
    if len(rgb) == 4:
        r, g, b, a = rgb
        return f"#{r:02x}{g:02x}{b:02x}{a:02x}"
    r, g, b = rgb
    return f"#{r:02x}{g:02x}{b:02x}"


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def _lerp_rgb(c1: tuple[int, ...], c2: tuple[int, ...], t: float) -> tuple[int, int, int]:
    return (
        round(_lerp(c1[0], c2[0], t)),
        round(_lerp(c1[1], c2[1], t)),
        round(_lerp(c1[2], c2[2], t)),
    )


def _scale(layout: Layout, size: int) -> dict[str, float]:
    s = float(size)
    return {k: getattr(layout, k) * s for k in layout.__dataclass_fields__}


def render_svg(layout: Layout = LAYOUT) -> str:
    rim_x, rim_w = _rim_box(layout)
    g = _scale(layout, 100)
    bx, by, bw, bh, br = g["body_x"], g["body_y"], g["body_w"], g["body_h"], g["body_br"]
    rx, ry, rw, rh = rim_x * 100, g["rim_y"], rim_w * 100, g["rim_h"]
    hx, hy, hw, hh = g["handle_x"], g["handle_y"], g["handle_w"], g["handle_h"]
    hs = g["handle_stroke"]
    ex = g["eye_left_x"]
    ey = g["eye_y"]
    eg = g["eye_gap"]
    er = g["eye_r"]
    blx, brx = g["blush_left_x"], g["blush_right_x"]
    by_bl = g["blush_y"]
    blw, blh = g["blush_w"], g["blush_h"]

    latte_x = bx + bw * 0.08
    latte_y = by + bh * 0.04
    latte_w = bw * 0.84
    latte_h = bh * 0.18

    body_path = (
        f"M {bx:.2f} {by:.2f} "
        f"L {bx:.2f} {by + bh - br:.2f} "
        f"Q {bx:.2f} {by + bh:.2f} {bx + br:.2f} {by + bh:.2f} "
        f"L {bx + bw - br:.2f} {by + bh:.2f} "
        f"Q {bx + bw:.2f} {by + bh:.2f} {bx + bw:.2f} {by + bh - br:.2f} "
        f"L {bx + bw:.2f} {by:.2f} Z"
    )

    handle_path = (
        f"M {hx:.2f} {hy + hh * 0.12:.2f} "
        f"C {hx + hw * 1.05:.2f} {hy + hh * 0.18:.2f} "
        f"{hx + hw * 1.05:.2f} {hy + hh * 0.82:.2f} "
        f"{hx:.2f} {hy + hh * 0.88:.2f}"
    )

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Kabuqina mascot">
  <title>Kabuqina mascot</title>
  <defs>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{_hex(COLORS['body_top'])}"/>
      <stop offset="45%" stop-color="{_hex(COLORS['body_mid'])}"/>
      <stop offset="100%" stop-color="{_hex(COLORS['body_bottom'])}"/>
    </linearGradient>
    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{_hex(COLORS['rim_top'])}"/>
      <stop offset="100%" stop-color="{_hex(COLORS['rim_bottom'])}"/>
    </linearGradient>
    <radialGradient id="latteGrad" cx="50%" cy="32%" rx="46%" ry="58%">
      <stop offset="0%" stop-color="{_hex(COLORS['latte_center'])}"/>
      <stop offset="35%" stop-color="{_hex(COLORS['latte_mid'])}"/>
      <stop offset="68%" stop-color="{_hex(COLORS['latte_outer'])}"/>
      <stop offset="100%" stop-color="{_hex(COLORS['latte_edge'])}"/>
    </radialGradient>
  </defs>
  <path d="{handle_path}" fill="none" stroke="{_hex(COLORS['handle'])}" stroke-width="{hs:.2f}"
        stroke-linecap="round"/>
  <path d="{body_path}" fill="url(#bodyGrad)" stroke="{_hex(COLORS['body_border'][:3])}"
        stroke-opacity="0.32" stroke-width="0.35"/>
  <rect x="{rx:.2f}" y="{ry:.2f}" width="{rw:.2f}" height="{rh:.2f}" rx="{rh / 2:.2f}"
        fill="url(#rimGrad)" stroke="{_hex(COLORS['rim_border'][:3])}" stroke-opacity="0.24"
        stroke-width="0.3"/>
  <ellipse cx="{latte_x + latte_w / 2:.2f}" cy="{latte_y + latte_h / 2:.2f}"
           rx="{latte_w / 2:.2f}" ry="{latte_h / 2:.2f}" fill="url(#latteGrad)"/>
  <ellipse cx="{blx:.2f}" cy="{by_bl:.2f}" rx="{blw / 2:.2f}" ry="{blh / 2:.2f}"
           fill="{_hex(COLORS['blush'][:3])}" fill-opacity="0.32"/>
  <ellipse cx="{brx:.2f}" cy="{by_bl:.2f}" rx="{blw / 2:.2f}" ry="{blh / 2:.2f}"
           fill="{_hex(COLORS['blush'][:3])}" fill-opacity="0.32"/>
  <circle cx="{ex:.2f}" cy="{ey:.2f}" r="{er:.2f}" fill="{_hex(COLORS['eye'])}"/>
  <circle cx="{ex + eg:.2f}" cy="{ey:.2f}" r="{er:.2f}" fill="{_hex(COLORS['eye'])}"/>
</svg>
"""


def _rounded_body_mask(size: int, layout: Layout) -> Image.Image:
    g = _scale(layout, size)
    bx, by, bw, bh, br = int(g["body_x"]), int(g["body_y"]), int(g["body_w"]), int(g["body_h"]), int(g["body_br"])
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=br, fill=255)
    # Flatten top corners (CSS cup has flat top on body).
    draw.rectangle((bx, by, bx + bw, by + max(2, br // 3)), fill=255)
    return mask


def _vertical_gradient(size: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (1, size))
    px = img.load()
    for y in range(size):
        px[0, y] = _lerp_rgb(top, bottom, y / max(size - 1, 1))
    return img.resize((size, size))


def _draw_handle(draw: ImageDraw.ImageDraw, size: int, layout: Layout) -> None:
    g = _scale(layout, size)
    hx, hy, hw, hh = g["handle_x"], g["handle_y"], g["handle_w"], g["handle_h"]
    stroke = max(2, round(g["handle_stroke"]))
    points = []
    steps = 32
    for i in range(steps + 1):
        t = i / steps
        angle = math.pi * 0.55 * t + math.pi * 0.72
        x = hx + hw * (1 - math.cos(angle))
        y = hy + hh * (0.12 + 0.76 * t)
        points.append((x, y))
    draw.line(points, fill=COLORS["handle"], width=stroke, joint="curve")


def render_png(size: int, layout: Layout = LAYOUT) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    g = _scale(layout, size)
    rim_x, rim_w = _rim_box(layout)

    _draw_handle(ImageDraw.Draw(img), size, layout)

    body_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    body_grad = _vertical_gradient(size, COLORS["body_top"], COLORS["body_bottom"])
    body_rgba = Image.merge("RGBA", (*body_grad.split(), _rounded_body_mask(size, layout)))
    body_layer = Image.alpha_composite(body_layer, body_rgba)
    body_draw = ImageDraw.Draw(body_layer)
    bx, by, bw, bh, br = g["body_x"], g["body_y"], g["body_w"], g["body_h"], g["body_br"]
    body_draw.rounded_rectangle(
        (bx, by, bx + bw, by + bh),
        radius=br,
        outline=(*COLORS["body_border"][:3], COLORS["body_border"][3]),
        width=max(1, round(size * 0.012)),
    )
    img = Image.alpha_composite(img, body_layer)

    draw = ImageDraw.Draw(img)
    rx, ry, rw, rh = rim_x * size, g["rim_y"], rim_w * size, g["rim_h"]
    draw.rounded_rectangle(
        (rx, ry, rx + rw, ry + rh),
        radius=rh / 2,
        fill=COLORS["rim_bottom"],
        outline=(*COLORS["rim_border"][:3], COLORS["rim_border"][3]),
        width=max(1, round(size * 0.01)),
    )

    latte_x = bx + bw * 0.08
    latte_y = by + bh * 0.04
    latte_w = bw * 0.84
    latte_h = bh * 0.18
    draw.ellipse(
        (latte_x, latte_y, latte_x + latte_w, latte_y + latte_h),
        fill=COLORS["latte_mid"],
        outline=COLORS["latte_edge"],
        width=max(1, round(size * 0.006)),
    )

    blw, blh = g["blush_w"], g["blush_h"]
    for cx in (g["blush_left_x"], g["blush_right_x"]):
        draw.ellipse(
            (cx - blw / 2, g["blush_y"] - blh / 2, cx + blw / 2, g["blush_y"] + blh / 2),
            fill=COLORS["blush"],
        )

    er = g["eye_r"]
    for cx in (g["eye_left_x"], g["eye_left_x"] + g["eye_gap"]):
        draw.ellipse((cx - er, g["eye_y"] - er, cx + er, g["eye_y"] + er), fill=COLORS["eye"])

    return img


def write_outputs(copy_web: bool = True) -> None:
    svg_path = ROOT / f"{STEM}.svg"
    svg_path.write_text(render_svg(), encoding="utf-8")

    for size in PNG_SIZES:
        png = render_png(size)
        png.save(ROOT / f"{STEM}_{size}.png", optimize=True)
        if copy_web:
            WEB_PUBLIC.mkdir(parents=True, exist_ok=True)
            png.save(WEB_PUBLIC / f"{STEM}_{size}.png", optimize=True)

    if copy_web:
        (WEB_PUBLIC / f"{STEM}.svg").write_text(svg_path.read_text(encoding="utf-8"), encoding="utf-8")

    print(f"Wrote {STEM}.svg + {', '.join(f'{STEM}_{s}.png' for s in PNG_SIZES)} -> {ROOT}")
    if copy_web:
        print(f"Copied to {WEB_PUBLIC}")


def main() -> int:
    write_outputs()
    return 0


if __name__ == "__main__":
    sys.exit(main())
