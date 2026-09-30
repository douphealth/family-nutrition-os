/**
 * ZENITH PRO · the menu, the plate and the shopping list
 * ---------------------------------------------------------------------------
 * These assertions are about whether the food is REAL: the composition table is
 * internally possible, every recipe is a plausible meal, the 4-week rotation
 * follows the rules it documents, the plate sizing obeys the safety rules, and
 * the shopping list is a list a person could take to a shop.
 *
 * Run: node tests/menu.test.mjs
 */

import assert from 'node:assert/strict';
import { RECIPES, PLAN_28, FAMILY, SLOTS, AISLES, RECIPE_ART } from '../src/data.js';
import { FOODS, NUTRIENTS, gramsOf, qtyOf, roleWeights } from '../src/foods.js';
import {
  mealMacros, dayMacros, targetsFor, kcalFromMacros, scaledIngredients, householdPlate,
  householdRoleServings, plateScale, rotationEnergy, PLATE_MAX, PLATE_MIN, nutritionBadges,
  buildShoppingList, isMinor, energyRange
} from '../src/nutrition-engine.js';
import { addDays, dateFromKey, weekdayIndex, cycleDayIndex } from '../src/dates.js';

const byId = new Map(RECIPES.map(r => [r.id, r]));
const recipeById = id => byId.get(id);
const aisleIds = new Set(AISLES.map(a => a.id));
const member = id => FAMILY.find(p => p.id === id);
const sum = (xs, f = x => x) => xs.reduce((a, x) => a + f(x), 0);
const avg = (xs, f) => sum(xs, f) / xs.length;

/* ── The composition table is internally possible ──────────────────────── */

assert.ok(Object.keys(FOODS).length >= 35, 'the food table should be substantial');
const usedFoods = new Set(RECIPES.flatMap(r => r.ingredients.map(i => i.f)));
for (const [id, food] of Object.entries(FOODS)) {
  assert.ok(usedFoods.has(id), `${id}: food is in the table but no recipe uses it`);
  assert.ok(aisleIds.has(food.aisle), `${id}: unknown aisle "${food.aisle}"`);
  assert.ok(food.name && food.plural, `${id}: needs a singular and a plural name`);
  for (const k of NUTRIENTS) {
    assert.ok(Number.isFinite(food.per100[k]) && food.per100[k] >= 0, `${id}.${k}: must be a non-negative number`);
  }
  const { p, c, f, fib } = food.per100;
  assert.ok(p + c + f <= 100.5, `${id}: protein + carbohydrate + fat = ${(p + c + f).toFixed(1)} g in 100 g — impossible`);
  assert.ok(fib <= c + 0.05, `${id}: fibre (${fib}) cannot exceed total carbohydrate (${c}) — USDA carbohydrate includes fibre`);
  assert.ok(kcalFromMacros({ p, c, f }) <= 900, `${id}: more than 900 kcal per 100 g is impossible`);
  assert.ok(food.shop?.unit && food.shop.step > 0, `${id}: needs a shopping unit and step`);
  // Provenance must be stated one way or the other.
  assert.ok(food.fdc || food.approx, `${id}: must cite a USDA id or be flagged approximate`);
  assert.ok(!(food.fdc && food.approx), `${id}: cannot be both USDA-backed and approximate`);
  if (food.proxy) assert.ok(food.note, `${id}: a proxy must say what it stands in for`);
  const w = roleWeights(food);
  assert.ok(Math.abs(sum(Object.values(w)) - 1) < 1e-9, `${id}: role weights must sum to 1`);
  assert.ok(Object.keys(w).every(k => ['protein', 'carbs', 'fats', 'vegetables'].includes(k)), `${id}: unknown portion role`);
}
assert.equal(new Set(Object.values(FOODS).map(f => f.name)).size, Object.keys(FOODS).length, 'food names must be unique');

/* ── Every recipe is a plausible meal ──────────────────────────────────── */

const SLOT_BANDS = { breakfast: [350, 600], lunch: [500, 800], snack: [150, 450], dinner: [400, 650] };
for (const r of RECIPES) {
  for (const ing of r.ingredients) {
    assert.ok(FOODS[ing.f], `${r.id}: unknown food "${ing.f}"`);
    assert.ok(Math.abs(ing.g - gramsOf(ing)) < 1e-9, `${r.id}/${ing.f}: grams must match the unit conversion`);
    assert.ok(Math.abs(qtyOf(ing, ing.g) - ing.q) < 1e-9, `${r.id}/${ing.f}: qtyOf must invert gramsOf`);
  }
  assert.equal(new Set(r.ingredients.map(i => i.f)).size, r.ingredients.length, `${r.id}: a food appears twice in one recipe`);
  assert.ok(RECIPE_ART[r.id], `${r.id}: missing an illustration motif`);
  const kcal = kcalFromMacros(r.base);
  const [lo, hi] = SLOT_BANDS[r.slot];
  assert.ok(kcal >= lo && kcal <= hi, `${r.id}: ${kcal} kcal is outside the ${r.slot} band ${lo}–${hi}`);
  assert.ok(r.micro.na >= 0 && r.micro.fib >= 0 && r.micro.fe >= 0 && r.micro.ca >= 0, `${r.id}: micronutrients must be derived`);
}

/* ── Quantities are quantities a cook would actually use ───────────────── */

for (const r of RECIPES) {
  for (const ing of r.ingredients) {
    const food = FOODS[ing.f];
    if (food.pieceG) assert.ok(ing.g <= 3.5 * food.pieceG || ing.u === 'g', `${r.id}/${ing.f}: ${ing.q} pieces for one serving is implausible`);
    if (ing.f === 'onion') assert.ok(ing.g <= 60, `${r.id}: more than 60 g of onion per serving`);
    if (ing.f === 'oliveOil') assert.ok(ing.q <= 20, `${r.id}: more than 20 ml of olive oil per serving`);
    if (ing.f === 'lemon') assert.ok(ing.q <= 0.5, `${r.id}: more than half a lemon per serving`);
    if (['chicken', 'fish', 'beef'].includes(ing.f)) assert.ok(ing.g >= 120 && ing.g <= 220, `${r.id}: ${ing.g} g of ${ing.f} is not one serving`);
    if (['lentils', 'chickpeas', 'giantBeans', 'whiteBeans'].includes(ing.f)) assert.ok(ing.g >= 60 && ing.g <= 100, `${r.id}: ${ing.g} g of dry legumes is not one serving`);
  }
}

/* ── The rotation follows the rules it documents ───────────────────────── */

assert.equal(PLAN_28.length, 28);
const has = (recipe, tag) => recipe.tags.includes(tag);
for (let w = 0; w < 4; w++) {
  const week = PLAN_28.slice(w * 7, w * 7 + 7);
  const meals = week.flatMap(d => SLOTS.map(s => recipeById(d[s])));
  const legumeLunches = week.map(d => recipeById(d.lunch)).filter(r => has(r, 'legume'));
  assert.equal(legumeLunches.length, 3, `week ${w + 1}: three legume lunches`);
  assert.equal(new Set(legumeLunches.map(r => r.id)).size, 3, `week ${w + 1}: legume lunches must differ`);
  assert.equal(meals.filter(r => has(r, 'fish')).length, 2, `week ${w + 1}: fish twice`);
  assert.ok(has(recipeById(week[4].dinner), 'fish'), `week ${w + 1}: Friday dinner is fish`);
  assert.ok(has(recipeById(week[4].dinner), 'fish') && !has(recipeById(week[4].lunch), 'fish'), `week ${w + 1}: fish lunch and dinner must be different days`);
  assert.equal(meals.filter(r => r.ingredients.some(i => i.f === 'egg')).length, 4, `week ${w + 1}: egg meals (incl. the half egg in the meatballs)`);
  const wholeEggs = sum(meals, r => sum(r.ingredients.filter(i => i.f === 'egg'), i => i.q));
  assert.ok(wholeEggs <= 7.5, `week ${w + 1}: ${wholeEggs} eggs a week exceeds one a day`);
  assert.equal(week[1].snack, 'milkRecovery', `week ${w + 1}: Tuesday recovery snack`);
  assert.equal(week[3].snack, 'milkRecovery', `week ${w + 1}: Thursday recovery snack`);
  assert.equal(week[5].dinner, 'chickenSouvlaki', `week ${w + 1}: Saturday souvlaki`);
  assert.ok(meals.filter(r => r.ingredients.some(i => i.f === 'beef')).length <= 1, `week ${w + 1}: red meat at most once`);
}
for (const slot of SLOTS) {
  for (let i = 1; i < PLAN_28.length; i++) {
    assert.notEqual(PLAN_28[i][slot], PLAN_28[i - 1][slot], `day ${i + 1}/${slot}: the same dish two days running`);
  }
}
assert.ok(new Set(PLAN_28.map(d => d.breakfast)).size >= 5, 'breakfast should rotate through at least five dishes');
// No day may hold two egg-based meals (5+ eggs in a day) — the half egg binding the meatballs aside.
for (const d of PLAN_28) {
  const eggMeals = SLOTS.map(s => recipeById(d[s])).filter(r => r.ingredients.some(i => i.f === 'egg' && i.q >= 2));
  assert.ok(eggMeals.length <= 1, `day ${d.day}: two egg dishes on the same day`);
}

/* ── A day of this menu is a day of Mediterranean eating ───────────────── */

const ref = { sex: 'm', age: 30, height: 178, weight: 75, activityFactor: 1.4, goal: 'maintain', athlete: false };
const refDays = PLAN_28.map(d => dayMacros(d, ref, 'normal', {}, recipeById).planned);
const meanKcal = avg(refDays, d => d.kcal);
assert.ok(meanKcal > 1850 && meanKcal < 2150, `reference day averages ${Math.round(meanKcal)} kcal`);
for (const d of refDays) assert.ok(d.kcal > 1600 && d.kcal < 2400, `a reference day is ${d.kcal} kcal`);
const share = k => (avg(refDays, d => d[k]) * { p: 4, c: 4, f: 9 }[k]) / meanKcal;
assert.ok(share('f') >= 0.20 && share('f') <= 0.35, `fat is ${(share('f') * 100).toFixed(0)} % of energy — EFSA Reference Intake is 20–35 %`);
assert.ok(share('c') >= 0.45 && share('c') <= 0.60, `carbohydrate is ${(share('c') * 100).toFixed(0)} % of energy — EFSA Reference Intake is 45–60 %`);
assert.ok(share('p') >= 0.15 && share('p') <= 0.25, `protein is ${(share('p') * 100).toFixed(0)} % of energy`);
assert.ok(avg(refDays, d => d.fib) >= 25, 'fibre must meet the 25 g EFSA/WHO adult figure on average');
assert.ok(avg(refDays, d => d.na) < 2000, 'sodium from the food itself must stay under the WHO 2 g ceiling on average');
// Each day must clear the WHO minimum of 400 g fruit & vegetables?  Not asserted per day: the plan
// carries vegetables in most meals, but the number is not derivable from the composition table alone.

/* ── Energy is derived from the macros that are displayed ──────────────── */

for (const r of RECIPES) {
  for (const p of FAMILY) {
    const m = mealMacros(r, p, p.athlete ? 'game' : 'normal', 1.25);
    assert.equal(m.kcal, kcalFromMacros(m), `${r.id}/${p.id}: kcal must equal Atwater(displayed macros)`);
  }
}
for (const d of PLAN_28.slice(0, 7)) {
  for (const p of FAMILY) {
    const t = dayMacros(d, p, 'normal', {}, recipeById).planned;
    assert.equal(t.kcal, kcalFromMacros(t), `day ${d.day}/${p.id}: day kcal must equal Atwater(day macros)`);
  }
}

/* ── Plate size ────────────────────────────────────────────────────────── */

const plates = {};
for (const p of FAMILY) {
  const load = 'normal';
  const planKcal = rotationEnergy(p, load, PLAN_28, recipeById);
  const plate = plateScale(p, planKcal, load);
  plates[p.id] = plate;
  assert.ok(plate >= PLATE_MIN && plate <= PLATE_MAX, `${p.id}: plate ${plate} outside [${PLATE_MIN}, ${PLATE_MAX}]`);
  if (!isMinor(p) && p.goal === 'gradual_fat_loss') assert.equal(plate, 1, `${p.id}: a fat-loss plate is never scaled up`);
  const sized = { ...p, plate };
  const got = avg(PLAN_28, d => dayMacros(d, sized, load, {}, recipeById).planned.kcal);
  const { lower, upper } = energyRange(p, load);
  const center = (lower + upper) / 2;
  const fatLossAdult = !isMinor(p) && p.goal === 'gradual_fat_loss';
  if (fatLossAdult) {
    // Never scaled up (the deficit lives in the plate's composition), so she sits a little under her
    // estimate by design — close enough that the shared menu still serves her, and never a gap card.
    assert.ok(got / center >= 0.88, `${p.id}: the fat-loss plate should still cover ~90 % of the estimate (${Math.round((got / center) * 100)} %)`);
  } else if (plate < PLATE_MAX && !(plate === 1 && planKcal > center)) {
    assert.ok(Math.abs(got - center) / center < 0.06, `${p.id}: sized plate gives ${Math.round(got)} kcal vs need ${center}`);
  }
  // Never proposes eating less: sizing can only raise the plan's energy.
  assert.ok(got >= planKcal - 1, `${p.id}: sizing must never shrink the plate`);
}
assert.ok(plates.son > plates.father && plates.father >= 1, 'the fuelled athlete gets the largest plate');
assert.equal(plateScale(member('mother'), 1200, 'normal'), 1, 'the fat-loss adult is not scaled even when the plan under-shoots');
assert.equal(plateScale(member('son'), 0, 'normal'), 1, 'no plan energy means no scaling rather than NaN');
assert.equal(plateScale(member('son'), 900, 'tournament'), PLATE_MAX, 'the cap holds');

// A logged portion multiplies on top of the plate.
{
  const r = byId.get('chickenTray');
  const base = mealMacros(r, { ...member('son'), plate: 1.3 }, 'normal', 1);
  const bigger = mealMacros(r, { ...member('son'), plate: 1.3 }, 'normal', 1.25);
  assert.ok(Math.abs(bigger.kcal - base.kcal * 1.25) <= 2, 'portion 1.25 scales the sized plate');
  const bare = mealMacros(r, { ...member('son'), plate: 1 }, 'normal', 1);
  assert.ok(Math.abs(base.kcal - bare.kcal * 1.3) <= 3, 'plate 1.3 scales the meal');
}

/* ── The household plate ───────────────────────────────────────────────── */

{
  const sized = FAMILY.map(p => ({ ...p, plate: plates[p.id] }));
  const r = byId.get('chickenTray');
  const hp = householdPlate(r, sized);
  assert.equal(hp.members.length, 4);
  for (const line of hp.lines) {
    assert.ok(Math.abs(line.totalG - sum(line.perMember, m => m.g)) < 1e-9, `${line.ing.f}: household total must equal the sum of the plates`);
    assert.ok(line.perMember.every(m => m.g > 0), `${line.ing.f}: every member gets some`);
  }
  for (const m of hp.members) {
    const direct = mealMacros(r, sized.find(p => p.id === m.id), 'normal', 1);
    assert.equal(m.kcal, direct.kcal, `${m.id}: the plate summary must equal mealMacros`);
  }
  // The mother's carbohydrate helping is lighter, her vegetables heavier — in grams.
  const potato = hp.lines.find(l => l.ing.f === 'potato').perMember;
  const cucumber = hp.lines.find(l => l.ing.f === 'cucumber').perMember;
  const g = (rows, id) => rows.find(m => m.id === id).g;
  assert.ok(g(potato, 'mother') < g(potato, 'father'), 'the fat-loss plate carries fewer potatoes');
  assert.ok(g(cucumber, 'mother') > g(cucumber, 'father'), 'the fat-loss plate carries more vegetables');
  const roles = householdRoleServings(sized);
  assert.ok(roles.carbs > 3 && roles.protein > 3 && roles.vegetables > 3 && roles.fats > 3, 'four members eat roughly four servings');
}

/* ── Badges ────────────────────────────────────────────────────────────── */

const badgeIds = id => nutritionBadges(byId.get(id)).map(b => b.id);
assert.ok(badgeIds('lentils').includes('iron') && badgeIds('lentils').includes('fibre'), 'lentils are high in iron and fibre');
assert.ok(badgeIds('dakos').includes('salt'), 'dakos (paximadi, feta, olives) carries the salt caution');
assert.ok(badgeIds('chickenSouvlaki').includes('protein'), 'souvlaki is a high-protein meal');
assert.ok(!badgeIds('fruitSalad').includes('salt') && !badgeIds('fruitSalad').includes('iron'), 'a fruit salad earns no iron or salt badge');

/* ── The shopping list ─────────────────────────────────────────────────── */

const weekOf = monday => Array.from({ length: 7 }, (_, i) => {
  const date = addDays(monday, i);
  return { date, plan: PLAN_28[cycleDayIndex(dateFromKey(date)) - 1] };
});
const sizedFamily = FAMILY.map(p => ({ ...p, plate: plates[p.id] }));
const list = buildShoppingList({ days: weekOf('2026-09-28'), profiles: sizedFamily, recipeById });

assert.ok(list.length >= 25 && list.length <= 45, `a week's list has ${list.length} lines`);
assert.equal(new Set(list.map(i => i.id)).size, list.length, 'no food appears on the list twice');
assert.equal(new Set(list.map(i => i.name)).size, list.length, 'no two lines share a name (the old list had both «Αυγά» and «Αυγό»)');
for (const item of list) {
  const food = FOODS[item.id];
  assert.ok(aisleIds.has(item.aisle), `${item.id}: aisle`);
  assert.ok(item.qty >= item.exact - 1e-6, `${item.id}: rounding must go UP (${item.qty} < ${item.exact})`);
  assert.ok(item.qty - item.exact < food.shop.step + 1e-6 || item.qty === food.shop.step,
    `${item.id}: rounded up by more than one purchase step (${item.qty} vs ${item.exact})`);
  assert.ok(Number.isInteger(item.qty / food.shop.step) || Math.abs(item.qty / food.shop.step - Math.round(item.qty / food.shop.step)) < 1e-9,
    `${item.id}: quantity must be a whole number of purchase steps`);
  assert.ok(item.meals >= 1, `${item.id}: must be used by at least one meal`);
}
const line = id => list.find(i => i.id === id);
assert.equal(line('egg').unit, 'τεμ');
assert.equal(line('egg').qty % 6, 0, 'eggs are bought by the half-dozen');
assert.ok(line('tomato').unit === 'g' && line('tomato').qty >= 1500 && line('tomato').qty <= 8000,
  `tomatoes: ${line('tomato').qty} g a week for four people (the old list said 70 tomatoes)`);
assert.ok(line('onion').qty <= 2000, `onions: ${line('onion').qty} g a week (the old list said 37 onions)`);
assert.ok(line('lemon').qty <= 10, `lemons: ${line('lemon').qty} a week (the old list said 21)`);
assert.ok(line('oliveOil').qty <= 1200, `olive oil: ${line('oliveOil').qty} ml a week`);
assert.ok(sum(list.filter(i => i.unit === 'g'), i => i.qty) < 60000, 'a week for four is well under 60 kg of food — a larger number means a unit bug');

// Empty and malformed input must not throw.
assert.deepEqual(buildShoppingList({ days: [], profiles: sizedFamily, recipeById }), []);
assert.deepEqual(buildShoppingList({ days: null, profiles: null, recipeById }), []);
assert.deepEqual(buildShoppingList({ days: [{ plan: { lunch: 'nope' } }], profiles: sizedFamily, recipeById }), []);

// A bigger household buys more; the same household buys the same.
const twoMembers = buildShoppingList({ days: weekOf('2026-09-28'), profiles: sizedFamily.slice(0, 2), recipeById });
assert.ok(sum(twoMembers.filter(i => i.unit === 'g'), i => i.exact) < sum(list.filter(i => i.unit === 'g'), i => i.exact), 'two people buy less than four');
assert.deepEqual(buildShoppingList({ days: weekOf('2026-09-28'), profiles: sizedFamily, recipeById }), list, 'the list is deterministic');

// The list follows the real calendar week, including across a clock change.
for (const monday of ['2026-03-23', '2026-03-30', '2026-10-19', '2026-10-26']) {
  const days = weekOf(monday);
  assert.equal(weekdayIndex(days[0].date), 0);
  assert.equal(days[0].plan.dow, 'Δευτέρα', `${monday}: week must start with the rotation's Monday`);
  assert.equal(days[6].plan.dow, 'Κυριακή', `${monday}: week must end with the rotation's Sunday`);
}

console.log('menu tests: PASS');
