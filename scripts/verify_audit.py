#!/usr/bin/env python3
"""
ZENITH PRO · prove the layout audit can actually fail
---------------------------------------------------------------------------
A test that cannot fail is worse than no test, because it buys false
confidence. This one did not fail for a release: its overflow assertion
compared `documentElement.scrollWidth` to `window.innerWidth`, and under
Playwright's `is_mobile=True` the layout viewport grows to fit the overflow —
so both numbers inflated together and `405 <= 405` passed while the page
scrolled sideways.

This script injects a deliberately too-wide element into the real app and
fails if the audit's own probe does not notice. It imports the probe from
audit_probe.py rather than restating it, so it tests the real assertion and
cannot drift away from it.

Usage:
    python scripts/verify_audit.py [base_url]

Defaults: http://127.0.0.1:8137/index.html
Requires: pip install playwright && playwright install chromium
"""

import sys

from playwright.sync_api import sync_playwright

from audit_probe import overflow_failure, overflow_report

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8137/index.html"
PHONE = {"width": 390, "height": 844}
TOUCH = {"has_touch": True, "is_mobile": True, "device_scale_factor": 2}

INJECT = """() => {
    const d = document.createElement('div');
    d.className = 'audit-selftest-boom';
    d.style.width = '900px';
    d.style.height = '20px';
    document.querySelector('.content').appendChild(d);
}"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport=PHONE, **TOUCH)
    page.goto(BASE)
    page.wait_for_timeout(1400)
    page.evaluate("""() => document.querySelector('[data-act="dismissOnboarding"]')?.click()""")
    page.wait_for_timeout(400)

    clean = overflow_report(page)
    clean_failure = overflow_failure(clean)

    page.evaluate(INJECT)
    page.wait_for_timeout(250)
    broken = overflow_report(page)
    broken_failure = overflow_failure(broken)

    browser.close()

print(f"  clean page  : scroll={clean['scroll']} vw={clean['vw']} -> "
      f"{'FAIL' if clean_failure else 'pass'}")

# 1. The probe must not report a clean page as broken — otherwise it would be
#    ignored the first time it cried wolf.
ok_clean = clean_failure is None

# 2. The probe must catch a real overflow.
ok_broken = broken_failure is not None

# 3. It must name the offender, so a failure is actionable rather than a
#    number the reader has to go hunting for.
ok_named = any("audit-selftest-boom" in b for b in broken["bad"])

# 4. The assertion must not be tautological: the page really did start
#    scrolling sideways, and the probe noticed.
ok_moved = broken["scroll"] > clean["scroll"]

for ok, msg in [
    (ok_clean, "a clean page passes"),
    (ok_broken, f"an overflowing page fails ({broken['scroll']} > {broken['vw']})"),
    (ok_named, f"the failure names the offender ({broken['bad']})"),
    (ok_moved, "the probe is not tautological"),
]:
    print(f"  {'ok  ' if ok else 'FAIL'} {msg}")

if ok_clean and ok_broken and ok_named and ok_moved:
    print("\nAUDIT SELF-TEST: PASS")
    sys.exit(0)
print("\nAUDIT SELF-TEST: FAIL -- the layout audit may be unable to fail")
sys.exit(1)
