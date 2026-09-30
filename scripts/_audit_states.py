"""
ZENITH PRO · shared scenario driver for the audits
---------------------------------------------------------------------------
The accessibility audit (axe) and the contrast audit (pixel-measured) must look at
exactly the same screens, so "put the app into every state worth checking" lives
here once. `visit()` walks the running app and calls `scan(label)` at each state:

    first run (onboarding showing)            every view × every member, empty logs
    the same views once real data exists      shopping ticked / "still to buy" filter
    meals filtered                            day sheet, recipe sheet, Cook Mode + timer
    member form, delete and wipe confirmations, the phone "more" sheet, command palette

Every interaction goes through the app's own controls (the delegated `data-act`
dispatcher, the real weigh-in form), never by poking internal state.
"""

# The toast dismisses itself after 4.2 s — faster than a scan can walk a long page. Timers of 4 s or
# more are therefore held (never fired) inside the audit browser, so transient UI stays put while it is
# measured. Shorter timers (debounces, focus, sheet animation) run normally.
HOLD_LONG_TIMERS = "(() => { const st = window.setTimeout; window.setTimeout = (fn, ms, ...a) => (ms >= 4000 ? 0 : st(fn, ms, ...a)); })()"


def prepare(context):
    context.add_init_script(HOLD_LONG_TIMERS)


MEMBERS = ["mother", "father", "daughter", "son"]  # four accent colours: an adult on a fat-loss goal, an adult maintaining, a growing teen, a teen athlete
VIEWS = ["today", "plan", "meals", "shopping", "progress", "family", "guide"]
QUICK_VIEWS = ["today", "meals", "shopping", "family"]


def js_click(page, selector, wait=350):
    """Click through the DOM (works for controls under a floating bar); False if absent."""
    found = page.evaluate(
        "(s) => { const el = document.querySelector(s); if (!el) return false; el.click(); return true; }",
        selector,
    )
    page.wait_for_timeout(wait)
    return found


def is_phone(page):
    return page.evaluate("!!document.querySelector('#tabbar')?.offsetParent")


def go(page, view):
    """Open a view through whichever navigation is on screen, then expand every <details>."""
    page.evaluate(
        """(v) => {
          const side = document.querySelector('#sideNav');
          const scope = side && side.offsetParent ? '#sideNav' : '#tabbar';
          (document.querySelector(`${scope} [data-act="nav"][data-view="${v}"]`)
            || document.querySelector(`#sideNav [data-act="nav"][data-view="${v}"]`))?.click();
        }""",
        view,
    )
    page.wait_for_timeout(550)
    page.evaluate("document.querySelectorAll('#view details').forEach(d => { d.open = true; })")
    page.evaluate("window.scrollTo({ top: 0, behavior: 'instant' })")


def close_sheet(page):
    page.evaluate("document.querySelector('[data-sheet-close]')?.click()")
    page.wait_for_timeout(280)


def seed_progress(page):
    """Four weekly weigh-ins through the real form, so the trend chart and history render."""
    go(page, "progress")
    base = page.evaluate("Number(document.querySelector('#mWeight').value)")
    for step, days_ago in enumerate((21, 14, 7, 0)):
        date = page.evaluate(
            """(n) => { const d = new Date(); d.setDate(d.getDate() - n);
                       const p = v => String(v).padStart(2, '0');
                       return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }""",
            days_ago,
        )
        page.fill("#mDate", date)
        page.fill("#mWeight", f"{base - 0.4 * (step + 1):.1f}")
        page.fill("#mNote", "πρωί, νηστικός" if step == 0 else "")
        page.evaluate("document.querySelector('#measureForm').requestSubmit()")
        page.wait_for_timeout(450)


def log_today(page, meals=4):
    """Log today's meals (default: all four) and some water through the Today view's own buttons."""
    go(page, "today")
    for _ in range(meals):
        js_click(page, '#view [data-act="meal"][data-portion]', 300)
    for _ in range(3):
        js_click(page, '#view [data-act="water"]', 200)


def visit(page, tag, quick, scan):
    members = ["son"] if quick else MEMBERS
    views = QUICK_VIEWS if quick else VIEWS

    # 1 ─ first run: the onboarding card is on screen
    scan(f"{tag}/first-run")
    js_click(page, '[data-act="dismissOnboarding"]')

    # 2 ─ every view for every member, with nothing logged yet
    for member in members:
        js_click(page, f'[data-act="member"][data-id="{member}"]')
        for view in views:
            go(page, view)
            scan(f"{tag}/{member}/{view}")

    # 3 ─ the same screens once the app holds real data (weigh-ins, meals, water, a toast)
    js_click(page, '[data-act="member"][data-id="son"]')
    seed_progress(page)
    log_today(page)
    for view in (["today", "progress"] if quick else VIEWS):
        go(page, view)
        scan(f"{tag}/son/{view}+data")

    # 4 ─ interaction states
    go(page, "shopping")
    for _ in range(3):
        js_click(page, '#view [data-act="shop"][aria-pressed="false"]', 250)
    scan(f"{tag}/shopping-ticked")
    js_click(page, '#view [data-act="shopFilter"][data-value="todo"]')
    scan(f"{tag}/shopping-still-to-buy")
    js_click(page, '#view [data-act="shopCopy"]', 500)          # a toast (success, or the error tone without clipboard access)
    scan(f"{tag}/shopping-copy-toast")

    go(page, "meals")
    js_click(page, '#view [data-act="filter"][data-key="slot"]')
    scan(f"{tag}/meals-filtered")
    js_click(page, '#view [data-act="filter"][data-key="reset"]')

    go(page, "plan")
    js_click(page, '#view [data-act="day"]', 500)
    scan(f"{tag}/day-sheet")
    close_sheet(page)

    go(page, "meals")
    js_click(page, '#view [data-act="recipe"][data-id]', 500)
    scan(f"{tag}/recipe-sheet")
    js_click(page, '#sheet [data-act="cook"]', 500)
    scan(f"{tag}/cook-mode")
    js_click(page, '#sheet [data-act="timerStart"]', 900)
    scan(f"{tag}/cook-timer")
    close_sheet(page)

    go(page, "family")
    for act, label in (("editMember", "member-form"), ("delMember", "delete-confirm"), ("wipe", "wipe-confirm")):
        if js_click(page, f'#view [data-act="{act}"]', 500):
            scan(f"{tag}/{label}")
            close_sheet(page)

    if is_phone(page):
        js_click(page, '#tabbar [data-act="more"]', 500)
        scan(f"{tag}/more-sheet")
        close_sheet(page)

    page.keyboard.press("Control+k")
    page.wait_for_timeout(400)
    scan(f"{tag}/palette")
    page.keyboard.type("ψ")
    page.wait_for_timeout(300)
    scan(f"{tag}/palette-query")
    page.keyboard.press("Escape")
    page.wait_for_timeout(250)
