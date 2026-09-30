/**
 * ZENITH PRO · reference values and physiology
 * ---------------------------------------------------------------------------
 * Every figure the app compares a day against is quoted from a primary source.
 * These tests pin the figures to that source, so a "tidy-up" of a number cannot
 * quietly turn a fact into folklore.
 *
 *   EFSA  Summary of Dietary Reference Values, version 4 (Sept 2017)
 *         https://www.efsa.europa.eu/sites/default/files/assets/DRV_Summary_tables_jan_17.pdf
 *   WHO   Healthy diet fact sheet — "salt intake should be limited to less than
 *         5 grams per day (2 grams per day sodium)" for adults.
 *   Schofield (1985) — the FAO/WHO/UNU resting-energy equations for ages 10–18.
 *
 * Run: node tests/reference.test.mjs
 */

import assert from 'node:assert/strict';
import { FAMILY } from '../src/data.js';
import {
  totalWaterAI, hydrationTarget, referenceValues, saltGrams, energyRange, proteinRange,
  DRINKS_SHARE, isMinor
} from '../src/nutrition-engine.js';

const member = id => FAMILY.find(p => p.id === id);
const at = (age, sex) => ({ age, sex, weight: 60, height: 165, athlete: false, goal: 'maintain', activityFactor: 1.6 });

/* ── EFSA total-water Adequate Intake (Table 3) ────────────────────────── */

assert.equal(totalWaterAI(at(6, 'f')), 1.6, '4–8 y: 1.6 L');
assert.equal(totalWaterAI(at(10, 'm')), 2.1, '9–13 y boys: 2.1 L');
assert.equal(totalWaterAI(at(10, 'f')), 1.9, '9–13 y girls: 1.9 L');
assert.equal(totalWaterAI(at(15, 'm')), 2.5, '14+ y men/boys: 2.5 L');
assert.equal(totalWaterAI(at(17, 'f')), 2.0, '14+ y women/girls: 2.0 L');
assert.equal(totalWaterAI(at(54, 'm')), 2.5);
assert.equal(totalWaterAI(at(51, 'f')), 2.0);

// The drinks target is the EFSA figure × the drinks share — not a body-weight formula:
// the heaviest member must NOT automatically get the largest target.
assert.equal(DRINKS_SHARE, 0.8);
assert.equal(hydrationTarget(member('mother')).ml, 1600, 'an 87 kg woman: EFSA 2.0 L × 0.8, not 87 × 30 ml');
assert.equal(hydrationTarget(member('father')).ml, 2000);
assert.equal(hydrationTarget(member('daughter')).ml, 1600);
assert.equal(hydrationTarget(member('son'), 'normal').ml, 2500, 'the athlete adds a training top-up to 2.0 L');
assert.equal(hydrationTarget({ ...member('mother'), weight: 120 }).ml, hydrationTarget(member('mother')).ml, 'body weight does not move the target');
assert.ok(hydrationTarget(member('son'), 'tournament').ml > hydrationTarget(member('son'), 'rest').ml);
for (const p of FAMILY) {
  const h = hydrationTarget(p, 'normal');
  assert.equal(h.ml % 50, 0, `${p.id}: target rounds to 50 ml`);
  assert.ok(h.ml <= totalWaterAI(p) * 1000 + 1200, `${p.id}: a drinks target must not wildly exceed the EFSA total-water AI`);
}

/* ── EFSA fibre, calcium, iron (Tables 3, 5, 7) ────────────────────────── */

const fibre = (age, sex = 'f') => referenceValues(at(age, sex)).fibre.g;
assert.deepEqual([fibre(5), fibre(8), fibre(12), fibre(16), fibre(18), fibre(54)], [14, 16, 19, 21, 25, 25], 'fibre AI: 4–6 y 14 · 7–10 y 16 · 11–14 y 19 · 15–17 y 21 · adults 25');

const calcium = age => referenceValues(at(age, 'f')).calcium.mg;
assert.deepEqual([calcium(8), calcium(12), calcium(17), calcium(20), calcium(25), calcium(54)], [800, 1150, 1150, 1000, 950, 950], 'calcium PRI: 4–10 y 800 · 11–17 y 1,150 · 18–24 y 1,000 · 25+ y 950');

const iron = (age, sex) => referenceValues(at(age, sex)).iron;
assert.equal(iron(15, 'm').mg, 11, 'boys 12–17 y: 11 mg');
assert.equal(iron(17, 'f').mg, 13, 'girls 12–17 y: 13 mg');
assert.equal(iron(54, 'm').mg, 11, 'men: 11 mg');
assert.equal(iron(30, 'f').mg, 16, 'premenopausal women: 16 mg');
assert.equal(iron(60, 'f').mg, 11, 'postmenopausal women: 11 mg');
assert.deepEqual([iron(51, 'f').min, iron(51, 'f').max], [11, 16], 'around the menopause the range is shown and the cautious end used');
assert.equal(iron(51, 'f').mg, 16);

/* ── WHO sodium / salt ─────────────────────────────────────────────────── */

for (const p of FAMILY) {
  const r = referenceValues(p);
  assert.equal(r.sodium.maxMg, 2000, `${p.id}: WHO < 2 g sodium a day`);
  assert.equal(r.sodium.saltG, 5, `${p.id}: which is 5 g of salt`);
}
assert.equal(saltGrams(2000), 5, 'salt = sodium × 2.5');
assert.equal(saltGrams(1140), 2.9, 'e.g. 100 g of feta carries 2.9 g of salt');
assert.equal(saltGrams(0), 0);

/* ── Schofield (1985), ages 10–18, pinned to the published constants ───── */

// Boys 17.686 W + 658.2 · Girls 13.384 W + 692.6 (kcal/day). Energy range = centre ± 10 %.
const teen = (sex, weight, factor) => ({ sex, age: 15, weight, height: 170, athlete: false, goal: 'growth', activityFactor: factor });
const center = p => { const e = energyRange(p); return (e.lower + e.upper) / 2; };
{
  const boy = teen('m', 60, 1.6);
  const expected = (17.686 * 60 + 658.2) * 1.6;
  assert.ok(Math.abs(center(boy) - expected) / expected < 0.03, `boy: ${center(boy)} vs ${expected}`);
  const girl = teen('f', 55, 1.6);
  const expectedG = (13.384 * 55 + 692.6) * 1.6;
  assert.ok(Math.abs(center(girl) - expectedG) / expectedG < 0.03, `girl: ${center(girl)} vs ${expectedG}`);
}

/* ── Cross-check against EFSA's Average Requirements for energy ────────── */

// EFSA Table 1: 15-year-old boy, 11.3 / 12.7 / 14.1 MJ/day at PAL 1.4 / 1.6 / 1.8 (1 MJ = 238.83 kcal).
// The household's athlete (15 y, 67 kg, basketball, normal training) must sit inside that band.
{
  const son = member('son');
  const band = [11.3 * 238.83, 14.1 * 238.83];
  const c = center(son);
  assert.ok(c >= band[0] && c <= band[1], `the athlete's estimate ${Math.round(c)} kcal lies within EFSA's PAL 1.4–1.8 band ${Math.round(band[0])}–${Math.round(band[1])}`);
  // 17-year-old girl, 9.5 / 10.7 / 11.9 MJ at PAL 1.4 / 1.6 / 1.8 for a reference weight of ~58 kg; the daughter is lighter.
  const daughter = member('daughter');
  const dc = center(daughter);
  assert.ok(dc >= 8.0 * 238.83 && dc <= 11.9 * 238.83, `the daughter's estimate ${Math.round(dc)} kcal is physiologically plausible for a 17-year-old`);
}

/* ── The protection of minors survives all of it ───────────────────────── */

for (const p of FAMILY.filter(isMinor)) {
  assert.notEqual(p.goal, 'gradual_fat_loss', `${p.id}: a minor never holds a deficit goal`);
  const e = energyRange(p);
  assert.ok(e.lower >= 1800, `${p.id}: a minor's energy range is never restrictive (lower bound ${e.lower})`);
}
assert.ok(proteinRange(member('mother')).min > proteinRange(member('father')).min, 'protein scales with body weight and goal');

console.log('reference tests: PASS');
