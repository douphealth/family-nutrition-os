<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Nutrition logic lives untouched in `src/engine/*.js` (ported from douphealth/family-nutrition-os) with loose `.d.ts` siblings; UI must call it rather than re-deriving numbers, so figures stay traceable to USDA/EFSA.
- App state (profiles, logs, weigh-ins, shopping ticks) is stored in localStorage via `src/lib/store.ts`; selectors must return stable references (use shared empty constants) to avoid render loops.
- Supplemental basketball sessions use the recovered pure planners in `src/training`; keep dated team commitments, reported readiness, planned minutes and completed minutes distinct to avoid fabricated clearance or workload metrics.
- Public repository delivery must preserve its standalone Vite/GitHub Pages configuration rather than export the preview harness configuration, so the hosted app has no platform runtime dependency.
- Translate canonical content at React render time through `src/lib/i18n`; never mutate rendered DOM or nutritional data, so language changes cannot affect calculations or reconciliation.
- Date-sensitive device-local pages render behind ClientOnly and use local date updates, so static Pages output cannot contain stale dates or timezone-dependent hydration mismatches.

- Non-athlete member plans use conservative age-aware defaults and immutable completed-minute logs; changes to a future plan must not rewrite completed workload.
- Persist validated household state in IndexedDB with an immediate localStorage mirror and leaf-level tab merges, so reloads preserve data without discarding unrelated member edits.
- Completion summaries count only eaten meal slots, explicitly completed member/supplement sessions and member-reported activity logs; recorded minutes never come from a newly edited plan.
- Routine analytics aggregate existing completion records locally over completed calendar days; do not transmit household data or infer training adherence from mutable plans.
- Basketball skill resources are bilingual learning content separate from the workload planner; saved coach priorities must never add minutes, sessions, or execution clearance.
