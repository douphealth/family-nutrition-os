# Contributing to ZENITH PRO Family Nutrition OS

Thank you for helping improve this MIT-licensed, offline-first family nutrition app. The project is designed to be understandable, reproducible, privacy-preserving, and accessible.

## Before opening an issue

- Search existing issues and pull requests to avoid duplicates.
- For a bug, describe the observed and expected behavior, the browser/device, and precise reproduction steps.
- Include screenshots or console errors when useful, but **never include real household profiles, health data, exported backups, API keys, or other personal information**.
- For a nutrition-data problem, cite the affected ingredient, USDA FoodData Central record when applicable, and relevant calculation.
- For security vulnerabilities, do not disclose exploit details in a public issue. Use GitHub's private vulnerability reporting when available, or contact the repository owner to arrange a private disclosure channel.

## Development

Requires Node.js 20+ and npm.

```bash
git clone https://github.com/douphealth/family-nutrition-os.git
cd family-nutrition-os
npm ci
npm run serve
```

The local web app is served at `http://127.0.0.1:8137/`.

Before opening a pull request, run:

```bash
npm run verify
```

This executes syntax checks, unit/data/provenance tests, PWA asset integrity, and DOM smoke tests. Optional browser audits use Python with Playwright, NumPy, and Pillow; see the README's development and audit commands. GitHub Actions runs automated checks for pull requests.

## Core invariants

Changes must preserve these project properties:

1. **Privacy first:** The app works without an account or application server. Household data remains local; do not introduce analytics, tracking, new remote APIs, or remote script dependencies without a clearly reviewed proposal.
2. **Nutrition provenance:** Keep nutrition values traceable to the committed USDA FoodData Central snapshot or clearly labelled approximations. Do not introduce fabricated precision or unsourced claims.
3. **Safety:** The application is educational, not medical advice. Preserve age-specific safeguards; do not offer weight-loss deficits to minors.
4. **Accessibility:** Maintain keyboard operation, readable contrast, responsive layouts, and meaningful controls for both Greek and English experiences.
5. **Offline reliability:** Review caching, versioned assets, backup compatibility, timezones, and daylight-saving boundaries.

## Pull-request checklist

- Keep each PR focused; explain the reason for the change and any user-visible behavior.
- Include a reproducible test or a rationale when tests are not applicable.
- Run `npm run verify`, document failures honestly, and allow GitHub Actions to finish.
- For UI changes, include accessible mobile/desktop screenshots when possible.
- For changes to persisted data, explain migration and rollback implications.
- Never commit real user data, environment files, credentials, or private exports.
- Do not modify nutrition reference data without showing the source and expected downstream effects.

The maintainer reviews proposed changes and decides whether to merge after tests and safety checks.
