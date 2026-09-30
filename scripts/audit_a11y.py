#!/usr/bin/env python3
"""
ZENITH PRO · accessibility audit (axe-core)
---------------------------------------------------------------------------
Runs the axe-core rule engine — WCAG 2.0/2.1/2.2 A and AA plus best practice —
against the real app in a real Chromium, on a phone and on a desktop, in light and
dark, at every state listed in _audit_states.py (first run, every view for an adult
and for the teenage athlete, with and without data, and each overlay). It fails on
any violation.

axe cannot decide colour contrast where text sits on a gradient or a tint; those
nodes come back as "incomplete". audit_contrast.py measures them from rendered
pixels, so the two together leave nothing to manual review.

A note on injection: the app ships a strict Content-Security-Policy, which
(correctly) blocks a <script> tag added to the page. axe is therefore evaluated
through the DevTools protocol, which is not subject to the page's CSP — the audit
does not need the policy loosened.

    npm install            # provides node_modules/axe-core
    python scripts/audit_a11y.py [base_url] [--quick]

Exit status is non-zero if anything fails, so it can gate a release.
"""

import json
import os
import sys

from playwright.sync_api import sync_playwright

from _audit_states import prepare, visit
from _browser import launch, utf8_output

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AXE = os.path.join(ROOT, "node_modules", "axe-core", "axe.min.js")

utf8_output()

args = [a for a in sys.argv[1:] if not a.startswith("--")]
BASE = args[0] if args else "http://127.0.0.1:8137/index.html"
QUICK = "--quick" in sys.argv

VIEWPORTS = [("phone", {"width": 390, "height": 844}, True), ("desktop", {"width": 1440, "height": 900}, False)]
SCHEMES = ["light", "dark"]

RULES = {
    "runOnly": {"type": "tag", "values": ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]},
    "resultTypes": ["violations", "incomplete"],
}

failures = []
incompletes = {}
runs = 0


def make_scan(page):
    def scan(label):
        global runs
        runs += 1
        result = page.evaluate("(rules) => axe.run(document, rules).then(r => ({v: r.violations, i: r.incomplete}))", RULES)
        for v in result["v"]:
            nodes = [n["target"][-1] if n["target"] else "?" for n in v["nodes"]][:4]
            detail = f"{label}: [{v.get('impact')}] {v['id']} — {v['help']} ({len(v['nodes'])} node(s): {', '.join(nodes)})"
            failures.append(detail)
            print("  FAIL", detail)
        for i in result["i"]:
            incompletes[i["id"]] = incompletes.get(i["id"], 0) + len(i["nodes"])
    return scan


with sync_playwright() as p:
    browser = launch(p)
    axe_source = open(AXE, encoding="utf-8").read()
    for vp_name, viewport, mobile in VIEWPORTS:
        for scheme in SCHEMES:
            tag = f"{vp_name}/{scheme}"
            ctx = browser.new_context(
                viewport=viewport, is_mobile=mobile, has_touch=mobile, device_scale_factor=1,
                color_scheme=scheme, locale="el-GR", timezone_id="Europe/Athens", service_workers="block",
            )
            prepare(ctx)
            page = ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" and "Service Worker" not in m.text and "sw registration" not in m.text else None)
            foreign = []
            origin = BASE.split("/index.html")[0]
            page.on("request", lambda r: foreign.append(r.url) if not r.url.startswith(("http://127.0.0.1", "http://localhost", "data:", "blob:", origin)) else None)
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(600)
            page.evaluate(axe_source)

            before = runs
            visit(page, tag, QUICK, make_scan(page))

            if errors:
                failures.append(f"{tag}: console/page errors: {errors[:3]}")
                print("  FAIL console errors:", errors[:3])
            if foreign:
                failures.append(f"{tag}: requests to a foreign origin: {sorted(set(foreign))[:3]}")
                print("  FAIL foreign requests:", sorted(set(foreign))[:3])
            print(f"  ok   {tag}: scanned {runs - before} states")
            ctx.close()
    browser.close()

print(f"\naxe scans run: {runs}")
if incompletes:
    print("undecided by axe (text over gradients/tints — measured by audit_contrast.py):", json.dumps(incompletes, ensure_ascii=False))
if failures:
    print(f"\nA11Y AUDIT: FAIL ({len(failures)} finding(s))")
    sys.exit(1)
print("A11Y AUDIT: PASS")
