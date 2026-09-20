#!/usr/bin/env python3
"""Computed-style verification for the v6 visual layers (not part of CI)."""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8139/index.html"
fails = []

def check(cond, msg):
    print(("  ok   " if cond else "  FAIL ") + msg)
    if not cond:
        fails.append(msg)

with sync_playwright() as p:
    browser = p.chromium.launch()

    # ── Desktop ─────────────────────────────────────────────────────────
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE); pg.wait_for_timeout(1200)
    pg.evaluate("() => document.querySelector('[data-act=\"dismissOnboarding\"]')?.click()")
    pg.wait_for_timeout(400)

    # Polish layer is applied. (--accent itself is inline-overridden per member
    # by app.js renderShell(), which is CORRECT — so assert a token nothing
    # overrides: the retuned page background.)
    bg = pg.evaluate("() => getComputedStyle(document.body).backgroundColor")
    check(bg == "rgb(243, 248, 245)", f"desktop: enterprise canvas token is live ({bg})")
    n_rules = pg.evaluate("() => [...document.styleSheets].reduce((n, s) => { try { return n + (s.href?.includes('polish') ? s.cssRules.length : 0) } catch { return n } }, 0)")
    check(n_rules > 60, f"desktop: polish.css loaded with {n_rules} rules")

    # Token retune visible on a real element
    card_bg = pg.evaluate("() => getComputedStyle(document.querySelector('.card')).backgroundImage")
    check("radial-gradient" in card_bg, "desktop: card carries the top-lit gradient wash")

    # Sheen pseudo on primary button
    sheen = pg.evaluate("() => { const b = document.querySelector('.btn-primary'); return b ? getComputedStyle(b, '::after').content : 'none' }")
    check(sheen and sheen != 'none' and '""' in sheen, f"desktop: btn-primary sheen pseudo exists ({sheen})")

    # Hero KPI spotlight
    spot = pg.evaluate("() => { const k = document.querySelector('.kpi.is-hero'); return k ? getComputedStyle(k, '::after').backgroundImage : '' }")
    check("radial-gradient" in spot, "desktop: hero KPI has the spotlight overlay")

    # Entrance stagger is running
    anim = pg.evaluate("() => { const el = document.querySelector('.view-enter > *'); return el ? getComputedStyle(el).animationName : '' }")
    check(anim == "zpRise", f"desktop: view sections enter via {anim}")

    # Progress bar glint loop
    glint = pg.evaluate("() => { const f = document.querySelector('.mb-fill'); return f ? getComputedStyle(f, '::after').animationName : '' }")
    check(glint == "zpGlint", f"desktop: macro-bar glint loop is {glint}")

    # Aurora second light
    aurora = pg.evaluate("() => { const a = document.querySelector('.aurora'); return a ? getComputedStyle(a, '::before').backgroundImage : '' }")
    check("radial-gradient" in aurora, "desktop: aurora has the second drifting light")

    # Ring halo
    halo = pg.evaluate("() => { const h = document.querySelector('.hero-ring'); return h ? getComputedStyle(h, '::before').animationName : '' }")
    check(halo == "zpBreatheGlow", f"desktop: energy-ring halo breathes ({halo})")

    # Nav active bar
    navbar = pg.evaluate("() => { const n = document.querySelector('.nav-btn.active'); return n ? getComputedStyle(n, '::before').transform : 'none' }")
    check(navbar and "matrix" in navbar, f"desktop: active nav item shows its accent bar ({navbar})")

    # Adaptive tint check: the app sets --accent inline per member, so the soft
    # tint must RESOLVE from that member colour (blue for father), not stay emerald.
    pg.evaluate("() => document.querySelector('#memberStrip [data-act=\"member\"][data-id=\"father\"]')?.click()")
    pg.wait_for_timeout(400)
    tint = pg.evaluate("""() => {
        const n = document.querySelector('.nav-btn.active');
        const grad = n ? getComputedStyle(n).backgroundImage : '';
        const probe = document.createElement('div');
        probe.style.backgroundColor = 'var(--accent-soft)';
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return { grad, resolved };
    }""")
    check("linear-gradient" in tint["grad"], "desktop: active nav uses the polished gradient tint")
    # Chromium serializes color-mix() as "color(srgb r g b / a)" — parse either form.
    import re as _re
    m = _re.search(r"color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)", tint["resolved"]) or _re.search(r"rgba?\(([\d.]+), ([\d.]+), ([\d.]+)", tint["resolved"])
    rgb = [float(m.group(i)) for i in (1, 2, 3)] if m else []
    check(bool(rgb) and rgb[2] > rgb[0], f"desktop: soft tint follows the member accent (father=blue → {tint['resolved']})")
    pg.evaluate("() => document.querySelector('#memberStrip [data-act=\"member\"][data-id=\"mother\"]')?.click()")
    pg.wait_for_timeout(300)

    # Interaction: log a meal → celebrate animation fires
    pg.evaluate("() => document.querySelector('[data-act=\"meal\"][data-portion=\"1\"]')?.click()")
    pg.wait_for_timeout(250)
    celeb = pg.evaluate("() => { const m = document.querySelector('.meal.is-done'); return m ? getComputedStyle(m).animationName : 'none' }")
    check(celeb == "zpCelebrate", f"desktop: logging a meal triggers {celeb}")

    # Dark theme: tokens retune there too
    pg.evaluate("() => document.getElementById('themeBtn')?.click()"); pg.wait_for_timeout(500)
    dbgs = pg.evaluate("() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()")
    check(dbgs == "#04110e", f"desktop/dark: retuned dark bg token ({dbgs})")
    pg.evaluate("() => document.getElementById('themeBtn')?.click()"); pg.wait_for_timeout(300)

    # Switch member → accent follows (inline override still wins)
    pg.evaluate("() => document.querySelector('#memberStrip [data-act=\"member\"][data-id=\"father\"]')?.click()")
    pg.wait_for_timeout(400)
    macc = pg.evaluate("() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()")
    check(macc == "#2F6FED", f"desktop: member accent still overrides ({macc})")

    check(not errors, f"desktop: no page errors ({errors[:3]})")
    ctx.close()

    # ── Mobile (coarse pointer) ────────────────────────────────────────
    mctx = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True, device_scale_factor=2)
    mp = mctx.new_page()
    merrors = []
    mp.on("pageerror", lambda e: merrors.append(str(e)))
    mp.goto(BASE); mp.wait_for_timeout(1200)
    mp.evaluate("() => document.querySelector('[data-act=\"dismissOnboarding\"]')?.click()")
    mp.wait_for_timeout(400)

    tabbar_bottom = mp.evaluate("() => { const t = document.querySelector('.tabbar'); const r = t.getBoundingClientRect(); const cs = getComputedStyle(t); return { bottom: Math.round(r.bottom), vh: window.innerHeight, cssBottom: cs.bottom } }")
    check(tabbar_bottom["bottom"] <= 845, f"mobile: tab bar sits above the fold ({tabbar_bottom})")

    pb = mp.evaluate("() => getComputedStyle(document.querySelector('.content')).paddingBottom")
    check(pb == "124px", f"mobile: content clears the tab bar by {pb}")

    glass = mp.evaluate("() => { const g = document.querySelector('.glass'); return g ? getComputedStyle(g).width : '' }")
    check(glass == "40px", f"mobile/coarse: water glass is thumb-sized ({glass})")

    inp = mp.evaluate("() => { const i = document.querySelector('.tab-btn'); return i ? getComputedStyle(i).animationName || 'none' : '' }")
    minH = mp.evaluate("() => { const i = document.querySelector('input, select'); return i ? getComputedStyle(i).minHeight : 'none' }")
    check(minH == "44px", f"mobile/coarse: inputs are at least {minH} tall")

    # Member strip snap
    snap = mp.evaluate("() => getComputedStyle(document.querySelector('.member-strip')).scrollSnapType")
    check("proximity" in snap or snap == "x", f"mobile: member strip snap = {snap}")

    check(not merrors, f"mobile: no page errors ({merrors[:3]})")
    mctx.close()

    # ── Reduced motion guard ───────────────────────────────────────────
    rctx = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
    rp = rctx.new_page()
    rp.goto(BASE); rp.wait_for_timeout(1000)
    TINY = ("0.001ms", "1ms", "0ms", "1e-06s", "0.000001s")
    rdur = rp.evaluate("() => { const el = document.querySelector('.view-enter > *'); return el ? getComputedStyle(el).animationDuration : '' }")
    check(rdur in TINY, f"reduced-motion: stagger collapses to {rdur}")
    rglint = rp.evaluate("() => { const f = document.querySelector('.mb-fill'); return f ? getComputedStyle(f, '::after').animationDuration : '' }")
    check(rglint in TINY, f"reduced-motion: glint collapses to {rglint}")
    rctx.close()

    # ── High contrast guard ────────────────────────────────────────────
    hctx = browser.new_context(viewport={"width": 1280, "height": 800}, contrast="more" if False else None)
    hctx.close()
    hctx = browser.new_context(viewport={"width": 1280, "height": 800})
    hp = hctx.new_page()
    hp.goto(BASE); hp.wait_for_timeout(900)
    hp.emulate_media(contrast="more"); hp.wait_for_timeout(300)
    hsheen = hp.evaluate("() => { const b = document.querySelector('.btn-primary'); return b ? getComputedStyle(b, '::after').display : '' }")
    check(hsheen == "none", f"prefers-contrast: sheen drops out ({hsheen})")
    hglint = hp.evaluate("() => { const f = document.querySelector('.mb-fill'); return f ? getComputedStyle(f, '::after').display : '' }")
    check(hglint == "none", f"prefers-contrast: glint drops out ({hglint})")
    hbrand = hp.evaluate("() => getComputedStyle(document.querySelector('.brand-name')).webkitTextFillColor")
    check(hbrand and "rgba" in hbrand or hbrand == "rgb(0, 0, 0)" or hbrand != "transparent", f"prefers-contrast: brand text is solid ({hbrand})")
    hctx.close()

    browser.close()

print()
if fails:
    print(f"POLISH VERIFICATION: FAIL ({len(fails)})")
    sys.exit(1)
print("POLISH VERIFICATION: PASS (all computed-style checks)")
