#!/usr/bin/env python3
# Copyright (c) 2026 ladylydia. All Rights Reserved.
# NOT MIT — proprietary brand tooling. See assets/brand/LICENSE.
"""Remove baked checkerboard / flat backdrop from mascot PNG exports."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def clean_mascot_background(
    im: Image.Image,
    *,
    light_min: int = 246,
    chroma_max: int = 10,
    fade_alpha_below: int = 64,
) -> tuple[Image.Image, int]:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    removed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a <= fade_alpha_below:
                if a:
                    removed += 1
                px[x, y] = (0, 0, 0, 0)
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            if mn >= light_min and mx - mn <= chroma_max:
                px[x, y] = (r, g, b, 0)
                removed += 1
    return im, removed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path, help="PNG files to fix in place")
    args = parser.parse_args()
    for path in args.paths:
        im, removed = clean_mascot_background(Image.open(path))
        im.save(path)
        print(f"{path}: removed {removed} backdrop pixels")


if __name__ == "__main__":
    main()
