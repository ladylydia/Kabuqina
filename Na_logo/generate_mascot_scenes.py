#!/usr/bin/env python3
# Copyright (c) 2026 ladylydia. All Rights Reserved.
# NOT MIT — proprietary brand tooling. See assets/brand/LICENSE.
"""Generate Kabuqina hero/pill scene SVGs + gingham coaster assets (matches web CSS)."""

from __future__ import annotations

import math
import sys
from dataclasses import dataclass
from pathlib import Path

from generate_mascot import LAYOUT, render_cup_group

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
WEB_PUBLIC = REPO / "web" / "public"

REM = 100  # 1rem → 100 SVG units
# Mascot cup body foot in the 100×100 icon box (see generate_mascot.Layout).
MASCOT_FOOT_Y = (LAYOUT.body_y + LAYOUT.body_h) * 100

# CSS gingham coaster palette (web/src/index.css)
GINGHAM_BG = "#faf6ff"
GINGHAM_LINE = "rgba(184, 169, 201, 0.32)"
GINGHAM_BORDER = "rgba(184, 169, 201, 0.42)"


@dataclass(frozen=True)
class CoasterLayout:
    """Tilted gingham coaster — mirrors .kq-companion-*-mat::before."""

    size_rem: float
    radius_rem: float
    grid_rem: float
    rotate_x_deg: float
    rotate_z_deg: float

    @property
    def y_scale(self) -> float:
        return math.cos(math.radians(self.rotate_x_deg))


HERO_COASTER = CoasterLayout(5.35, 1.15, 0.82, 56, -10)
PILL_COASTER = CoasterLayout(3.97, 0.83, 0.6, 58, -10)


@dataclass(frozen=True)
class SceneLayout:
    stem: str
    title: str
    width_rem: float
    height_rem: float
    coaster: CoasterLayout
    coaster_bottom_rem: float
    ground_w_rem: float
    ground_h_rem: float
    ground_bottom_rem: float
    cup_scale: float
    cup_left_rem: float
    cup_bottom_rem: float
    contact_w_rem: float
    contact_h_rem: float
    cup_foot_inset_rem: float  # body foot above cup container bottom (CSS)
    cup_foot_nudge_down_rem: float = 0.0  # SVG-only: push cup onto coaster surface
    steam: bool = True
    white_background: bool = False
    cup_drop_shadow: bool = False


HERO_SCENE = SceneLayout(
    stem="kabuqina_hero_scene",
    title="Kabuqina chat hero — cup on gingham coaster",
    width_rem=7.75,
    height_rem=6.85,
    coaster=HERO_COASTER,
    coaster_bottom_rem=0.45,
    ground_w_rem=4.6,
    ground_h_rem=0.7,
    ground_bottom_rem=0.15,
    cup_scale=4.2,
    cup_left_rem=2.195,
    cup_bottom_rem=2.0,
    contact_w_rem=2.85,
    contact_h_rem=0.55,
    cup_foot_inset_rem=0.36,
    cup_foot_nudge_down_rem=1.08,
)

PILL_SCENE = SceneLayout(
    stem="kabuqina_pill_scene",
    title="Kabuqina companion pill — cup on gingham coaster",
    width_rem=6.2,
    height_rem=6.15,
    coaster=PILL_COASTER,
    coaster_bottom_rem=0.12,
    ground_w_rem=3.16,
    ground_h_rem=0.48,
    ground_bottom_rem=0.0,
    cup_scale=6.2,
    cup_left_rem=0.0,
    cup_bottom_rem=0.67,
    contact_w_rem=2.24,
    contact_h_rem=0.44,
    cup_foot_inset_rem=0.41,
    cup_foot_nudge_down_rem=0.58,
)

# 1280×640 OG banner
SOCIAL_COASTER = CoasterLayout(6.35, 1.36, 0.97, 56, -10)
SOCIAL_SCENE = SceneLayout(
    stem="kabuqina_social_preview",
    title="Kabuqina social / OG preview",
    width_rem=12.8,
    height_rem=6.4,
    coaster=SOCIAL_COASTER,
    coaster_bottom_rem=0.72,
    ground_w_rem=5.35,
    ground_h_rem=0.95,
    ground_bottom_rem=0.38,
    cup_scale=5.05,
    cup_left_rem=0.0,
    cup_bottom_rem=0.95,
    contact_w_rem=2.95,
    contact_h_rem=0.58,
    cup_foot_inset_rem=0.41,
    cup_foot_nudge_down_rem=0.52,
    steam=False,
    white_background=True,
)


def _r(units: float) -> float:
    return units * REM


def _gingham_pattern(pattern_id: str, grid_rem: float) -> str:
    g = _r(grid_rem)
    return f"""
    <pattern id="{pattern_id}" width="{g:.2f}" height="{g:.2f}" patternUnits="userSpaceOnUse">
      <rect width="{g:.2f}" height="{g:.2f}" fill="{GINGHAM_BG}"/>
      <path d="M 0 0 H {g:.2f}" stroke="{GINGHAM_LINE}" stroke-width="1"/>
      <path d="M 0 0 V {g:.2f}" stroke="{GINGHAM_LINE}" stroke-width="1"/>
    </pattern>"""


def _coaster_markup(
    layout: CoasterLayout,
    *,
    prefix: str,
    cx: float,
    cy: float,
    include_ground: bool = False,
    ground_w: float = 0,
    ground_h: float = 0,
    ground_cy: float = 0,
) -> str:
    size = _r(layout.size_rem)
    radius = _r(layout.radius_rem)
    pattern_id = f"{prefix}gingham"
    tilt = (
        f"translate({cx:.2f} {cy:.2f}) "
        f"rotate({layout.rotate_z_deg:.2f}) "
        f"scale(1 {layout.y_scale:.4f})"
    )
    coaster = f"""
  <g transform="{tilt}">
    <rect x="{-size / 2:.2f}" y="{-size / 2:.2f}" width="{size:.2f}" height="{size:.2f}" rx="{radius:.2f}"
          fill="url(#{pattern_id})" stroke="{GINGHAM_BORDER}" stroke-width="1"/>
  </g>"""
    ground = ""
    if include_ground:
        ground = f"""
  <ellipse cx="{cx:.2f}" cy="{ground_cy:.2f}" rx="{ground_w / 2:.2f}" ry="{ground_h / 2:.2f}"
           fill="rgba(90, 74, 106, 0.18)"/>"""
    return coaster + ground


def render_coaster_svg(layout: CoasterLayout, *, stem: str, title: str) -> str:
    """Standalone tilted coaster asset with padding."""
    pad = _r(layout.size_rem * 0.35)
    size = _r(layout.size_rem)
    w = size + pad * 2
    h = size * layout.y_scale + pad * 2
    cx = w / 2
    cy = pad + (size * layout.y_scale) / 2
    pattern_id = "coasterGingham"
    defs = _gingham_pattern(pattern_id, layout.grid_rem)
    body = _coaster_markup(layout, prefix="", cx=cx, cy=cy)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" role="img" aria-label="{title}">
  <title>{title}</title>
  <defs>{defs}
  </defs>{body}
</svg>
"""


def render_scene_svg(scene: SceneLayout) -> str:
    w = _r(scene.width_rem)
    h = _r(scene.height_rem)
    cx = w / 2

    coaster_cy = h - _r(scene.coaster_bottom_rem) - (_r(scene.coaster.size_rem) * scene.coaster.y_scale) / 2
    ground_cy = h - _r(scene.ground_bottom_rem) - _r(scene.ground_h_rem) / 2

    prefix = scene.stem.replace("-", "_") + "_"
    cup_defs, cup_shapes = render_cup_group(prefix, steam=scene.steam)

    if scene.cup_left_rem > 0:
        cup_tx = _r(scene.cup_left_rem)
    else:
        cup_tx = cx - scene.cup_scale * 50

    cup_container_bottom = h - _r(scene.cup_bottom_rem)
    cup_foot_y = cup_container_bottom - _r(scene.cup_foot_inset_rem) + _r(scene.cup_foot_nudge_down_rem)
    cup_transform = (
        f"translate({cup_tx:.2f} {cup_foot_y:.2f}) "
        f"scale({scene.cup_scale:.4f}) translate(0 -{MASCOT_FOOT_Y:.0f})"
    )

    contact_rx_local = _r(scene.contact_w_rem) / (2 * scene.cup_scale)
    contact_ry_local = _r(scene.contact_h_rem) / (2 * scene.cup_scale)
    contact_local = f"""
    <ellipse cx="50" cy="{MASCOT_FOOT_Y + 1.5:.1f}" rx="{contact_rx_local:.2f}" ry="{contact_ry_local:.2f}"
             fill="rgba(73, 56, 94, 0.28)"/>"""

    coaster_pattern = _gingham_pattern(f"{prefix}gingham", scene.coaster.grid_rem)
    coaster = _coaster_markup(
        scene.coaster,
        prefix=prefix,
        cx=cx,
        cy=coaster_cy,
        include_ground=True,
        ground_w=_r(scene.ground_w_rem),
        ground_h=_r(scene.ground_h_rem),
        ground_cy=ground_cy,
    )

    cup_filter = f' filter="url(#{prefix}cupShadow)"' if scene.cup_drop_shadow else ""
    cup_markup = f"""
  <g{cup_filter} transform="{cup_transform}">{contact_local}{cup_shapes}
  </g>"""

    cup_top_y = cup_foot_y - MASCOT_FOOT_Y * scene.cup_scale
    steam_pad = scene.cup_scale * 18 if scene.steam else 0
    min_y = min(0.0, cup_top_y - steam_pad - 12)
    view_h = h - min_y

    background = ""
    if scene.white_background:
        background = f'\n  <rect x="0" y="{min_y:.2f}" width="{w:.0f}" height="{view_h:.0f}" fill="#ffffff"/>'

    drop_shadow_def = ""
    if scene.cup_drop_shadow:
        drop_shadow_def = f"""
    <filter id="{prefix}cupShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="rgba(90, 74, 106, 0.13)"/>
    </filter>"""

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {min_y:.2f} {w:.0f} {view_h:.0f}" role="img" aria-label="{scene.title}">
  <title>{scene.title}</title>
  <defs>
    {coaster_pattern}
    {cup_defs}{drop_shadow_def}
  </defs>{background}{coaster}{cup_markup}
</svg>
"""


def write_outputs(copy_web: bool = True) -> None:
    outputs: list[tuple[str, str]] = [
        ("kabuqina_coaster_hero", render_coaster_svg(HERO_COASTER, stem="kabuqina_coaster_hero", title="Kabuqina hero gingham coaster")),
        ("kabuqina_coaster_pill", render_coaster_svg(PILL_COASTER, stem="kabuqina_coaster_pill", title="Kabuqina pill gingham coaster")),
        (HERO_SCENE.stem, render_scene_svg(HERO_SCENE)),
        (PILL_SCENE.stem, render_scene_svg(PILL_SCENE)),
        (SOCIAL_SCENE.stem, render_scene_svg(SOCIAL_SCENE)),
    ]

    for stem, svg in outputs:
        path = ROOT / f"{stem}.svg"
        path.write_text(svg, encoding="utf-8")
        if copy_web:
            WEB_PUBLIC.mkdir(parents=True, exist_ok=True)
            (WEB_PUBLIC / f"{stem}.svg").write_text(svg, encoding="utf-8")

    names = ", ".join(stem for stem, _ in outputs)
    print(f"Wrote {names}.svg -> {ROOT}")
    if copy_web:
        print(f"Copied to {WEB_PUBLIC}")


def main() -> int:
    write_outputs()
    return 0


if __name__ == "__main__":
    sys.exit(main())
