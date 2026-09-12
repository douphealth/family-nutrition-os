/**
 * ZENITH PRO · data & engine integration tests
 * ---------------------------------------------------------------------------
 * Guards the things that are easy to break silently when editing data.js:
 * plan references, slot alignment, aisle validity, and the macro-scaling
 * contract between the engine and the UI.
 *
 * Run: node tests/data-integrity.test.mjs
 */

import assert from 'node:assert/strict';
import { RECIPES, PLAN_28, AISLES, FAMILY, SLOTS, SOURCES, METHOD } from '../src/data.js';
import {
  kcalFromMacros, mealMacros, dayMacros, targetsFor, planCoverage,
  weightTrend, loggingStreak, loggingCompleteness, weeklyAdherence
} from '../src/nutrition-engine.js';

const byId = new Map(RECIPES.map(r => [r.id, r]));
const recipeById = id => byId.get(id);
const aisleIds = new Set(AISLES.map(a => a.id));

/* ── Recipe data ───────────────────────────────────────────────────────── */

assert.equal(byId.size, RECIPES.length, 'recipe ids must be unique');
assert.ok(RECIPES.length >= 20, 'library should be substantial');

for (const r of RECIPES) {
  assert.ok(SLOTS.includes(r.slot), `${r.id}: slot must be one of ${SLOTS.join('/')}`);
  assert.ok(r.time > 0, `${r.id}: needs a prep time`);
  assert.ok(Array.isArray(r.steps) && r.steps.length >= 2, `${r.id}: needs at least two steps`);
  assert.ok(Array.isArray(r.ingredients) && r.ingredients.length >= 2, `${r.id}: needs ingredients`);
  for (const ing of r.ingredients) {
    assert.ok(aisleIds.has(ing.a), `${r.id}/${ing.n}: unknown aisle "${ing.a}"`);
    assert.ok(ing.q > 0, `${r.id}/${ing.n}: quantity must be positive`);
    assert.ok(typeof ing.u === 'string' && ing.u.length, `${r.id}/${ing.n}: missing unit`);
  }
  for (const key of ['p', 'c', 'f']) {
    assert.ok(Number.isFinite(r.base[key]), `${r.id}: base.${key} must be numeric`);
  }
  assert.ok(kcalFromMacros(r.base) > 80, `${r.id}: implausible energy`);
}

/* ── 28-day rotation ───────────────────────────────────────────────────── */

assert.equal(PLAN_28.length, 28, 'rotation must be exactly 28 days');
assert.equal(new Set(PLAN_28.map(d => d.day)).size, 28, 'day numbers must be unique');

const usage = new Map();
for (const day of PLAN_28) {
  assert.ok(day.week >= 1 && day.week <= 4, `day ${day.day}: week out of range`);
  for (const slot of SLOTS) {
    const id = day[slot];
    assert.ok(byId.has(id), `day ${day.day}/${slot}: references missing recipe "${id}"`);
    assert.equal(byId.get(id).slot, slot, `day ${day.day}/${slot}: "${id}" is a ${byId.get(id).slot} recipe`);
    usage.set(id, (usage.get(id) || 0) + 1);
  }
}
const unused = RECIPES.filter(r => !usage.has(r.id)).map(r => r.id);
assert.deepEqual(unused, [], `every recipe should appear in the rotation, unused: ${unused.join(', ')}`);

/* ── Sources are real links ────────────────────────────────────────────── */

assert.ok(SOURCES.length >= 8, 'should cite a meaningful number of sources');
for (const s of SOURCES) {
  assert.match(s.url, /^https:\/\//, `${s.id}: sources must be https`);
  assert.ok(s.used && s.used.length > 5, `${s.id}: must state what it is used for`);
}
assert.ok(METHOD.length >= 4, 'methodology must be documented in-app');

/* ── Macro scaling contract ────────────────────────────────────────────── */

const son = FAMILY.find(f => f.id === 'son');
const mother = FAMILY.find(f => f.id === 'mother');
const day = PLAN_28[0];
const breakfast = byId.get(day.breakfast);

// Nothing logged means nothing confirmed — planned intake is never consumption.
const empty = dayMacros(day, son, 'game', {}, recipeById);
assert.equal(empty.confirmed.kcal, 0, 'unlogged meals must not count as consumed');
assert.deepEqual(empty.confirmedSlots, []);
assert.ok(empty.planned.kcal > 0, 'the plan itself still has an energy value');

// Confirmed intake scales with the logged portion.
const oneX = mealMacros(breakfast, son, 'game', 1);
const logged = dayMacros(day, son, 'game', { meals: { breakfast: { status: 'done', portion: 1.25 } } }, recipeById);
assert.equal(logged.confirmed.kcal, Math.round(oneX.kcal * 1.25), 'portion multiplier must scale energy');
assert.deepEqual(logged.confirmedSlots, ['breakfast']);

// Energy is always derived from macros, never stored separately.
for (const p of FAMILY) {
  const m = mealMacros(breakfast, p, 'normal', 1);
  assert.equal(m.kcal, kcalFromMacros(m), `${p.name}: kcal must equal Atwater(macros)`);
}

// A skipped meal is neither planned-consumed nor silently ignored.
const skipped = dayMacros(day, son, 'game', { meals: { lunch: { status: 'skipped' } } }, recipeById);
assert.equal(skipped.confirmed.kcal, 0);
assert.equal(skipped.detail.find(d => d.slot === 'lunch').skipped, true);

// Extras count toward confirmed only.
const withExtra = dayMacros(day, son, 'game', { extras: [{ id: 'x1', recipeId: 'yogSnack', portion: 1 }] }, recipeById);
assert.ok(withExtra.confirmed.kcal > 0, 'extras must add to confirmed intake');
assert.equal(withExtra.planned.kcal, empty.planned.kcal, 'extras must not change the plan');
assert.equal(withExtra.extras.length, 1);

// Athlete training load raises carbohydrate portions, not fat.
const restPortion = mealMacros(byId.get('pastaVeg'), son, 'rest', 1);
const gamePortion = mealMacros(byId.get('pastaVeg'), son, 'game', 1);
assert.ok(gamePortion.c > restPortion.c, 'game load must raise carbs');
assert.equal(gamePortion.f, restPortion.f, 'training load must not change fat');

/* ── Coverage: additions only, never restriction ───────────────────────── */

const snackPool = RECIPES.filter(r => r.slot === 'snack');
for (const p of FAMILY) {
  const load = p.athlete ? 'game' : 'normal';
  const totals = dayMacros(day, p, load, {}, recipeById);
  const coverage = planCoverage(p, load, totals, targetsFor(p, load), snackPool);

  assert.ok(coverage.gapKcal >= 0, `${p.name}: gap must never be negative`);
  assert.ok(coverage.proteinGap >= 0, `${p.name}: protein gap must never be negative`);
  if (coverage.gapKcal >= 220) {
    assert.ok(coverage.extras.length > 0, `${p.name}: an energy gap must come with a suggestion`);
  } else {
    assert.equal(coverage.extras.length, 0, `${p.name}: no suggestion when the plan already fits`);
  }
  // Every suggestion must be an addition of real food.
  for (const extra of coverage.extras) {
    assert.ok(kcalFromMacros(extra.base) > 0, 'suggested extra must have energy');
  }
}

// A plan that already exceeds the estimate must produce no additions at all.
const covered = planCoverage(son, 'game', { planned: { kcal: 5000, p: 200, c: 600, f: 150 } }, targetsFor(son, 'game'), snackPool);
assert.equal(covered.extras.length, 0);
assert.equal(covered.gapKcal, 0);
assert.equal(covered.status, 'over');

/* ── Trends ────────────────────────────────────────────────────────────── */

assert.equal(weightTrend([]).count, 0);
assert.equal(weightTrend([]).slopePerWeek, null);
assert.equal(weightTrend([{ date: '2026-08-01', weight: 80 }]).slopePerWeek, null, 'one point is noise, not a trend');

const down = weightTrend([
  { date: '2026-08-01', weight: 88.0 },
  { date: '2026-08-08', weight: 87.4 },
  { date: '2026-08-15', weight: 87.1 },
  { date: '2026-08-22', weight: 86.6 }
]);
assert.equal(down.direction, 'down');
assert.ok(down.slopePerWeek < 0, 'a falling series must have a negative slope');
assert.equal(down.change, -1.4);
assert.equal(down.count, 4);

// Out-of-order input must still produce a correct trend.
const shuffled = weightTrend([
  { date: '2026-08-15', weight: 87.1 },
  { date: '2026-08-01', weight: 88.0 },
  { date: '2026-08-22', weight: 86.6 }
]);
assert.equal(shuffled.points[0].date, '2026-08-01', 'points must be sorted by date');

/* ── Streaks & completeness ────────────────────────────────────────────── */

assert.equal(loggingStreak(['2026-09-10', '2026-09-11', '2026-09-12'], '2026-09-12'), 3);
assert.equal(loggingStreak(['2026-09-10'], '2026-09-12'), 0);
assert.equal(loggingStreak(['2026-09-10', '2026-09-11'], '2026-09-12'), 2, 'an unlogged today must not break the streak');
assert.equal(loggingStreak([], '2026-09-12'), 0);

const comp = loggingCompleteness(day, { meals: { breakfast: { status: 'done' } }, waterMl: 1000 }, { ml: 2000 });
assert.equal(comp.mealsDone, 1);
assert.equal(comp.mealsTotal, 4);
assert.ok(Math.abs(comp.waterPct - 0.5) < 1e-9);

const adherence = weeklyAdherence(
  [{ date: '2026-09-07', meals: { breakfast: { status: 'done' }, lunch: { status: 'skipped' } } }],
  ['2026-09-07', '2026-09-08']
);
assert.equal(adherence[0].meals, 1);
assert.equal(adherence[0].skipped, 1);
assert.equal(adherence[0].logged, true);
assert.equal(adherence[1].logged, false, 'a day with no record must not read as logged');

console.log('data-integrity tests: PASS');
