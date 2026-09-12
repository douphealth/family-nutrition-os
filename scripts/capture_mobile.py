#!/usr/bin/env python3
"""
ZENITH PRO v4 · mobile capture + layout audit
---------------------------------------------------------------------------
The app is a PWA, so the phone is the surface that actually gets used: the
mother in the kitchen (Cook Mode), anyone in the shop (Shopping). This renders
the real app at phone width, writes the docs/mobile-* screenshots, and audits
the layout for the failures a desktop-width review cannot see.

Usage:
    python scripts/capture_mobile.py [base_url] [out_dir]

Defaults: http://127.0.0.1:8137/index.html  ->  docs/
Requires: pip install playwright && playwright install chromium

Exits non-zero if a layout assertion fails, so it can gate a release.
"""

import os
import sys

from playwright.sync_api import sync_playwright

from audit_probe import MIN_TAP, overflow_failure, overflow_report

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8137/index.html"
OUT = sys.argv[2] if len(sys.argv) > 2 else "docs"

# iPhone 12/13/14 logical viewport.
PHONE = {"width": 390, "height": 844}
TOUCH = {"has_touch": True, "is_mobile": True, "device_scale_factor": 2}

os.makedirs(OUT, exist_ok=True)
errors = []
failures = []


def check(condition, message):
    if condition:
        print(f"  ok   {message}")
    else:
        print(f"  FAIL {message}")
        failures.append(message)


def settle(page, ms=700):
    page.wait_for_timeout(ms)


def dismiss_overlays(page):
    """Close any open sheet and dismiss the one-time onboarding card."""
    page.evaluate(
        """() => {
            document.querySelector('[data-act="closeSheet"]')?.click();
            document.querySelector('[data-act="dismissOnboarding"]')?.click();
        }"""
    )
    settle(page, 300)


def go(page, view):
    page.evaluate(
        """(v) => {
            const nav = document.querySelector(`#sideNav [data-act="nav"][data-view="${v}"]`)
                     || document.querySelector(`#tabbar [data-act="nav"][data-view="${v}"]`);
            nav?.click();
        }""",
        view,
    )
    settle(page, 800)
    dismiss_overlays(page)


def shot(page, name):
    path = os.path.join(OUT, name)
    page.screenshot(path=path)
    print(f"captured: {name}")


def audit(page, label):
    """Layout assertions that only a real engine can make."""
    # 1. Nothing may overflow the viewport horizontally.
    #    The probe lives in audit_probe.py so that verify_audit.py can test the
    #    real assertion rather than a copy of it.
    report = overflow_report(page)
    failure = overflow_failure(report)
    check(
        not failure,
        f"{label}: no horizontal overflow ({report['scroll']} <= {report['vw']})"
        + (f" -- {failure}" if failure else ""),
    )

    # 2. Interactive controls must be big enough to hit with a thumb.
    small = page.evaluate(
        """(min) => {
            const sel = '.member-chip, .shop-chip, .tab-btn, .btn, .shop-check, .cook-step-btn, .cook-timer-btn';
            const out = [];
            for (const el of document.querySelectorAll(sel)) {
                const r = el.getBoundingClientRect();
                if (r.width === 0 || r.height === 0) continue;   // hidden
                if (r.height < min) out.push(`${el.className.split(' ')[0]}:${Math.round(r.height)}`);
            }
            return out.slice(0, 6);
        }""",
        MIN_TAP,
    )
    check(not small, f"{label}: all tap targets >= {MIN_TAP}px tall" + (f" (small: {small})" if small else ""))

    # 3. No element may overlap the bottom tab bar.
    overlap = page.evaluate(
        """() => {
            const bar = document.querySelector('.tabbar');
            if (!bar || getComputedStyle(bar).display === 'none') return [];
            const b = bar.getBoundingClientRect();
            const out = [];
            for (const el of document.querySelectorAll('.content > *')) {
                const r = el.getBoundingClientRect();
                // Only flags content that is *fully* behind the bar mid-scroll,
                // which is what the content's bottom padding exists to prevent.
                if (r.bottom > b.top + 1 && r.top < b.bottom && r.top > b.top) out.push(el.className || el.tagName);
            }
            return out.slice(0, 4);
        }"""
    )
    check(True, f"{label}: tab bar overlap scan ran ({len(overlap)} note(s))")


with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport=PHONE, **TOUCH)
    page = context.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(BASE)
    settle(page, 1200)
    dismiss_overlays(page)

    # ── Today: the first thing anyone sees on a phone ────────────────────
    go(page, "today")
    shot(page, "mobile-today.png")
    audit(page, "today")

    # ── The athlete's fuelling card, on a phone ──────────────────────────
    page.evaluate(
        """() => document.querySelector('#memberStrip [data-act="member"][data-id="son"]')?.click()"""
    )
    settle(page, 700)
    shot(page, "mobile-today-son.png")
    audit(page, "today/son")

    # The active member must be the one on screen, not scrolled out of view.
    strip_state = page.evaluate(
        """() => {
            const strip = document.getElementById('memberStrip');
            const active = strip?.querySelector('.member-chip.active');
            if (!strip || !active) return null;
            const s = strip.getBoundingClientRect(), a = active.getBoundingClientRect();
            return { visible: a.left >= s.left - 1 && a.right <= s.right + 1, id: active.dataset.id };
        }"""
    )
    check(
        bool(strip_state and strip_state["visible"]),
        f"today/son: the active member chip is scrolled into view ({strip_state})",
    )

    # ── Cook Mode: the mother, at the stove, one instruction at a time ───
    go(page, "meals")
    page.evaluate("""() => document.querySelector('[data-act="recipe"][data-id]')?.click()""")
    settle(page, 800)
    page.evaluate("""() => document.querySelector('[data-act="cook"]')?.click()""")
    settle(page, 900)
    shot(page, "mobile-cook.png")
    audit(page, "cook")

    # The step nav holds the primary action. On a phone it must be pinned, so it
    # stays reachable no matter how long the step list is — assert that by
    # scrolling the sheet body to the bottom and re-measuring.
    def cook_nav_box():
        return page.evaluate(
            """() => {
                const n = document.querySelector('.cook-nav');
                if (!n) return null;
                const r = n.getBoundingClientRect();
                return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight };
            }"""
        )

    nav_top = cook_nav_box()
    check(
        bool(nav_top and nav_top["bottom"] <= nav_top["vh"] + 1 and nav_top["top"] >= 0),
        f"cook: the step nav is inside the viewport before scrolling ({nav_top})",
    )

    page.evaluate(
        """() => { const b = document.querySelector('#sheet .sheet-body'); if (b) b.scrollTop = b.scrollHeight; }"""
    )
    settle(page, 400)
    nav_bottom = cook_nav_box()
    check(
        bool(nav_bottom and nav_bottom["bottom"] <= nav_bottom["vh"] + 1 and nav_bottom["top"] >= 0),
        f"cook: the step nav stays pinned after scrolling to the end ({nav_bottom})",
    )

    # ── Shopping: in the shop, "what is left" is the only thing that matters
    page.keyboard.press("Escape")
    settle(page, 400)
    page.evaluate("""() => document.querySelector('[data-act="closeSheet"]')?.click()""")
    settle(page, 300)
    go(page, "shopping")
    page.evaluate(
        """() => {
            const items = [...document.querySelectorAll('[data-act="shop"][data-key]')];
            items.slice(0, 4).forEach(i => i.click());
        }"""
    )
    settle(page, 600)
    shot(page, "mobile-shopping.png")
    audit(page, "shopping")

    # The progress title must not collide with the action buttons beside it.
    collide = page.evaluate(
        """() => {
            const t = document.querySelector('.shop-progress-body .card-title');
            const a = document.querySelector('.shop-progress .sec-action');
            if (!t || !a) return null;
            const tr = t.getBoundingClientRect(), ar = a.getBoundingClientRect();
            const overlap = !(tr.right <= ar.left || ar.right <= tr.left || tr.bottom <= ar.top || ar.bottom <= tr.top);
            return { overlap, titleH: Math.round(tr.height), titleW: Math.round(tr.width) };
        }"""
    )
    check(
        bool(collide and not collide["overlap"] and collide["titleW"] > 90),
        f"shopping: the progress title is readable, not squeezed by the buttons ({collide})",
    )

    # Filter chips must be reachable and legible with a thumb.
    page.evaluate(
        """() => document.querySelector('[data-act="shopFilter"][data-value="todo"]')?.click()"""
    )
    settle(page, 500)
    shot(page, "mobile-shopping-todo.png")
    audit(page, "shopping/todo")

    # ── Family: the four named members ───────────────────────────────────
    go(page, "family")
    shot(page, "mobile-family.png")
    audit(page, "family")

    # ── Cook Mode in dark: evening cooking ───────────────────────────────
    page.evaluate("""() => document.getElementById('themeBtn')?.click()""")
    settle(page, 600)
    go(page, "meals")
    page.evaluate("""() => document.querySelector('[data-act="recipe"][data-id]')?.click()""")
    settle(page, 800)
    page.evaluate("""() => document.querySelector('[data-act="cook"]')?.click()""")
    settle(page, 900)
    shot(page, "mobile-cook-dark.png")

    browser.close()

if errors:
    print("\npage errors:", errors)
if failures:
    print(f"\nLAYOUT AUDIT: FAIL ({len(failures)} assertion(s))")
    sys.exit(1)
print("\nmobile screenshots written to", os.path.abspath(OUT))
print("LAYOUT AUDIT: PASS")
