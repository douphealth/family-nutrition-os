# Changelog

All notable changes to ZENITH PRO are documented here.

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
