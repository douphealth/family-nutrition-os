#!/usr/bin/env python3
"""
ZENITH PRO v4 · screenshot capture
---------------------------------------------------------------------------
Renders the real app in headless Chromium and writes the docs/ screenshots.
Covers the seven views, the three persona briefs, the recipe sheet, Cook Mode
(light + dark), the shopping transparency block, and the dark theme.

Usage:
    python scripts/capture_shots.py [base_url] [out_dir]

Defaults: http://127.0.0.1:8137/index.html  ->  docs/
Requires: pip install playwright && playwright install chromium
"""

import os
import sys

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8137/index.html"
OUT = sys.argv[2] if len(sys.argv) > 2 else "docs"

VIEWS = [
    ("today", "screenshot-today.png"),
    ("plan", "screenshot-plan.png"),
    ("meals", "screenshot-meals.png"),
    ("shopping", "screenshot-shopping.png"),
    ("progress", "screenshot-progress.png"),
    ("family", "screenshot-family.png"),
    ("guide", "screenshot-guide.png"),
]

os.makedirs(OUT, exist_ok=True)


def settle(page, ms=700):
    page.wait_for_timeout(ms)


def dismiss_overlays(page):
    """Close any open sheet and dismiss the onboarding card."""
    page.evaluate(
        """() => {
            document.querySelectorAll('[data-act="closeSheet"]').forEach(b => b.click());
            document.querySelector('[data-act="dismissOnboarding"]')?.click();
        }"""
    )
    page.wait_for_timeout(250)


def seed(page):
    """Log a meal and some water so the Today view looks alive, not empty."""
    page.evaluate("""() => document.querySelector('[data-act="meal"][data-portion]')?.click()""")
    page.wait_for_timeout(350)
    page.evaluate(
        """() => {
            const glasses = document.querySelectorAll('[data-act="water"][data-set]');
            glasses[3]?.click();
        }"""
    )
    page.wait_for_timeout(350)


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=2)

    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)[:200]))

    # ── 1. Today (seeded) ────────────────────────────────────────────────
    page.goto(f"{BASE}?view=today", wait_until="networkidle", timeout=45000)
    settle(page, 1200)
    dismiss_overlays(page)
    seed(page)
    dismiss_overlays(page)
    page.screenshot(path=os.path.join(OUT, "screenshot-today.png"))
    print("captured: today")

    # ── 2. Remaining views ───────────────────────────────────────────────
    for view, filename in VIEWS[1:]:
        page.evaluate(
            """(v) => document.querySelector(`#sideNav [data-act="nav"][data-view="${v}"]`)?.click()""",
            view,
        )
        settle(page, 800)
        dismiss_overlays(page)
        if view == "shopping":
            # check a few items so the progress bar is meaningful
            page.evaluate(
                """() => {
                    const items = [...document.querySelectorAll('[data-act="shop"][data-key]')];
                    items.slice(0, 3).forEach(i => i.click());
                }"""
            )
            settle(page, 600)
        page.screenshot(path=os.path.join(OUT, filename))
        print(f"captured: {view}")

    # ── 2a. Shopping transparency block ──────────────────────────────────
    # The "why these quantities" disclosure sits at the bottom of the list, so
    # it needs its own scrolled capture to be reviewable.
    page.evaluate(
        """() => document.querySelector('#sideNav [data-act="nav"][data-view="shopping"]')?.click()"""
    )
    settle(page, 600)
    page.evaluate("""() => { const d = document.querySelector('details.why'); if (d) d.open = true; }""")
    settle(page, 300)
    page.evaluate("""() => document.querySelector('details.why')?.scrollIntoView({block: 'center'})""")
    settle(page, 400)
    page.screenshot(path=os.path.join(OUT, "screenshot-shopping-why.png"))
    print("captured: shopping transparency")

    # ── 2b. Persona views for the three named users ──────────────────────
    page.evaluate(
        """() => document.querySelector('#sideNav [data-act="nav"][data-view="today"]')?.click()"""
    )
    settle(page, 700)
    # All FOUR members. The father was missing here too, which is how the README
    # came to describe a household of three while data.js modelled four.
    for member_id, filename in [
        ("mother", "screenshot-persona-mother.png"),
        ("father", "screenshot-persona-father.png"),
        ("son", "screenshot-persona-son.png"),
        ("daughter", "screenshot-persona-daughter.png"),
    ]:
        page.evaluate(
            """(m) => document.querySelector(`#memberStrip [data-act="member"][data-id="${m}"]`)?.click()""",
            member_id,
        )
        settle(page, 800)
        dismiss_overlays(page)
        page.evaluate("window.scrollTo(0, 0)")
        settle(page, 300)
        page.screenshot(path=os.path.join(OUT, filename))
        print(f"captured: persona {member_id}")

    # ── 3. Recipe sheet (light) ──────────────────────────────────────────
    page.evaluate(
        """() => document.querySelector('#sideNav [data-act="nav"][data-view="meals"]')?.click()"""
    )
    settle(page, 700)
    page.evaluate("""() => document.querySelector('[data-act="recipe"][data-id]')?.click()""")
    settle(page, 800)
    page.screenshot(path=os.path.join(OUT, "screenshot-recipe.png"))
    print("captured: recipe sheet")

    # ── 3b. Cook Mode ────────────────────────────────────────────────────
    page.evaluate("""() => document.querySelector('[data-act="cook"]')?.click()""")
    settle(page, 900)
    page.screenshot(path=os.path.join(OUT, "screenshot-cook.png"))
    print("captured: cook mode")

    # ── 4. Recipe sheet (dark) — shows per-member portion scaling ────────
    page.evaluate("""() => document.getElementById('themeBtn')?.click()""")
    settle(page, 600)
    page.screenshot(path=os.path.join(OUT, "screenshot-cook-dark.png"))
    print("captured: cook mode (dark)")

    # ── 5. Dark theme, main view ─────────────────────────────────────────
    page.keyboard.press("Escape")  # the sheet closes on Escape
    settle(page, 500)
    if page.evaluate("""() => !!document.getElementById('sheet')?.classList.contains('is-open')"""):
        page.evaluate("""() => document.querySelector('[data-act="closeSheet"]')?.click()""")
        settle(page, 400)
    page.evaluate(
        """() => document.querySelector('#sideNav [data-act="nav"][data-view="progress"]')?.click()"""
    )
    settle(page, 900)
    page.screenshot(path=os.path.join(OUT, "screenshot-dark.png"))
    print("captured: dark theme")

    browser.close()

if errors:
    print("\npage errors:", errors)
    sys.exit(1)
print("\nscreenshots written to", os.path.abspath(OUT))
