#!/usr/bin/env python3
"""
ZENITH PRO · contrast audit, measured from rendered pixels
---------------------------------------------------------------------------
axe-core can compute contrast only where the background is a single flat colour.
The app deliberately uses tints, glass and gradients, so axe reports hundreds of
nodes as "incomplete". This audit decides them by measuring what the user sees:

  1. every visible text run is found in the DOM with its computed colour (alpha and
     ancestor opacity applied), font size and weight;
  2. the page is re-rendered with all glyphs and text decorations made transparent,
     so a screenshot shows exactly what lies *behind* each run — gradient, tint,
     glass blur, illustration or a floating bar included;
  3. the WCAG 2.x contrast ratio is computed between the text colour and every
     background pixel under the run; the worst 2% of pixels are ignored (edges),
     the rest must clear 4.5:1, or 3:1 for large text (>= 24 px, or >= 18.66 px bold).

Pages and sheets are scrolled in steps so nothing below the fold escapes. Text that
is covered by an overlay, clipped away or disabled (WCAG exempts inactive controls)
is not measured. A toast is measured on its own, then dismissed, so that it cannot
sit half over the content beneath it. The same states as the axe audit are visited
(see _audit_states.py).

    python scripts/audit_contrast.py [base_url] [--quick] [--verbose] [--crops DIR]

--crops saves, for each failing text run, the region as the user sees it (3x), so a
finding can be judged by eye. Exit status is non-zero if any text run fails.
"""

import io
import math
import os
import re
import sys
from collections import defaultdict

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

from _audit_states import prepare, visit
from _browser import launch, utf8_output

utf8_output()

argv = sys.argv[1:]
CROPS = None
if "--crops" in argv:
    i = argv.index("--crops")
    CROPS = argv[i + 1]
    del argv[i:i + 2]
args = [a for a in argv if not a.startswith("--")]
BASE = args[0] if args else "http://127.0.0.1:8137/index.html"
QUICK = "--quick" in argv
VERBOSE = "--verbose" in argv
if CROPS:
    os.makedirs(CROPS, exist_ok=True)

VIEWPORTS = [("phone", {"width": 390, "height": 844}, True), ("desktop", {"width": 1440, "height": 900}, False)]
SCHEMES = ["light", "dark"]

# Glyph fill and decorations (underline, strike-through) are painted in the text colour, so both go.
HIDE_TEXT = "*,*::before,*::after{-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}"

COLLECT = r"""
(only) => {
  const W = innerWidth, H = innerHeight;
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const frac = (t) => (t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t));
  function rgba(css) {
    let m = css.match(/^rgba?\(([^)]+)\)$/);
    if (m) { const p = m[1].split(/[\s,\/]+/).filter(Boolean); return [+p[0], +p[1], +p[2], p.length > 3 ? frac(p[3]) : 1]; }
    m = css.match(/^color\(srgb ([^)]+)\)$/);
    if (m) { const p = m[1].split(/[\s\/]+/).filter(Boolean); return [frac(p[0]) * 255, frac(p[1]) * 255, frac(p[2]) * 255, p.length > 3 ? frac(p[3]) : 1]; }
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255];
  }
  const describe = (el) => el.tagName.toLowerCase() + [...el.classList].slice(0, 3).map(c => '.' + c).join('')
    + (el.getAttribute('data-act') ? `[${el.getAttribute('data-act')}]` : '');
  const out = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (/\S/.test(n.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
  });
  while (walker.nextNode()) {
    const node = walker.currentNode, el = node.parentElement;
    if (!el || el.closest('script,style,noscript,svg,template,[hidden]')) continue;
    if (only ? !el.closest(only) : el.closest('#toast')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility !== 'visible' || cs.display === 'none') continue;
    if (el.closest('[disabled],[aria-disabled="true"]')) continue;     // inactive controls are exempt (WCAG 1.4.3)
    let opacity = 1;
    for (let e = el; e; e = e.parentElement) opacity *= parseFloat(getComputedStyle(e).opacity);
    if (opacity < 0.05) continue;
    // Boxes that clip this text (scroll containers, ellipsis, rounded overflow): only what they show is on screen.
    const clips = [];
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const o = getComputedStyle(e);
      if (o.overflowX !== 'visible' || o.overflowY !== 'visible') clips.push(e.getBoundingClientRect());
    }
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      let x0 = Math.max(0, r.left), y0 = Math.max(0, r.top), x1 = Math.min(W, r.right), y1 = Math.min(H, r.bottom);
      for (const k of clips) { x0 = Math.max(x0, k.left); y0 = Math.max(y0, k.top); x1 = Math.min(x1, k.right); y1 = Math.min(y1, k.bottom); }
      if (x1 - x0 < 3 || y1 - y0 < 3) continue;
      if (cs.pointerEvents !== 'none') {
        // Measure a run only where it is wholly visible: every probe point must land on the text's own element.
        // A run that is half under a floating bar or sheet edge is measured at the scroll step that clears it.
        const xs = [x0 + 1, (x0 + x1) / 2, x1 - 1], ys = [y0 + 1, (y0 + y1) / 2, y1 - 1];
        let clear = true;
        for (const px of xs) for (const py of ys) {
          const top = document.elementFromPoint(px, py);
          if (!top || !(top === el || el.contains(top))) { clear = false; break; }
        }
        if (!clear) continue;
      }
      const c = rgba(cs.color);
      out.push({
        t: node.data.trim().replace(/\s+/g, ' ').slice(0, 30), s: describe(el), r: [x0, y0, x1, y1],
        c: [c[0], c[1], c[2], c[3] * opacity], fs: parseFloat(cs.fontSize), fw: parseInt(cs.fontWeight, 10) || 400
      });
    }
  }
  return out;
}
"""

SCROLL_INFO = """() => {
  const sb = document.querySelector('#sheet:not(.hidden) .sheet-body');
  const root = sb || document.scrollingElement;
  return { sheet: !!sb, height: root.scrollHeight, view: sb ? sb.clientHeight : innerHeight };
}"""

SCROLL_TO = """(y) => {
  const sb = document.querySelector('#sheet:not(.hidden) .sheet-body');
  if (sb) sb.scrollTo({ top: y, behavior: 'instant' }); else window.scrollTo({ top: y, behavior: 'instant' });
}"""


def luminance(rgb):
    c = rgb / 255.0
    c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]


def contrast(l1, l2):
    return (np.maximum(l1, l2) + 0.05) / (np.minimum(l1, l2) + 0.05)


def hexcolor(rgb):
    return "#%02x%02x%02x" % tuple(int(round(max(0, min(255, v)))) for v in rgb)


results = defaultdict(lambda: {"worst": 99.0, "need": 4.5, "text": "", "fg": "", "bg": "", "states": set(), "count": 0})
measured = 0
tiny = defaultdict(int)
tightest = {"margin": 99.0, "ratio": 0.0, "what": ""}
crop_count = 0


def save_crop(normal, run, label, worst):
    global crop_count
    if not CROPS or normal is None:
        return
    crop_count += 1
    x0, y0, x1, y1 = (int(v) for v in run["r"])
    box = (max(0, x0 - 10), max(0, y0 - 10), min(normal.width, x1 + 10), min(normal.height, y1 + 10))
    crop = normal.crop(box).resize(((box[2] - box[0]) * 3, (box[3] - box[1]) * 3), Image.NEAREST)
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", f"{crop_count:03d}_{label.replace('/', '-')}_{run['s']}_{worst:.2f}")[:150]
    crop.save(os.path.join(CROPS, name + ".png"))


def measure_view(page, label, only=None):
    """Measure every text run currently in the viewport (or inside `only`)."""
    global measured
    runs = page.evaluate(COLLECT, only)
    if not runs:
        return
    normal = Image.open(io.BytesIO(page.screenshot(type="png"))).convert("RGB") if CROPS else None
    page.evaluate(
        "(css) => { let s = document.getElementById('__ct'); if (!s) { s = document.createElement('style'); s.id = '__ct'; document.head.appendChild(s); } s.textContent = css; void document.documentElement.offsetHeight; }",
        HIDE_TEXT,
    )
    # Chromium may keep composited text/backdrop layers from the previous frame.
    # Wait for two paints so the screenshot is guaranteed to contain the page
    # *without glyphs*, not a stale layer with the original text still visible.
    page.evaluate("() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")
    png = page.screenshot(type="png")
    page.evaluate("document.getElementById('__ct')?.remove()")
    img = np.asarray(Image.open(io.BytesIO(png)).convert("RGB"), dtype=np.float64)
    height, width = img.shape[:2]

    for run in runs:
        x0, y0, x1, y1 = run["r"]
        x0, x1 = int(math.floor(x0)), int(math.ceil(x1))
        y0, y1 = int(math.floor(y0)), int(math.ceil(y1))
        pad = int((y1 - y0) * 0.2)                       # skip the line box's empty leading above and below the glyphs
        y0, y1 = y0 + pad, y1 - pad
        x0, x1, y0, y1 = max(0, x0), min(width, x1), max(0, y0), min(height, y1)
        if x1 - x0 < 2 or y1 - y0 < 2:
            continue
        bg = img[y0:y1, x0:x1].reshape(-1, 3)
        r, g, b, a = run["c"]
        fg = np.array([r, g, b])
        shown = fg * a + bg * (1 - a)                    # the text colour as painted over each pixel
        ratios = contrast(luminance(shown), luminance(bg))
        worst = float(np.percentile(ratios, 2))
        large = run["fs"] >= 24 or (run["fs"] >= 18.66 and run["fw"] >= 700)
        need = 3.0 if large else 4.5
        measured += 1
        if run["fs"] < 11:
            tiny[run["s"]] += 1
        if worst >= need:
            if worst - need < tightest["margin"]:
                tightest.update(margin=worst - need, ratio=worst, what=f'{run["s"]} «{run["t"]}» ({label})')
            continue
        key = (label.split("/")[1], run["s"], run["t"])
        rec = results[key]
        rec["count"] += 1
        if worst < rec["worst"]:
            rec.update(worst=worst, need=need, text=run["t"], fg=hexcolor(fg) + (f" @{a:.2f}" if a < 0.995 else ""),
                       bg=hexcolor(np.median(bg, axis=0)))
            save_crop(normal, run, label, worst)
        rec["states"].add(label.split("/", 2)[-1])


def make_scan(page):
    def scan(label):
        if page.evaluate("!!document.querySelector('#toast:not(.hidden) .toast-card')"):
            measure_view(page, label + "+toast", only="#toast")
            page.evaluate("document.querySelector('#toastClose')?.click()")
            page.wait_for_timeout(200)
        info = page.evaluate(SCROLL_INFO)
        step = max(200, int(info["view"] * 0.8))
        y = 0
        while True:
            page.evaluate(SCROLL_TO, y)
            page.wait_for_timeout(140)
            measure_view(page, label)
            if y + info["view"] >= info["height"] - 2:
                break
            y += step
        page.evaluate(SCROLL_TO, 0)
    return scan


with sync_playwright() as p:
    browser = launch(p)
    for vp_name, viewport, mobile in VIEWPORTS:
        for scheme in SCHEMES:
            tag = f"{vp_name}/{scheme}"
            ctx = browser.new_context(
                viewport=viewport, is_mobile=mobile, has_touch=mobile, device_scale_factor=1,
                color_scheme=scheme, reduced_motion="reduce", locale="el-GR", timezone_id="Europe/Athens", service_workers="block",
            )
            prepare(ctx)
            page = ctx.new_page()
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(600)
            before = measured
            visit(page, tag, QUICK, make_scan(page))
            print(f"  {tag}: measured {measured - before} text runs")
            ctx.close()
    browser.close()

print(f"\ntext runs measured: {measured}")
if tightest["what"]:
    print(f"tightest passing run: {tightest['ratio']:.2f}:1 — {tightest['what']}")
if tiny and VERBOSE:
    print("text under 11px:", dict(tiny))

if results:
    rows = sorted(results.items(), key=lambda kv: kv[1]["worst"])
    print(f"\nCONTRAST AUDIT: FAIL — {len(rows)} distinct failing text runs\n")
    for (scheme, selector, _), rec in rows[:80]:
        states = sorted(rec["states"])
        extra = f" +{len(states) - 3} more" if len(states) > 3 else ""
        print(f"  {rec['worst']:.2f} < {rec['need']:.1f}  {scheme:5}  {selector:44}  «{rec['text']}»  {rec['fg']} on ~{rec['bg']}  ×{rec['count']}  [{', '.join(states[:3])}{extra}]")
    if len(rows) > 80:
        print(f"  … and {len(rows) - 80} more")
    sys.exit(1)
print("CONTRAST AUDIT: PASS")
