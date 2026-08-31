# Changelog

All notable changes to ZENITH PRO are documented here.

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
