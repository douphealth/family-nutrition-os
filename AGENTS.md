- Nutrition logic lives untouched in `src/engine/*.js` (ported from douphealth/family-nutrition-os) with loose `.d.ts` siblings; UI must call it rather than re-deriving numbers, so figures stay traceable to USDA/EFSA.
- App state (profiles, logs, weigh-ins, shopping ticks) is stored in localStorage via `src/lib/store.ts`; selectors must return stable references (use shared empty constants) to avoid render loops.
- Supplemental basketball sessions use the recovered pure planners in `src/training`; keep dated team commitments, reported readiness, planned minutes and completed minutes distinct to avoid fabricated clearance or workload metrics.
- Public repository delivery must preserve its standalone Vite/GitHub Pages configuration rather than export the preview harness configuration, so the hosted app has no platform runtime dependency.
- Translate canonical content at React render time through `src/lib/i18n`; never mutate rendered DOM or nutritional data, so language changes cannot affect calculations or reconciliation.
- Date-sensitive device-local pages render behind ClientOnly and use local date updates, so static Pages output cannot contain stale dates or timezone-dependent hydration mismatches.

- Non-athlete member plans use conservative age-aware defaults and immutable completed-minute logs; changes to a future plan must not rewrite completed workload.
