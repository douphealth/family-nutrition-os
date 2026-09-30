/**
 * ZENITH PRO · timezone matrix
 * ---------------------------------------------------------------------------
 * Re-runs the calendar suite in a fresh process for each timezone, because the
 * host timezone is fixed at process start. A single-zone CI run (UTC) cannot see
 * daylight-saving bugs, which is exactly how the v12 plan-off-by-a-day bug
 * reached production for a household in Athens.
 *
 * The zones are chosen to cover the shapes of clock change that exist:
 *   - no change at all (UTC, Asia/Kolkata with its half-hour offset)
 *   - northern-hemisphere spring/autumn (Europe/Athens — the household's own zone)
 *   - the US schedule, a different weekend (America/New_York)
 *   - southern hemisphere, change straddling new year (Pacific/Auckland)
 *   - a 30-minute clock change (Australia/Lord_Howe)
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const suite = fileURLToPath(new URL('./dates.test.mjs', import.meta.url));
const ZONES = [
  'UTC', 'Europe/Athens', 'Europe/London', 'America/New_York', 'America/Sao_Paulo',
  'Asia/Kolkata', 'Pacific/Auckland', 'Australia/Lord_Howe'
];

for (const TZ of ZONES) {
  const run = spawnSync(process.execPath, [suite], { env: { ...process.env, TZ }, encoding: 'utf8' });
  assert.equal(run.status, 0, `dates suite failed in ${TZ}:\n${run.stdout}\n${run.stderr}`);
  assert.match(run.stdout, /dates tests: PASS/, `${TZ}: suite did not report success`);
}

console.log(`timezone matrix: PASS (${ZONES.length} zones)`);
