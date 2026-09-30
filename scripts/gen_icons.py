#!/usr/bin/env python3
"""
ZENITH PRO · icon generator
---------------------------------------------------------------------------
Renders the brand mark (assets/icon.svg, assets/icon-maskable.svg) to the PNG
sizes the manifest, iOS and browsers ask for, using the same Chromium the audits
use — so there is no image-library dependency and the icon is exactly what a
browser draws.

    python scripts/gen_icons.py

Outputs (assets/):
    icon-192.png, icon-512.png     rounded mark, purpose "any"
    icon-maskable-512.png          full-bleed, glyph inside the 80 % safe zone
    icon-180.png                   apple-touch-icon (full-bleed; iOS rounds it)
    favicon.png                    64 px rounded mark
"""

import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

JOBS = [
    ("icon.svg", "icon-192.png", 192, True),
    ("icon.svg", "icon-512.png", 512, True),
    ("icon-maskable.svg", "icon-maskable-512.png", 512, False),
    ("icon-maskable.svg", "icon-180.png", 180, False),
    ("icon.svg", "favicon.png", 64, True),
]


def render(browser, svg_name, out_name, size, transparent):
    page = browser.new_page(viewport={"width": size, "height": size}, device_scale_factor=1)
    svg = (ASSETS / svg_name).read_text(encoding="utf-8")
    page.set_content(
        f"<!doctype html><style>html,body{{margin:0;background:transparent}}"
        f"svg{{display:block;width:{size}px;height:{size}px}}</style>{svg}"
    )
    page.screenshot(path=str(ASSETS / out_name), omit_background=transparent)
    page.close()
    print(f"assets/{out_name}  {size}x{size}")


def main():
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(channel="chrome")
        except Exception:
            browser = p.chromium.launch()
        for job in JOBS:
            render(browser, *job)
        browser.close()


if __name__ == "__main__":
    sys.exit(main())
