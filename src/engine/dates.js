/**
 * ZENITH PRO · calendar
 * ---------------------------------------------------------------------------
 * Pure date helpers. No DOM, no storage — imported by the engine, the UI and the
 * tests alike.
 *
 * Why this file exists: everything the household sees — today's meals, the plan
 * week, the shopping list — is a function of the calendar date, so a one-day
 * error here is an error everywhere. The rule that keeps it correct is:
 *
 *   COUNT CALENDAR DAYS, NEVER ELAPSED MILLISECONDS.
 *
 * A local "midnight to midnight" span is 23 or 25 hours on a clock-change day,
 * so `Math.floor(ms / 86400000)` under-counts by one for the whole summer in
 * Greece. `dayNumber()` reads the year/month/day fields and counts in UTC, where
 * every day is exactly 24 hours long.
 */

const MS_PER_DAY = 86_400_000;

/** Length of the meal rotation, and the Monday that is day 1 of week 1. */
export const CYCLE_LENGTH = 28;
export const CYCLE_EPOCH = '2024-01-01'; // a Monday

const pad = n => String(n).padStart(2, '0');

/** Local calendar date as `YYYY-MM-DD`. */
export function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight of a `YYYY-MM-DD` key. */
export function dateFromKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Integer days since 1970-01-01 of a calendar date (a key or a Date). DST-proof. */
export function dayNumber(input) {
  if (typeof input === 'string') {
    const [y, m, d] = input.split('-').map(Number);
    return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / MS_PER_DAY);
  }
  const d = input instanceof Date ? input : new Date(input);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY);
}

/** `key` moved by `n` calendar days. */
export function addDays(key, n) {
  const d = dateFromKey(key);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
}

/** Monday = 0 … Sunday = 6, for a Date or a key. */
export function weekdayIndex(input = new Date()) {
  const d = typeof input === 'string' ? dateFromKey(input) : input;
  return (d.getDay() + 6) % 7;
}

/** Monday of the week containing `input` (a Date or a key), as a date key. */
export function mondayOf(input = new Date()) {
  const d = typeof input === 'string' ? dateFromKey(input) : input;
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - weekdayIndex(copy));
  return localDateKey(copy);
}

/**
 * 1..28 position in the meal rotation. Anchored to a fixed Monday so it is
 * continuous across new year (the pre-v13 code re-anchored on 1 January) and
 * so every Monday is the first day of a rotation week.
 */
export function cycleDayIndex(input = new Date()) {
  const delta = dayNumber(input) - dayNumber(CYCLE_EPOCH);
  return ((delta % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH + 1;
}

/** 1..4 rotation week. */
export function cycleWeek(input = new Date()) {
  return Math.ceil(cycleDayIndex(input) / 7);
}
