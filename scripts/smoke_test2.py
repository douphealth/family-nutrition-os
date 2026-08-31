#!/usr/bin/env python3
"""Second-pass smoke test: shopping modal + meal state + reminder + backup."""
import json
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8137/index.html"
errors, perr = [], []

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1280, "height": 900})
    page.on("console", lambda m: errors.append(m.text[:160]) if m.type == "error" else None)
    page.on("pageerror", lambda e: perr.append(str(e)[:300]))
    page.goto(URL, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1200)

    r = {}
    # Shopping modal (object = Super)
    r["super_exists"] = page.evaluate("typeof Super")
    page.evaluate("Super.open()")
    page.wait_for_timeout(350)
    r["sm_open"] = page.evaluate("document.getElementById('smModal')?.classList.contains('open')")
    r["sm_items"] = page.evaluate("[...document.querySelectorAll('#smBody *')].filter(e=>(e.innerText||'').trim()&&e.children.length===0).map(e=>e.innerText.trim()).slice(0,12)")
    page.evaluate("ovClose('smModal')")

    # Meal toggle: count meals before/after, check state write + localStorage
    before = page.evaluate("(function(){var lg=logOf();return JSON.stringify(lg.meals);})()")
    page.evaluate("(function(){var el=document.querySelector('[data-act=\"meal\"]');if(el)el.click();})()")
    page.wait_for_timeout(400)
    after = page.evaluate("(function(){var lg=logOf();return JSON.stringify(lg.meals);})()")
    r["meal_before"] = before
    r["meal_after"] = after

    # localStorage: main key + backup ring present?
    r["ls_main"] = page.evaluate("localStorage.getItem('ZENITH_PRO_V13') ? 'present' : 'missing'")
    r["ls_bak"] = page.evaluate("(function(){var b=localStorage.getItem('ZENITH_PRO_BAK');if(!b)return 'missing';var ring=JSON.parse(b);return 'ring:'+ring.length;})()")

    # Reminder toggle: click should attempt Notification permission (denied in headless) -> stays off but no crash
    page.evaluate("Settings.open()")
    page.wait_for_timeout(200)
    r["remind_row"] = page.evaluate("[...document.querySelectorAll('#setBody .set-row b')].some(b=>b.innerText.includes('Υπενθύμιση'))")

    # Backup export: clicking triggers a download
    with page.expect_download(timeout=4000) as dl:
        try:
            page.evaluate("Backup.export()")
            r["backup_download"] = "triggered"
        except Exception as e:
            r["backup_download"] = f"no-download: {e}"
    try:
        d = dl.value
        r["backup_filename"] = d.suggested_filename
        r["backup_bytes"] = len(d.path().read_bytes()) if d.path() else 0
    except Exception as e:
        r["backup_filename"] = "n/a"

    # Deep-link: ?tab=planner opens planner directly
    page.goto(URL + "?tab=planner", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(500)
    r["deep_tab"] = page.evaluate("document.getElementById('crumbLbl')?.innerText")

    r["errors"] = errors
    r["page_errors"] = perr
    b.close()

print(json.dumps(r, ensure_ascii=False, indent=2))
