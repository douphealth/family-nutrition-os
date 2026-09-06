# ZENITH PRO v2 · Family Nutrition OS

Privacy-first, offline-first family nutrition PWA designed around a single shared family meal system with member-specific portion logic.

## v2 changes
- Correct separation of adult vs adolescent logic; no adult BMI labels or fat-loss mode for minors.
- Training-load-aware athlete mode for the 15-year-old basketball player.
- Real meal confirmation (`0.75x / 1x / 1.25x`) instead of assuming planned = consumed.
- IndexedDB persistence with no 90-day history deletion.
- Portable JSON backup/import.
- 28-day meal rotation and generated weekly shopping ingredients.
- Action-first Today UI; no arbitrary health score.
- Light/dark themes and reduced-motion support.
- Modular vanilla JS architecture; no runtime dependencies.
- Service-worker update detection and offline shell.
- Node-based nutrition rule tests + GitHub Actions CI.

## Safety model
ZENITH PRO is an educational wellness tool, not medical care. Adolescent profiles are deliberately protected from adult calorie-deficit controls and adult BMI categorization.

## Local development
```bash
python3 -m http.server 8080
```

## Tests
```bash
npm test
```
