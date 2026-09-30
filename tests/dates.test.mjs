/**
 * ZENITH PRO · calendar & rotation tests
 * ---------------------------------------------------------------------------
 * The 28-day rotation is keyed off the calendar. Before v13 the day index was
 * computed from `Math.floor(localMidnightDiff / 86400000)`, which is one hour
 * short for every day between the spring and autumn clock changes. In Greece
 * that meant that from late March to late October the whole plan — and the
 * "this week" shopping list built from it — ran one day behind, and the two
 * clock changes each repeated or skipped a day. CI runs in UTC, where none of
 * that is visible, so it shipped.
 *
 * These assertions are therefore run under several timezones by
 * `tests/timezone-matrix.test.mjs`. Run one directly with e.g.
 *     TZ=Europe/Athens node tests/dates.test.mjs
 */

import assert from 'node:assert/strict';
import {
  CYCLE_LENGTH, CYCLE_EPOCH, dayNumber, localDateKey, dateFromKey, addDays, mondayOf,
  cycleDayIndex, cycleWeek
} from '../src/dates.js';

const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const weekdayIndex = key => (dateFromKey(key).getDay() + 6) % 7; // Monday = 0

/* ── Keys round-trip and never drift ───────────────────────────────────── */

for (const key of ['2026-03-28', '2026-03-29', '2026-03-30', '2026-10-24', '2026-10-25', '2026-10-26', '2027-01-01']) {
  assert.equal(localDateKey(dateFromKey(key)), key, `${zone}: ${key} must round-trip`);
}
assert.equal(addDays('2026-03-28', 2), '2026-03-30', `${zone}: addDays across the spring clock change`);
assert.equal(addDays('2026-10-24', 2), '2026-10-26', `${zone}: addDays across the autumn clock change`);
assert.equal(addDays('2026-12-31', 1), '2027-01-01', `${zone}: addDays across new year`);
assert.equal(addDays('2028-02-28', 1), '2028-02-29', `${zone}: leap day exists`);
assert.equal(mondayOf(dateFromKey('2026-09-30')), '2026-09-28', `${zone}: Wednesday 30 Sep belongs to the week of Monday 28 Sep`);
assert.equal(mondayOf(dateFromKey('2026-10-04')), '2026-09-28', `${zone}: Sunday belongs to the week that started the Monday before`);

/* ── dayNumber counts calendar days, not elapsed hours ─────────────────── */

assert.equal(dayNumber('2026-03-30') - dayNumber('2026-03-29'), 1, `${zone}: consecutive days differ by exactly 1`);
assert.equal(dayNumber('2026-10-26') - dayNumber('2026-10-25'), 1, `${zone}: consecutive days differ by exactly 1`);
assert.equal(dayNumber('2027-01-01') - dayNumber('2026-01-01'), 365);
assert.equal(dayNumber('2028-01-01') - dayNumber('2027-01-01'), 365);
assert.equal(dayNumber('2029-01-01') - dayNumber('2028-01-01'), 366);
assert.equal(dayNumber(dateFromKey('2026-06-15')), dayNumber('2026-06-15'), `${zone}: Date and key agree`);

/* ── The rotation ──────────────────────────────────────────────────────── */

assert.equal(CYCLE_LENGTH, 28);
assert.equal(weekdayIndex(CYCLE_EPOCH), 0, 'the rotation epoch must be a Monday');
assert.equal(cycleDayIndex(dateFromKey(CYCLE_EPOCH)), 1, 'epoch is day 1 of the rotation');

// Pinned so a refactor cannot silently move every family onto a different menu:
// this is the week-4 Monday the app has shown users since v12.
assert.equal(cycleDayIndex(dateFromKey('2026-09-28')), 22, `${zone}: 28 Sep 2026 is Monday of week 4`);
assert.equal(cycleDayIndex(dateFromKey('2026-09-30')), 24, `${zone}: 30 Sep 2026 is Wednesday of week 4`);
assert.equal(cycleWeek(dateFromKey('2026-09-30')), 4);

// Every date lines up with its weekday, and consecutive days advance by exactly one
// — through both clock changes and across every new year in the window.
let steps = 0;
for (let key = '2025-01-01'; key < '2030-01-01'; key = addDays(key, 1)) {
  const d = dateFromKey(key);
  const idx = cycleDayIndex(d);
  assert.ok(idx >= 1 && idx <= 28, `${zone}: ${key} index ${idx} out of range`);
  assert.equal((idx - 1) % 7, weekdayIndex(key), `${zone}: ${key} plan day ${idx} must fall on its own weekday`);
  const next = cycleDayIndex(dateFromKey(addDays(key, 1)));
  assert.equal(((next - idx) % 28 + 28) % 28, 1, `${zone}: ${key} -> next day must advance the rotation by one`);
  steps++;
}
assert.ok(steps > 1800, 'walked five years of days');

// Time of day never changes which plan day it is (the old code was hour-sensitive).
for (const hour of [0, 1, 3, 12, 23]) {
  assert.equal(cycleDayIndex(new Date(2026, 9, 25, hour, 30)), cycleDayIndex(dateFromKey('2026-10-25')),
    `${zone}: 25 Oct ${hour}:30 must map to the same plan day as midnight`);
}

console.log(`dates tests: PASS (${zone})`);
