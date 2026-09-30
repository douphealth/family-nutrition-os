#!/usr/bin/env python3
"""
ZENITH PRO · screenshot generator
---------------------------------------------------------------------------
Renders the real app in Chromium and writes

  docs/*.webp               the README gallery (desktop and phone, light and dark)
  assets/screenshot-*.png   the install-dialog screenshots named in manifest.webmanifest
  assets/og-image.png       the 1200x630 social card advertised in index.html

The app is filled in through its own controls first (weigh-ins, meals, water,
ticked shopping items), so charts, streaks and progress are shown in use rather
than empty.

    python scripts/capture_shots.py [base_url]

Defaults to http://127.0.0.1:8137/index.html (npm run serve). Needs Playwright
and Pillow.
"""

import base64
import glob
import io
import os
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

from _audit_states import close_sheet, go, js_click, log_today, prepare, seed_progress
from _browser import launch, utf8_output

utf8_output()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8137/index.html"
DOCS = os.path.join(ROOT, "docs")
ASSETS = os.path.join(ROOT, "assets")
os.makedirs(DOCS, exist_ok=True)

for stale in glob.glob(os.path.join(DOCS, "*.png")) + glob.glob(os.path.join(DOCS, "*.webp")):
    os.remove(stale)


def png(page):
    page.evaluate("window.scrollTo({ top: 0, behavior: 'instant' })")
    page.evaluate("document.querySelector('#toastClose')?.click()")
    page.wait_for_timeout(350)
    return page.screenshot(type="png")


def save_webp(data, name):
    Image.open(io.BytesIO(data)).convert("RGB").save(os.path.join(DOCS, name), "WEBP", quality=88, method=6)
    print("  docs/" + name)


def save_png(data, path):
    with open(path, "wb") as f:
        f.write(data)
    print("  " + os.path.relpath(path, ROOT).replace(os.sep, "/"))


def fresh(browser, viewport, scheme, mobile, scale):
    ctx = browser.new_context(
        viewport=viewport, is_mobile=mobile, has_touch=mobile, device_scale_factor=scale,
        color_scheme=scheme, reduced_motion="reduce", locale="el-GR", timezone_id="Europe/Athens", service_workers="block",
    )
    prepare(ctx)
    page = ctx.new_page()
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(600)
    js_click(page, '[data-act="dismissOnboarding"]')
    js_click(page, '[data-act="member"][data-id="son"]')       # the teenage athlete: the most complete brief
    seed_progress(page)
    log_today(page, meals=2)                                    # breakfast and lunch done: the hero shows what to eat next
    go(page, "shopping")
    for _ in range(3):
        js_click(page, '#view [data-act="shop"][aria-pressed="false"]', 250)
    return ctx, page


def recipe_and_cook(page, prefix, save):
    go(page, "meals")
    js_click(page, '#view [data-act="recipe"][data-id]', 700)
    save(page.screenshot(type="png"), f"{prefix}-recipe.webp")
    js_click(page, '#sheet [data-act="cook"]', 700)
    save(page.screenshot(type="png"), f"{prefix}-cook.webp")
    close_sheet(page)


with sync_playwright() as p:
    browser = launch(p)
    shots = {}

    # ── desktop, light ───────────────────────────────────────────────────────
    print("desktop · light")
    ctx, page = fresh(browser, {"width": 1440, "height": 900}, "light", False, 1)
    for view in ("today", "plan", "meals", "shopping", "progress", "family", "guide"):
        go(page, view)
        shots[f"desktop-{view}"] = png(page)
        save_webp(shots[f"desktop-{view}"], f"desktop-{view}.webp")
    recipe_and_cook(page, "desktop", save_webp)
    ctx.close()

    # ── desktop, dark ────────────────────────────────────────────────────────
    print("desktop · dark")
    ctx, page = fresh(browser, {"width": 1440, "height": 900}, "dark", False, 1)
    for view in ("today", "meals", "shopping"):
        go(page, view)
        save_webp(png(page), f"desktop-dark-{view}.webp")
    ctx.close()

    # ── phone, light ─────────────────────────────────────────────────────────
    print("phone · light")
    ctx, page = fresh(browser, {"width": 390, "height": 844}, "light", True, 2)
    for view in ("today", "plan", "meals", "shopping", "progress"):
        go(page, view)
        shots[f"phone-{view}"] = png(page)
        save_webp(shots[f"phone-{view}"], f"phone-{view}.webp")
    recipe_and_cook(page, "phone", save_webp)
    ctx.close()

    # ── phone, dark ──────────────────────────────────────────────────────────
    print("phone · dark")
    ctx, page = fresh(browser, {"width": 390, "height": 844}, "dark", True, 2)
    for view in ("today", "shopping"):
        go(page, view)
        save_webp(png(page), f"phone-dark-{view}.webp")
    ctx.close()

    # ── install-dialog screenshots (manifest.webmanifest) ────────────────────
    print("install screenshots")
    ctx, page = fresh(browser, {"width": 1280, "height": 720}, "light", False, 1)
    go(page, "today")
    save_png(png(page), os.path.join(ASSETS, "screenshot-wide.png"))
    ctx.close()
    save_png(shots["phone-today"], os.path.join(ASSETS, "screenshot-narrow.png"))

    # ── social card ──────────────────────────────────────────────────────────
    print("social card")
    b64 = lambda data: base64.b64encode(data).decode("ascii")
    card = f"""
    <div style="position:fixed;inset:0;overflow:hidden;font-family:var(--font);color:#fff;
      background:radial-gradient(1000px 620px at 88% 8%,rgba(95,227,178,.5),transparent 62%),
                 radial-gradient(800px 520px at 6% 112%,rgba(245,184,74,.26),transparent 60%),
                 linear-gradient(135deg,#06573A 0%,#0B7A4B 55%,#08553A 100%)">
      <div style="position:absolute;left:64px;top:54px;display:flex;align-items:center;gap:18px">
        <img src="assets/icon.svg" width="68" height="68" alt="" style="border-radius:17px;box-shadow:0 10px 30px rgba(0,0,0,.35)">
        <div style="font-size:28px;font-weight:800;letter-spacing:.14em">ZENITH <span style="color:#5FE3B2">PRO</span></div>
      </div>
      <div style="position:absolute;left:64px;top:180px;width:560px">
        <div style="font-size:64px;line-height:1.06;font-weight:800;letter-spacing:-.03em">Ένα μενού.<br>Μερίδα για τον καθένα.</div>
        <div style="margin-top:22px;font-size:25px;line-height:1.42;opacity:.92">Πλάνο 28 ημερών, λίστα αγορών και καταγραφή — εκτός σύνδεσης, χωρίς λογαριασμό.</div>
      </div>
      <div style="position:absolute;left:64px;bottom:48px;display:flex;gap:12px;font-size:18px;font-weight:650">
        <span style="padding:9px 16px;border-radius:999px;background:rgba(255,255,255,.16)">USDA · EFSA · ΠΟΥ</span>
        <span style="padding:9px 16px;border-radius:999px;background:rgba(255,255,255,.16)">Ιδιωτικό από προεπιλογή</span>
      </div>
      <img alt="" src="data:image/png;base64,{b64(shots['desktop-today'])}" style="position:absolute;left:668px;top:78px;width:620px;border-radius:16px;box-shadow:0 40px 80px rgba(0,0,0,.45);transform:rotate(-2deg)">
      <img alt="" src="data:image/png;base64,{b64(shots['phone-today'])}" style="position:absolute;left:600px;top:236px;width:224px;border-radius:30px;border:6px solid #0D1A13;box-shadow:0 30px 60px rgba(0,0,0,.5)">
    </div>"""
    ctx = browser.new_context(viewport={"width": 1200, "height": 630}, device_scale_factor=1, locale="el-GR", service_workers="block")
    page = ctx.new_page()
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(500)
    page.evaluate("(html) => { document.body.className = ''; document.body.style.cssText = 'margin:0;background:#0B7A4B'; document.body.innerHTML = html; }", card)
    page.wait_for_timeout(600)
    save_png(page.screenshot(type="png"), os.path.join(ASSETS, "og-image.png"))
    ctx.close()
    browser.close()

print("done")
