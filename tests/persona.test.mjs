/**
 * ZENITH PRO · persona, fuelling & kitchen helpers
 * ---------------------------------------------------------------------------
 * Covers the v4 additions: the per-member focus points, the athlete fuelling
 * targets, iron-source selection, and the step-timer parsing that Cook Mode
 * relies on.
 *
 * The single most important assertion in this file is the minor-safety block:
 * a profile under MINOR_AGE must never be handed a deficit, a weight-loss rate,
 * or adult BMI framing — not even as a "point to watch".
 *
 * Run: node tests/persona.test.mjs
 */

import assert from 'node:assert/strict';
import { RECIPES, FAMILY, IRON_RICH, RECIPE_ART, PERSONA_FOCUS, FUELING } from '../src/data.js';
import {
  personaPoints, trainingFueling, ironMeals, targetsFor, isMinor,
  memberShare, householdServings
} from '../src/nutrition-engine.js';
import { parseStepTimers, clockText } from '../src/ui.js';

const byId = new Map(RECIPES.map(r => [r.id, r]));
const recipeById = id => byId.get(id);
const member = id => FAMILY.find(p => p.id === id);

const ctxFor = (profile, over = {}) => {
  const load = profile.athlete ? 'hard' : 'normal';
  return {
    trainingLoad: load,
    targets: targetsFor(profile, load),
    totals: { confirmed: { kcal: 900 }, groups: 3 },
    ironToday: [],
    hydrationMl: 500,
    measurements: 2,
    ...over
  };
};

/* ── New content integrity ─────────────────────────────────────────────── */

for (const id of IRON_RICH) {
  assert.ok(byId.has(id), `IRON_RICH references unknown recipe "${id}"`);
}
assert.equal(new Set(IRON_RICH).size, IRON_RICH.length, 'IRON_RICH must not repeat an id');
assert.ok(IRON_RICH.length >= 4, 'should list a useful number of iron sources');

for (const r of RECIPES) {
  assert.ok(typeof RECIPE_ART[r.id] === 'string' && RECIPE_ART[r.id].length,
    `${r.id}: missing an illustration motif`);
}
for (const [id, motif] of Object.entries(RECIPE_ART)) {
  assert.ok(byId.has(id), `RECIPE_ART references unknown recipe "${id}"`);
  assert.ok(/^[a-z]+$/.test(motif), `RECIPE_ART.${id}: motif "${motif}" should be a plain key`);
}
assert.ok(new Set(Object.values(RECIPE_ART)).size >= 8, 'illustrations should be visually varied');

for (const [goal, focus] of Object.entries(PERSONA_FOCUS)) {
  for (const key of ['eyebrow', 'title', 'lead']) {
    assert.ok(typeof focus[key] === 'string' && focus[key].trim().length,
      `PERSONA_FOCUS.${goal}.${key} is missing`);
  }
}
for (const key of ['pre', 'post', 'fluid']) {
  assert.ok(FUELING[key]?.title && FUELING[key]?.body && FUELING[key]?.icon,
    `FUELING.${key} is incomplete`);
}

/* Every household goal must have framing, or the persona card silently vanishes. */
for (const p of FAMILY) {
  assert.ok(PERSONA_FOCUS[p.goal], `${p.id}: goal "${p.goal}" has no PERSONA_FOCUS entry`);
}

/* ── personaPoints shape ───────────────────────────────────────────────── */

for (const p of FAMILY) {
  const points = personaPoints(p, ctxFor(p));
  assert.equal(points.length, 3, `${p.id}: should produce exactly three focus points`);
  for (const point of points) {
    assert.ok(point.key && point.icon && point.label && point.value && point.body,
      `${p.id}/${point.key}: incomplete focus point`);
    assert.ok(['accent', 'blue', 'rose', 'gold'].includes(point.tone),
      `${p.id}/${point.key}: unknown tone "${point.tone}"`);
  }
}

/* An empty payload must not throw — the card renders on a fresh install. */
for (const p of FAMILY) {
  assert.doesNotThrow(() => personaPoints(p, {}), `${p.id}: must tolerate an empty context`);
  assert.equal(personaPoints(p, {}).length, 3, `${p.id}: should still render three points`);
}

/* ── Minor safety ──────────────────────────────────────────────────────── */

const minors = FAMILY.filter(isMinor);
assert.ok(minors.length >= 1, 'the household should include at least one minor');

for (const p of minors) {
  const points = personaPoints(p, ctxFor(p, { measurements: 9, ironToday: [] }));
  const blob = JSON.stringify(points);

  assert.ok(!/kg\s*\/\s*εβδομάδα/i.test(blob), `${p.id}: a minor must never be given a weight-loss rate`);
  assert.ok(!/απώλεια λίπους/i.test(blob), `${p.id}: a minor must never be given a fat-loss goal`);
  assert.ok(!/έλλειμμα θερμίδων/i.test(blob) || /χωρίς έλλειμμα/i.test(blob) || /δεν εφαρμόζεται/i.test(blob),
    `${p.id}: any mention of a deficit must be a statement that it is NOT applied`);

  // A minor must never be shown a BMI figure. Mentioning BMI is allowed only to
  // say that adult BMI categories are not used — that is the protection itself.
  assert.ok(!/BMI/i.test(points.map(pt => pt.value).join(' ')),
    `${p.id}: a minor must never see a BMI figure as a focus value`);
  for (const point of points) {
    if (/BMI/i.test(point.body)) {
      assert.match(point.body, /δεν |χωρίς /i,
        `${p.id}/${point.key}: a mention of BMI for a minor must be a negation`);
    }
  }
}

/* The growth profile states its protection explicitly. */
const daughterPoints = personaPoints(member('daughter'), ctxFor(member('daughter')));
assert.ok(daughterPoints.some(pt => pt.key === 'noDeficit'),
  'the growth profile must state the minor protection explicitly');

/* The adult fat-loss profile does get a rate — the protection is specific to minors. */
const motherPoints = personaPoints(member('mother'), ctxFor(member('mother')));
assert.ok(motherPoints.some(pt => pt.key === 'rate'), 'the fat-loss profile should show a target rate');
assert.ok(/kg/.test(motherPoints.find(pt => pt.key === 'rate').value), 'the rate should be expressed in kg');

/* Iron is surfaced for the growth profile. */
const withIron = personaPoints(member('daughter'), ctxFor(member('daughter'), {
  ironToday: [{ slot: 'lunch', recipe: byId.get('lentils') }]
}));
const ironPoint = withIron.find(pt => pt.key === 'iron');
assert.ok(ironPoint, 'the growth profile should report iron sources');
assert.match(ironPoint.value, /1/, 'one iron meal should be reported as one');
assert.match(ironPoint.body, /Φακές/, 'the iron point should name the actual dish');

/* ── Athlete fuelling ──────────────────────────────────────────────────── */

for (const p of FAMILY.filter(p => !p.athlete)) {
  assert.equal(trainingFueling(p, 'hard'), null, `${p.id}: non-athletes must not receive fuelling targets`);
}

const son = member('son');
assert.ok(son.athlete, 'the son profile should be the athlete');

const rest = trainingFueling(son, 'rest');
const game = trainingFueling(son, 'game');
assert.ok(game.carbEmphasis > rest.carbEmphasis, 'a game day must emphasise carbohydrate more than a rest day');
assert.equal(game.heavy, true, 'game day should be flagged heavy');
assert.equal(rest.heavy, false, 'rest day should not be flagged heavy');
assert.equal(game.preCarbs.min, Math.round(1 * son.weight), 'pre carbs should start at 1 g/kg');
assert.equal(game.preCarbs.max, Math.round(3 * son.weight), 'pre carbs should top out at 3 g/kg');
assert.equal(game.postProtein, Math.round(0.3 * son.weight), 'post protein should be ~0.3 g/kg');
assert.equal(game.postCarbs, Math.round(1.0 * son.weight), 'post carbs should be ~1 g/kg');
assert.ok(game.postProtein > 0 && game.postCarbs > 0, 'post-session targets must be usable numbers');

/* Fuelling must scale with body mass, not be a fixed constant. */
const lighter = trainingFueling({ ...son, weight: 50 }, 'game');
const heavier = trainingFueling({ ...son, weight: 90 }, 'game');
assert.ok(heavier.postProtein > lighter.postProtein, 'fuelling must scale with body mass');

/* ── Iron selection ────────────────────────────────────────────────────── */

const hits = ironMeals({ breakfast: 'oats', lunch: 'lentils', dinner: 'omelet' }, recipeById, IRON_RICH);
assert.equal(hits.length, 1, 'only the lentil meal is an iron source here');
assert.equal(hits[0].slot, 'lunch');
assert.equal(hits[0].recipe.id, 'lentils');
assert.deepEqual(ironMeals({}, recipeById, IRON_RICH), [], 'an empty plan yields no iron meals');
assert.deepEqual(ironMeals({ lunch: 'lentils' }, recipeById, []), [], 'no iron list means no matches');
assert.deepEqual(ironMeals({ lunch: 'doesNotExist' }, recipeById, IRON_RICH), [],
  'unknown recipe ids must be ignored rather than crash');

/* ── Step timers ───────────────────────────────────────────────────────── */

assert.deepEqual(parseStepTimers('Βράσε τις φακές ~25′.').timers.map(t => t.minutes), [25]);
assert.deepEqual(parseStepTimers('Ψήσε 40′ στους 200°C.').timers.map(t => t.minutes), [40]);
assert.equal(parseStepTimers('Ψήσε 40′ στους 200°C.').ovenC, 200);
assert.equal(parseStepTimers('Ψήσε 40′ στους 200°C.').timers[0].seconds, 2400);
assert.deepEqual(parseStepTimers('Κόψε το φρούτο.').timers, [], 'a step with no time yields no timers');
assert.equal(parseStepTimers('Κόψε το φρούτο.').ovenC, null);
assert.equal(parseStepTimers('').ovenC, null);
assert.deepEqual(parseStepTimers("Ψήσε 12'").timers.map(t => t.minutes), [12], 'a plain apostrophe also counts');
assert.deepEqual(parseStepTimers('Περίμενε 0′.').timers, [], 'zero is not a timer');

/* Every real recipe step must parse without throwing. */
for (const r of RECIPES) {
  for (const step of r.steps) {
    assert.doesNotThrow(() => parseStepTimers(step), `${r.id}: step failed to parse`);
  }
}
/* And at least some steps must actually offer a timer, or Cook Mode is pointless. */
const timerSteps = RECIPES.flatMap(r => r.steps).filter(s => parseStepTimers(s).timers.length);
assert.ok(timerSteps.length >= 8, `expected several timed steps, found ${timerSteps.length}`);

/* ── Clock formatting ──────────────────────────────────────────────────── */

assert.equal(clockText(300), '05:00');
assert.equal(clockText(0), '00:00');
assert.equal(clockText(59), '00:59');
assert.equal(clockText(3599), '59:59');
assert.equal(clockText(-5), '00:00', 'negative input must clamp');
assert.equal(clockText(null), '00:00', 'null input must clamp');

/* ── Household shopping share ──────────────────────────────────────────────
 * The shopping list must reflect what each member actually eats. A flat
 * head-count (× 4) is wrong whenever portions differ, which they always do in
 * this family: the mother runs a 0,75× carb plate, the son a 1,35× fuelled one.
 */

const motherP = member('mother');
const sonP = member('son');
const daughterP = member('daughter');

assert.ok(memberShare(sonP) > memberShare(daughterP),
  'the fuelled athlete must count for more shopping than a growth-profile minor');
assert.ok(memberShare(motherP) < memberShare(daughterP),
  'the fat-loss plate must count for less shopping than a growth-profile minor');

const servings = householdServings(FAMILY);
assert.ok(servings > 4 && servings < 4.5, `household share should be near 4 but not exactly 4, got ${servings}`);
assert.notEqual(Math.round(servings * 100) / 100, 4, 'share must not collapse to a flat head-count');

assert.equal(householdServings([]), 1, 'empty household falls back to one serving');
assert.equal(householdServings(null), 1, 'null household falls back to one serving');
assert.ok(Number.isFinite(householdServings([{}])), 'a malformed member must not produce NaN');

// Every member must contribute a positive, finite share.
for (const p of FAMILY) {
  const s = memberShare(p);
  assert.ok(Number.isFinite(s) && s > 0, `member ${p.id} must have a positive finite share, got ${s}`);
}

console.log('persona & kitchen tests: PASS');
