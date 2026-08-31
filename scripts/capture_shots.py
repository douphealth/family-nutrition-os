#!/usr/bin/env python3
"""Recapture screenshots with tour dismissed + DOM state verified."""
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8137/index.html"
with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1280, "height": 900}, device_scale_factor=2)
    page.goto(URL, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1800)
    # Dismiss tour robustly: find open modal overlay & close, plus set flag
    page.evaluate("""(function(){
      if(window.S && S.tourDone===false){ S.tourDone=true; }
      var ids=['tourModal','palModal','pickModal','smModal','editModal','setModal'];
      for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el&&el.classList.contains('open')){el.classList.remove('open');}}
      if(window.Tour && Tour.close) Tour.close();
    })()""")
    page.wait_for_timeout(400)
    # Confirm visible text at capture time
    txt = page.evaluate("document.getElementById('view')?.innerText?.length || 0")
    print("view text len at capture:", txt)
    page.screenshot(path="docs/screenshot-dashboard.png")
    page.evaluate("go('nutrition')")
    page.wait_for_timeout(600)
    page.screenshot(path="docs/screenshot-nutrition.png")
    page.evaluate("go('planner')")
    page.wait_for_timeout(600)
    page.screenshot(path="docs/screenshot-planner.png")
    b.close()
print("done")
