#!/usr/bin/env python3
"""
ZENITH PRO · shared layout-audit probes
---------------------------------------------------------------------------
The mobile layout audit and its self-test must agree on what "no horizontal
overflow" means, so the probe lives here rather than inline in either of them.
If it lived in only one, the self-test would be checking a copy that could
drift away from the real assertion — which is exactly the failure mode it
exists to prevent.
"""

# WCAG 2.5.8 target size (minimum) is 24px; 36 is a comfortable thumb target.
MIN_TAP = 36

# ---------------------------------------------------------------------------
# Horizontal overflow.
#
# Compare `documentElement.scrollWidth` against `documentElement.clientWidth`,
# NOT `window.innerWidth`.
#
# Under Playwright's `is_mobile=True` the layout viewport *grows* to fit the
# overflow, so `innerWidth` reports the inflated width and the comparison
# becomes `405 <= 405` — a tautology that passes while the page scrolls
# sideways. `clientWidth` stays pinned to the visual viewport. This assertion
# shipped tautological once; `verify_audit.py` now fails the build if it ever
# becomes tautological again.
#
# An element is only innocent if a *clipping* ancestor swallows its overflow.
# `.filters` and `.meal-actions` are flex-wrap containers, not scroll
# containers, so they are deliberately not exempt.
# ---------------------------------------------------------------------------
OVERFLOW_JS = """() => {
    const de = document.documentElement;
    const vw = de.clientWidth;
    const clipped = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const ox = getComputedStyle(p).overflowX;
            if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
        }
        return false;
    };
    const bad = [];
    for (const el of document.querySelectorAll('body *')) {
        if (getComputedStyle(el).position === 'fixed') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > vw + 1 && !clipped(el)) {
            bad.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}:+${Math.round(r.right - vw)}px`);
        }
    }
    return { scroll: de.scrollWidth, vw, bad: [...new Set(bad)].slice(0, 4) };
}"""


def overflow_report(page):
    """Return the raw overflow measurement for the page's current state."""
    return page.evaluate(OVERFLOW_JS)


def overflow_failure(report):
    """Return a failure string if the page scrolls sideways, else None."""
    if report["scroll"] <= report["vw"] + 1:
        return None
    detail = f" (widest: {', '.join(report['bad'])})" if report["bad"] else ""
    return f"horizontal overflow: {report['scroll']} > {report['vw']}{detail}"
