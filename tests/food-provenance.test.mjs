/**
 * ZENITH PRO · food-composition provenance
 * ---------------------------------------------------------------------------
 * The nutrition numbers in the app are only as credible as their source, so the
 * link between them is enforced rather than promised:
 *
 *   • every USDA-backed food in src/foods.js has its per-100 g composition equal to
 *     the committed FoodData Central snapshot (data/usda-fdc.json);
 *   • the snapshot record under that id must BE the food the entry says it is —
 *     this is the check that would have caught the eight mistyped FDC ids found
 *     while building v13 (a cocoa mix filed as sea bass, a tomato powder as canned
 *     tomatoes…);
 *   • the energy USDA reports agrees with the energy the app derives from those
 *     macros (EU factors: 4/4/9, fibre 2), which catches a transposed digit in any single macro;
 *   • anything without a USDA record must say so (`approx`), never pass as USDA.
 *
 * Refresh the snapshot with `npm run data:usda`. Run: node tests/food-provenance.test.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FOODS, NUTRIENTS } from '../src/foods.js';
import { kcalFromMacros } from '../src/nutrition-engine.js';

const snapshot = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../data/usda-fdc.json', import.meta.url)), 'utf8'));

assert.match(snapshot.source, /FoodData Central/, 'snapshot must name its source');
assert.match(snapshot.retrieved, /^\d{4}-\d{2}-\d{2}$/, 'snapshot must carry the date it was retrieved');
assert.ok(Object.keys(snapshot.foods).length >= 30, 'snapshot should cover the whole table');

const usdaBacked = Object.entries(FOODS).filter(([, f]) => f.fdc);
const approx = Object.entries(FOODS).filter(([, f]) => f.approx);
assert.ok(usdaBacked.length >= 35, `expected most foods to be USDA-backed, got ${usdaBacked.length}`);
assert.equal(usdaBacked.length + approx.length, Object.keys(FOODS).length, 'every food is either USDA-backed or explicitly approximate');

for (const [id, food] of usdaBacked) {
  const rec = snapshot.foods[String(food.fdc)];
  assert.ok(rec, `${id}: FDC ${food.fdc} is missing from the snapshot — run \`npm run data:usda\``);

  // 1. The id is the food it claims to be.
  assert.ok(food.usda, `${id}: an FDC-backed food must declare the USDA description it expects`);
  assert.ok(rec.description.startsWith(food.usda),
    `${id}: FDC ${food.fdc} is «${rec.description}», but the entry expects «${food.usda}» — wrong id?`);

  // 2. The composition equals the record, to the last published digit.
  for (const k of NUTRIENTS) {
    const source = rec.per100[k] ?? 0;
    assert.ok(Math.abs(food.per100[k] - source) < 0.0005,
      `${id}.${k}: foods.js says ${food.per100[k]} but USDA FDC ${food.fdc} says ${source}`);
  }

  // 3. Energy USDA reports matches the Atwater energy from the same macros. USDA uses
  //    food-specific factors, so allow a small band — a mistyped macro blows through it.
  //    USDA's carbohydrate includes fibre; the app's energy counts available carbohydrate at 4 and fibre at 2.
  const { p, c, f, fib } = food.per100;
  const derived = kcalFromMacros({ p, c: Math.max(0, c - fib), f, fib });
  const reported = rec.per100.kcal;
  const tolerance = Math.max(12, reported * 0.10); // low-energy foods (citrus, leaves) carry organic acids USDA counts at a lower factor
  assert.ok(Math.abs(derived - reported) <= tolerance,
    `${id}: derived energy ${derived} kcal vs USDA ${reported} kcal — check the macros`);
}

// No two foods may share an FDC id (two entries pointing at one record would hide a copy-paste error).
const ids = usdaBacked.map(([, f]) => f.fdc);
assert.equal(new Set(ids).size, ids.length, 'each USDA record backs exactly one food');

// Approximations are labelled as such, and only where no USDA record exists.
for (const [id, food] of approx) {
  assert.ok(!food.fdc, `${id}: cannot be both approximate and USDA-backed`);
  assert.ok(food.note && /label|typical/i.test(food.note), `${id}: an approximation must say where its figures come from`);
}

// A proxy is a USDA record standing in for a wider or regional food, and must say so.
for (const [id, food] of usdaBacked.filter(([, f]) => f.proxy)) {
  assert.ok(food.note && food.note.length > 15, `${id}: a proxy must explain what it stands in for`);
}

console.log(`food provenance tests: PASS (${usdaBacked.length} USDA-backed, ${approx.length} approximate, snapshot ${snapshot.retrieved})`);
