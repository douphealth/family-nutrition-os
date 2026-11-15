# Family Nutrition OS

A private, family-friendly nutrition dashboard (Greek UI) for planning meals, logging what you eat,
tracking weight and progress, and building a shopping list — for every member of the family.

All nutrition figures come from a deterministic engine in `src/engine/` with reference values from
**USDA FoodData Central** and **EFSA Dietary Reference Values**. The UI never re-derives numbers on its own.

## Features

- **Σήμερα (Today)** – energy ring, macros and the next meal for the selected family member
- **Πλάνο (Plan)** – weekly meal plan per person
- **Συνταγές (Meals)** – recipes with full nutrition breakdown
- **Ψώνια (Shopping)** – auto-generated, tickable shopping list
- **Πρόοδος (Progress)** – family meal and training completion, actual recorded minutes, weigh-ins and trends
- **Οικογένεια (Family)** – profiles, goals and activity levels
- **Οδηγός (Guide)** – how the numbers are calculated and their sources

## Privacy

No account, no backend, no tracking. Household state is saved in IndexedDB with an immediate
localStorage mirror. Existing localStorage data migrates automatically; same-origin browser tabs
share updates. The header reports save failures instead of silently pretending data was saved.

Use **Family → Backup / Restore** to transfer a validated JSON backup or keep an external copy.
Browser storage is not a permanent backup: clearing site data or using private browsing can erase it.
Cross-phone automatic sync is not connected; it requires an independently hosted authenticated shared service.
Training completion records the minutes the member explicitly reports, never recalculates old workload
from a changed plan, and keeps unknown-duration older completions separate.

## Getting started

Requirements: Node.js 20+.

```bash
git clone https://github.com/douphealth/family-nutrition-os.git
cd family-nutrition-os
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command         | What it does                                   |
| --------------- | ---------------------------------------------- |
| `npm run dev`   | Start the development server                   |
| `npm run build` | Production build into `.output/`               |
| `npm start`     | Run the production build (Node server)         |
| `npm test`      | Run the test suite (Vitest)                    |
| `npm run lint`  | Lint the code                                  |

## Deployment

The build uses [Nitro](https://nitro.build). It targets a Node server by default.
To build for another host, set `NITRO_PRESET`, e.g.:

```bash
NITRO_PRESET=vercel npm run build
NITRO_PRESET=netlify npm run build
NITRO_PRESET=cloudflare-module npm run build
```

## Tech stack

React 19 · TanStack Start / Router · TypeScript · Tailwind CSS v4 · Recharts · Radix UI

## Disclaimer

This app provides general nutrition information and is not a substitute for advice from a
doctor or registered dietitian, especially for children, pregnancy or medical conditions.

## License

See [LICENSE](./LICENSE).

## GitHub Pages

The live app is served from the `gh-pages` branch at
https://douphealth.github.io/family-nutrition-os/.

To rebuild it yourself:

```bash
npm run build:pages   # static build in dist/client (base path /family-nutrition-os/)
```

Then publish the contents of `dist/client` to the `gh-pages` branch
(for example with `npx gh-pages -d dist/client --dotfiles`).
