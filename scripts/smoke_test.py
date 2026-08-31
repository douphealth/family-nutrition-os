#!/usr/bin/env python3
"""Headless smoke test for ZENITH PRO using Playwright."""
import sys, json
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8137/index.html"
errors = []
page_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.on("console", lambda m: errors.append(f"[{m.type}] {m.text[:200]}") if m.type in ("error",) else None)
    page.on("pageerror", lambda e: page_errors.append(str(e)[:300]))
    page.goto(URL, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)

    result = {}
    result["title"] = page.title()
    result["view_ready"] = page.evaluate("document.getElementById('view')?.getAttribute?.('data-ready')")
    result["view_text_head"] = page.evaluate("document.getElementById('view')?.innerText?.slice(0,150)")
    result["fatal_display"] = page.evaluate("(function(){var f=document.getElementById('fatal');return f?getComputedStyle(f).display:'no-el';})()")
    result["dock_tabs"] = page.evaluate("[...document.querySelectorAll('.dock button')].map(b=>b.innerText)")
    result["has_canvas"] = page.evaluate("!!document.getElementById('fx')")
    result["console_errors"] = errors
    result["page_errors"] = page_errors

    # --- Flow: switch tabs ---
    tabs = {}
    for t in ["nutrition", "fitness", "planner", "analytics", "family"]:
        try:
            page.evaluate(f"go('{t}')")
            page.wait_for_timeout(400)
            tabs[t] = page.evaluate("document.getElementById('view')?.innerText?.slice(0,80)")
        except Exception as e:
            tabs[t] = f"ERR: {e}"
    result["tabs"] = tabs

    # --- Flow: toggle a meal on dashboard ---
    page.evaluate("go('dashboard')")
    page.wait_for_timeout(300)
    meal_click = page.evaluate("(function(){var el=document.querySelector('[data-act=\"meal\"]');if(!el)return 'no-meal-btn';el.click();return 'clicked';})()")
    page.wait_for_timeout(400)
    result["meal_click"] = meal_click
    result["after_meal_view_head"] = page.evaluate("document.getElementById('view')?.innerText?.slice(0,80)")

    # --- Flow: open settings modal ---
    page.evaluate("Settings.open()")
    page.wait_for_timeout(300)
    result["settings_open"] = page.evaluate("document.getElementById('setModal')?.classList.contains('open')")
    result["settings_rows"] = page.evaluate("[...document.querySelectorAll('#setBody .set-row b')].map(b=>b.innerText)")

    # --- Flow: shopping list modal ---
    page.evaluate("Shopping.open()") if page.evaluate("typeof Shopping!=='undefined'") else None
    page.wait_for_timeout(300)
    result["sm_modal_open"] = page.evaluate("document.getElementById('smModal')?.classList.contains('open')")
    result["sm_items"] = page.evaluate("[...document.querySelectorAll('#smBody .smcheck, #smBody .srow, #smBody [class*=srow], #smBody li')].map(b=>b.innerText).slice(0,8)")

    # --- SW registration check ---
    result["sw_registered"] = page.evaluate("navigator.serviceWorker? 'supported':'no-sw'")

    result["final_errors"] = errors
    result["final_page_errors"] = page_errors
    browser.close()

print(json.dumps(result, ensure_ascii=False, indent=2))
