#!/usr/bin/env python3
"""ZENITH PRO print regression audit.

Proves the weekly planner renders as readable A4 landscape output:
- seven full-width day rows
- four readable meal cells per day
- no horizontal/vertical overlap
- generated PDF has no blank pages

Usage:
  python scripts/audit_print.py http://127.0.0.1:8137/index.html /tmp/zenith-plan-print.pdf
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

from playwright.sync_api import sync_playwright
from pypdf import PdfReader


def with_plan_view(url: str) -> str:
    parts = urlsplit(url)
    q = dict(parse_qsl(parts.query, keep_blank_values=True))
    q["view"] = "plan"
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(q), parts.fragment))


def fail(message: str) -> None:
    print(f"PRINT AUDIT FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    if len(sys.argv) < 2:
        fail("missing app URL")
    url = with_plan_view(sys.argv[1])
    out = Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/zenith-plan-print.pdf")
    out.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
        page.goto(url, wait_until="networkidle")
        page.wait_for_selector(".planner-week .planner-day")
        screen_out = out.with_name("zenith-plan-desktop.png")
        page.screenshot(path=str(screen_out), full_page=False)
        page.emulate_media(media="print")
        page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")

        meal_names = page.locator(".planner-week .planner-slot b").all_inner_texts()
        audit = page.evaluate(
            """() => {
              const cards = [...document.querySelectorAll('.planner-week .planner-day')];
              return cards.map((card, index) => {
                const r = card.getBoundingClientRect();
                const slots = [...card.querySelectorAll('.planner-slot')].map(el => {
                  const x = el.getBoundingClientRect();
                  return { left:x.left, right:x.right, top:x.top, bottom:x.bottom, width:x.width, height:x.height };
                });
                return { index, left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height, slots };
              });
            }"""
        )

        if len(audit) != 7:
            fail(f"expected 7 weekly day rows, found {len(audit)}")

        for day in audit:
            if day["width"] < 900:
                fail(f"day {day['index'] + 1} collapsed to {day['width']:.1f}px")
            slots = day["slots"]
            if len(slots) != 4:
                fail(f"day {day['index'] + 1} has {len(slots)} meal cells, expected 4")
            for i, slot in enumerate(slots):
                if slot["width"] < 150 or slot["height"] < 28:
                    fail(
                        f"day {day['index'] + 1} meal {i + 1} is unreadably small "
                        f"({slot['width']:.1f}x{slot['height']:.1f}px)"
                    )
            for a, b in zip(slots, slots[1:]):
                if a["right"] > b["left"] + 0.5:
                    fail(f"day {day['index'] + 1} meal cells overlap")

        for a, b in zip(audit, audit[1:]):
            if a["bottom"] > b["top"] + 0.5:
                fail(f"day rows {a['index'] + 1} and {b['index'] + 1} overlap")

        page.pdf(
            path=str(out),
            format="A4",
            landscape=True,
            print_background=True,
            margin={"top":"9mm","right":"9mm","bottom":"9mm","left":"9mm"},
            prefer_css_page_size=True,
        )
        browser.close()

    if not out.exists() or out.stat().st_size < 20_000:
        fail(f"generated PDF is missing or suspiciously small ({out.stat().st_size if out.exists() else 0} bytes)")

    reader = PdfReader(str(out))
    if not 1 <= len(reader.pages) <= 4:
        fail(f"weekly print generated {len(reader.pages)} pages; expected 1-4")
    all_pdf_text = "\n".join((pdf_page.extract_text() or "") for pdf_page in reader.pages)
    normalized_pdf = " ".join(all_pdf_text.split())
    for i, pdf_page in enumerate(reader.pages, start=1):
        text = (pdf_page.extract_text() or "").strip()
        if len(text) < 180:
            fail(f"page {i} is effectively blank ({len(text)} extracted characters)")

    # A browser can shrink an oversized horizontal grid to fit the sheet. The DOM
    # then looks wide enough, yet recipe names print one character per line. Verify
    # the PDF text itself still contains intact meal names.
    unique_names = []
    for name in meal_names:
        clean = " ".join(name.split())
        if clean and clean not in unique_names:
            unique_names.append(clean)
    intact = sum(1 for name in unique_names if name in normalized_pdf)
    required = min(8, max(4, len(unique_names) // 3))
    if intact < required:
        fail(f"only {intact}/{len(unique_names)} meal names survived intact in the PDF; expected at least {required}")

    print(
        f"Print audit PASS: 7 readable day rows, 4 meals/day, "
        f"{len(reader.pages)} nonblank PDF page(s), {intact}/{len(unique_names)} intact meal names, "
        f"{out.stat().st_size} bytes"
    )


if __name__ == "__main__":
    main()
