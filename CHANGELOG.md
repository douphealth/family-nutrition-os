# Changelog

All notable changes to ZENITH PRO are documented here.

## [4.2.0] — 2026-09-12

The app is a PWA, so the phone is the surface that actually gets used — the mother in the
kitchen, anyone in the shop. It had only ever been reviewed at desktop width. Reviewing it
at 390×844 found three real layout bugs, all now fixed and guarded by a new automated
audit.

### Fixed
- **The shopping header collapsed into its own buttons.** `.shop-progress` is a flex row
  of icon + title + three buttons. On a phone the title was squeezed to one word per line
  ("4 / από / 42 / στο / καλάθι") and the buttons rendered *on top of it*. The actions now
  take their own row and share it evenly, and the progress bar is visible again.
- **Cook Mode's primary action required a scroll on every step.** The step nav sat at the
  bottom of the scrolling body, below the step list. On a single-column phone layout that
  meant scrolling to find "Επόμενο βήμα" on every step, with wet hands, mid-recipe. The
  nav now sits outside `.cook-cols` — so its containing block spans the whole sheet — and
  is pinned to the bottom on narrow screens. Verified pinned before *and* after scrolling
  to the end.
- **The persona header was unreadable at phone width.** The avatar, name eyebrow and goal
  tag competed for one row, squeezing "ΔΗΜΗΤΡΗΣ · ΤΙ ΜΕΤΡΑΕΙ ΓΙΑ ΣΕΝΑ" into a ragged
  column. The tag now drops to its own line below.
- **24px shopping checkboxes were unusable with a thumb.** Raised to 36px on mobile, with
  a taller row; filter chips are held at a 40px minimum height.

### Added
- **Mobile layout audit** (`scripts/capture_mobile.py`, `npm run shots:mobile`). Renders
  the real app in Chromium at 390×844 and asserts: no horizontal overflow on any view,
  every tap target ≥ 36px tall, the active member chip is scrolled into view, the Cook
  Mode step nav is pinned before and after scrolling, the sheet footer is inside the
  viewport, and the shopping title is not overlapped by its buttons. Exits non-zero on
  failure and writes `docs/mobile-*.png`.
- **A `mobile` job in CI** runs that audit on every push, because jsdom has no layout
  engine and nothing in the existing suites could ever have caught these bugs.
- **The member strip scrolls the active member into view.** On a phone the strip scrolls
  horizontally, so a member selected from the command palette — or restored on load —
  could sit off-screen and the switcher then looked like it belonged to someone else.

### Changed
- `APP.version` → `4.2.0`; service-worker cache → `zenith-v4-2026-09-12-3`.
- `npm run shots` / `npm run shots:mobile` added as the documented capture entry points.

## [4.1.0] — 2026-09-12

The household finally has names. The four members were shipped as placeholder labels
(Μητέρα / Πατέρας / Κόρη / Γιος); they are now **Αναστασία** (mother), **Αλέξης**
(father), **Αλεξάνδρα** (daughter) and **Δημήτρης** (son).

### Added
- **`relation` on every member** — the family role ("Μητέρα", "Κόρη"…) is now a separate
  editable field, so a real name and a family role can coexist. It is shown as a tag next
  to the name in the Family view and is editable in the member form.
- **Conservative name upgrade** (`upgradeMemberNames()`). Profiles are persisted, so an
  existing install would have kept the old labels forever. On boot, a stored name is
  replaced **only** when it still equals the shipped placeholder for that id. A name the
  user typed is never overwritten, and `id` never changes — so portions, plans, logs and
  measurements stay attached to the right person. The decision is a pure function in the
  engine and is unit-tested; `app.js` only performs the storage write, and skips it
  entirely when nothing changed.

### Changed
- **Persona brief is now addressed by name** — the card reads "Αναστασία · Τι μετράει για
  σένα" with the goal framing ("Ο ΡΥΘΜΟΣ ΜΕΤΡΑΕΙ") as a tag beside the title, so it is
  unambiguous whose brief is on screen.
- **Avatar initials are upper-cased** (`Αλέξης` → `ΑΛ`), which matters now that the badges
  carry real names rather than two-letter placeholders.
- `APP.version` → `4.1.0`; service-worker cache → `zenith-v4-2026-09-12-2`.
- Smoke test grew to **120 checks**: it asserts all four real names render, that no
  placeholder label survives in the member strip, and that the member form round-trips the
  new `relation` field. The member-form test now **restores the member's real name** after
  its rename assertion instead of leaving the household renamed for later sections.

### Fixed
- The member-form smoke test renamed a real family member and never put it back, which
  silently corrupted the household for every later assertion in the run.

## [4.0.0] — 2026-09-12

Built for the three people who actually use this app: **the mother** (51, gradual fat
loss, does the cooking), **the son** (15, basketball, fuelled for performance) and
**the daughter** (17, growing). v3 was correct; v4 is personal.

### Added

**Easy to use for the mother**
- **Cook Mode.** A full-screen, step-by-step cooking view (`data-act="cook"`) with one
  instruction on screen at a time, a progress bar, a clickable step list, an ingredient
  checklist, and the plated portions for all four members. Built for someone standing at
  the stove with wet hands: large type, big targets, no scrolling to find the next step.
- **Automatic step timers.** `parseStepTimers()` reads `25′`, `12'` and `200°C` out of the
  recipe text and offers **Έναρξη / Παύση / Μηδέν** for the detected duration, with a
  toast, a system notification and haptic feedback when it finishes. No manual timer setup.
- **Shopping list that behaves like a shop.** Filter chips — **Όλα / Απομένουν / Στο
  καλάθι** — so she can hide what is already in the trolley, a per-aisle `3/17` counter
  that turns green when an aisle is complete, and an all-done state. **Αντιγραφή** now
  copies whatever the active filter shows, so "remaining" copies only the remaining.
- **"Γιατί αυτές οι ποσότητες;"** — an expandable explanation of exactly how the
  quantities are derived, including the real household serving share.

**Easy to use for the son (athlete)**
- **Fuelling protocol card.** Athlete-only. Turns the day's training load into concrete
  numbers: pre-session carbohydrate at **1–3 g/kg** (67–201 g for him), post-session
  **0,3 g/kg protein + 1 g/kg carbohydrate** (20 g + 67 g), and fluid replacement at
  **125–150 %** of losses, with a daily litre target.
- **Training-load-aware portions.** `portionProfile()` already scaled carbohydrate for
  athletes; the fuelling card now makes the *reason* visible next to the numbers.
- **Carbs lead the brief.** His focus points are carbohydrate, protein and fluid — not
  calories.

**Easy to use for the daughter (growth)**
- **Growth brief instead of a diet brief.** Her focus points are **iron today** (drawn
  from `IRON_RICH` recipes: lentils, gigantes, revithia, fasolada, meatballs, spinach
  rice, banana toast), **weekly variety**, and an explicit protection tile stating that
  no deficit and no adult BMI category is ever applied at her age.
- **No-deficit framing surfaced, not buried.** The "only additions" rule is now stated
  in her persona card, in the shopping transparency block, and in the coverage card.

**Credibility**
- **Persona focus points** (`personaPoints()`) — exactly three, per member, chosen by
  goal (`gradual_fat_loss` / `maintain` / `growth` / `performance`) with a live value for
  each. The mother gets rate-of-loss, protein floor and "3 measurements needed" instead
  of a single day's number.
- **Honest shopping maths.** The shopping list previously multiplied every ingredient by
  the number of members, silently counting a 0,75× carber and a 1,35× fuelled athlete as
  the same eater — while the UI claimed the quantities were "based on each person's
  portions". `memberShare()` / `householdServings()` now scale per member's portion
  profile, so the copy is true. The household share is **4,1 reference servings**, not 4.
- **Recipe illustrations.** 13 inline-SVG motifs (`RECIPE_ART`), assigned to all 24
  recipes, shown on meal cards, in the recipe sheet and in Cook Mode. Offline-safe and
  theme-aware.

**Craft**
- New design-system section for persona tiles, fuelling blocks, next-meal cards, recipe
  headers, Cook Mode and the shopping chips/transparency block; a `900px` breakpoint
  collapses the Cook Mode two-column layout.

### Changed
- `APP.version` → `4.0.0`. Service-worker cache → `zenith-v4-2026-09-12-1`.
- Cook Mode state (`cook`, `cookTimer`) is deliberately kept **outside** `state`, so
  transient cooking UI is never persisted or restored.
- `npm test` now runs **three** suites (engine, data-integrity, persona & kitchen);
  `npm run smoke` is now **112 checks** on both storage backends, including a new
  "Persona brief" and "Cook Mode" section and shopping-filter coverage.
- `capture_shots.py` additionally captures Cook Mode (light + dark), the three persona
  briefs and the shopping transparency block.

### Fixed
- **The shopping list's stated method did not match its code** (see *Honest shopping
  maths* above). The claim was corrected by fixing the maths, not by softening the copy.
- `docs/screenshot-recipe-dark.png` replaced by `screenshot-cook-dark.png`, which shows
  the view that actually exists in v4.

## [3.0.0] — 2026-09-12

A full rebuild. v3 is a new application, not a patch.

### Added

**Credibility**
- **Derived energy model.** Calories are computed from macros via Atwater factors
  (4/4/9 kcal per g) instead of being stored independently. `src/data.js` recipe `base`
  objects no longer carry a `kcal` field — `kcalFromMacros()` is the single source of
  truth, so recipes, meals and daily totals can never drift apart.
- **Citation registry with usage tracking.** `SOURCES` holds nine canonical references
  (CDC, BJSM, EFSA, WHO, ACSM…) and each carries a `used` field naming the claim it
  supports. A data-integrity test asserts every URL is `https:`.
- **Coverage + gap reporting.** `planCoverage()` reports delivered-vs-target energy,
  protein, carbohydrate, fat and hydration. Where a genuine shortfall exists it proposes
  **additions only** — the app never recommends eating less.
- **`GLOSSARY` and `METHOD`** content so every number on screen is explainable in-app.

**Reliability**
- **IndexedDB primary store with automatic localStorage fallback**, plus
  `activeBackend()` so the UI can state which one is live.
- **In-place schema upgrade.** DB name deliberately unchanged (`zenith-pro-v2`),
  `DB_VERSION` bumped 1 → 2, new `checklists` object store. Existing installs migrate
  with no data loss.
- **Atomic, validated import.** `importBackup()` accepts schema 1 or 2, validates before
  writing anything, and rolls back on failure.
- **Error boundary.** A render failure shows a recovery screen rather than a blank page.
- **Service-worker update detection** with a user-facing "update available" prompt.
- **`requestPersistence()`** to ask the browser for durable storage.

**Usability**
- **Seven views** — Today, Plan, Meals, Shopping, Progress, Family, Guide — with a
  sidebar, topbar, mobile bottom tab bar, and a **command palette** (`Ctrl/⌘ + K`).
- **Undo on destructive actions.** `toast()` supports an action button; deleting a
  measurement or clearing extras is reversible.
- **Editable family.** Add, edit and delete members from the UI.
- **Portion multipliers are applied.** v2 *displayed* the 0.75× / 1× / 1.25× multipliers
  but never applied them to any macro. `mealMacros()` now scales protein, carbohydrate and
  fat (and therefore energy) by the member's portion profile and training load.
- **Un-log anything.** Meals can be un-confirmed, extras removed, water decremented.
- **Water logging, extra meals, skipped meals, printable day sheets.**
- **Keyboard shortcuts** `1`–`7` and `T`; `Esc` closes sheets; focus-trapped dialogs;
  visible focus rings; `prefers-reduced-motion` honoured throughout.

**Craft**
- **Token-driven design system** (`styles/app.css`, ~900 lines, 17 sections): light/dark
  theming, animated aurora background, cards, data-viz components, sheets, toasts,
  skeletons, print stylesheet, and breakpoints at 1180/1000/760/480.
- **Inline-SVG visualisation kit** in `src/ui.js`: ~60 icons, progress rings with
  confirmed + planned arcs, macro bars, trend line charts, adherence heatmaps, bar charts.
- **24 Greek-Mediterranean recipes** with quantified ingredients, step-by-step method and
  a practical tip each.
- **New module layout.** `src/ui.js` (primitives) and `src/views.js` (pure render
  functions) extracted out of the monolithic `app.js`. Views return HTML with `data-act`
  attributes; `app.js` handles everything through one delegated listener.
- **XSS safety.** Every interpolated value passes through `esc()`.
- **Full `index.html` head**: Greek `lang`, description, colour-scheme, Open Graph,
  Twitter card, theme-colour, favicon and apple-touch-icon.
- **Manifest v3**: Greek name/description, light theme colours, split 512 icon into
  separate `any` and `maskable` entries, four deep-link shortcuts.

### Changed
- Service worker rewritten: **network-first** for navigation (was cache-first, which is
  why deploys could appear stale) and stale-while-revalidate for assets. Cache key
  `zenith-v3-2026-09-12-1`.
- `adultBmiLabel()` strings translated to Greek to match the rest of the UI. Behaviour is
  unchanged; the nutrition-engine test suite is untouched and still passes.
- Build/CI: `npm test` now runs **two** suites; `npm run smoke` boots the real app in
  jsdom on both storage backends; `npm run check` syntax-checks every module.

### Fixed
- **`portionProfile()` multipliers were displayed but never applied** to any macro — the
  single most misleading thing in v2.
- **Meals showed base-recipe macros**, not macros scaled to the selected member.
- **No way to un-log a meal** once confirmed.
- **No error handling** — any render exception blanked the app.
- **Four recipes were assigned to the wrong slot** (`bakedFish` and `chickenSouvlaki`
  placed under `lunch` but defined as `dinner`), and `milkRecovery` was never used in the
  rotation. `ROTATION` was rewritten so all 24 recipes appear in their declared slot and
  every recipe is used. Guarded by `tests/data-integrity.test.mjs`.
- **Form inputs inside sheets were never bound.** `memberForm` renders inside `#sheet`,
  outside `#view`, so the view-level binding pass never reached it. `openSheet()` now
  accepts an `onMount` callback.
- **No accessibility layer** — no focus management, no keyboard navigation, no ARIA.

### Corrected
- The `[1.1.0]` entry below advertised features that were never implemented in code
  (water/sleep logging, workout log, achievements, command palette, auto-backup ring,
  Open Graph tags). v3 either implements them for real or the claim is dropped. The
  `docs/` screenshots were also from the earlier v1 app and are now marked as such.

## [2.0.0] — 2026-09-01

### Added
- Modular vanilla-JS architecture (`src/`), no runtime dependencies, no build step.
- IndexedDB persistence with no 90-day history deletion.
- Portable JSON backup/import.
- 28-day Monday-aligned meal rotation with generated weekly shopping ingredients.
- Action-first Today UI; removed the arbitrary composite "health score".
- Light/dark themes and reduced-motion support.
- Service-worker offline shell with update detection.
- Node-based nutrition rule tests + GitHub Actions CI.

### Changed
- Correct separation of adult vs adolescent logic: no adult BMI labels and no fat-loss
  mode for minors (`MINOR_AGE = 18`, `ADULT_BMI_AGE = 20`).
- Training-load-aware athlete mode for the 15-year-old basketball player.
- Real meal confirmation (`0.75× / 1× / 1.25×`) instead of assuming planned = consumed.

## [1.1.0] — 2026-08-31

### Added
- **PWA installability** — `manifest.webmanifest` + icons (192/512/180/favicon); the app installs on phones/desktop as a native app.
- **Offline-first** — `sw.js` service worker caches the app on first visit; full offline use thereafter, with offline fallback on navigation.
- **Deep-link shortcuts** — `?tab=dashboard|nutrition|fitness|planner|analytics|family` opens the matching tab directly (used by PWA shortcuts).
- **Local daily reminder** — opt-in setting (Settings → Υπενθύμιση ημέρας) with time picker; fires a Notification if meals are still unlogged at the chosen time. Respects Notification permission.
- **Auto-backup ring** — every `save()` also writes a rotating 3-slot backup under a separate storage key; if the main state is corrupted, the app recovers from the latest backup automatically.
- **Schema-safe restore** — state loading and JSON backup import now use recursive **deep-merge** with defaults, so older/newer backups never crash or lose fields; forward compatible.
- **Storage resilience** — on quota/serialization failure, `save()` trims history harder and retries once.
- **Legacy migration** — existing `ZENITH_PRO_V12` data is migrated to `V13` automatically (no data loss on upgrade).
- **Metadata & credibility** — full meta description, color-scheme, mobile-web-app tags, Open Graph, theme-color, favicon + apple-touch-icon.
- **New icons** — `bell` / `bellOff` for the reminder toggle.

### Changed
- Storage key bumped to `ZENITH_PRO_V13` (with automatic V12 migration).
- Settings screen: added reminder time picker + toggle row.

### Fixed
- Restore/import could clobber nested state or crash on unexpected backup shape (now deep-merged safely).
- No recovery path if the primary localStorage key was corrupted (now auto-recovers from backup ring).

## [1.0.0] — 2026 (original)
Baseline "Spatial Family Nutrition OS" — member profiles with auto calorie/macro targets, 30 recipes with full macros, water/sleep/energy logging, weight & BMI tracking, weekly meal planner with auto shopping list, workout log with rest timer & 1RM calculator, analytics with trends/streaks, 12 achievements, command palette, theming, JSON backup, guided tour, sounds & haptics.
