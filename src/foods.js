/**
 * ZENITH PRO · food composition table
 * ---------------------------------------------------------------------------
 * The single source of truth for what is IN the food. Every recipe ingredient
 * points at one entry here, which is what lets the app
 *
 *   • derive a recipe's macros and micronutrients from grams × composition
 *     instead of trusting numbers somebody typed next to the recipe;
 *   • merge "Αυγά" and "Αυγό" (same food, different recipes) into one shopping
 *     line instead of two;
 *   • say exactly where every number came from.
 *
 * Composition is per 100 g (or 100 ml for liquids — see `density`) of the RAW,
 * EDIBLE food, because recipes list raw weights and shopping is done raw. Cooking
 * changes water content, not the macros of what went into the pot.
 *
 * Provenance
 *   fdc     USDA FoodData Central "SR Legacy" id, and `usda` the description that id
 *           must have. Every value on an entry with an `fdc` is asserted equal to the
 *           committed snapshot (data/usda-fdc.json) by tests/food-provenance.test.mjs,
 *           and the snapshot's description must match `usda` — so neither a number nor
 *           a mistyped id can drift from the source unnoticed. Refresh the snapshot
 *           with `npm run data:usda`.
 *   proxy   The USDA entry stands in for a broader or regional food (e.g. one
 *           species of white fish for "fish fillet"). Said out loud in `note`.
 *   approx  No suitable USDA entry exists (regional products). Values are typical
 *           retail-label figures and are flagged as approximate in the UI.
 *
 * Nutrient keys (per 100 g): p protein g · c carbohydrate g · f fat g ·
 *   fib fibre g · na sodium mg · fe iron mg · ca calcium mg.
 * Energy is deliberately NOT stored: it is always derived from the macros with the
 * EU conversion factors 4/4/9 and 2 for fibre (see nutrition-engine.js), so it cannot
 * disagree with them.
 *
 * role — which household portion group scales the ingredient for each member
 *   ('protein' | 'carbs' | 'fats' | 'vegetables'), or a weighted mix such as
 *   { protein: .5, carbs: .5 } for legumes, which are both.
 * pieceG — grams in one piece, for recipe units of «τεμ».
 * density — g per ml, for recipe units of «ml».
 * shop — how the household buys it: the unit to show, and the step to round UP to.
 */

export const NUTRIENTS = ['p', 'c', 'f', 'fib', 'na', 'fe', 'ca'];

const F = (name, plural, aisle, role, per100, extra = {}) => ({ name, plural, aisle, role, per100, ...extra });

export const FOODS = {
  /* ── Dairy & eggs ───────────────────────────────────────────────────── */
  yogurt: F('Γιαούρτι στραγγιστό 2%', 'Γιαούρτι στραγγιστό 2%', 'dairy', 'protein',
    { p: 9.95, c: 3.94, f: 1.92, fib: 0, na: 34, fe: 0.04, ca: 115 },
    { fdc: 170903, usda: 'Yogurt, Greek, plain, lowfat', note: 'Greek yogurt, plain, lowfat', shop: { unit: 'g', step: 100 } }),
  feta: F('Φέτα', 'Φέτα', 'dairy', 'fats',
    { p: 14.2, c: 3.88, f: 21.5, fib: 0, na: 1140, fe: 0.65, ca: 493 },
    { fdc: 173420, usda: 'Cheese, feta', shop: { unit: 'g', step: 100 } }),
  hardcheese: F('Τυρί τριμμένο (κεφαλοτύρι)', 'Τυρί τριμμένο (κεφαλοτύρι)', 'dairy', 'fats',
    { p: 31.8, c: 3.63, f: 26.9, fib: 0, na: 1430, fe: 0.77, ca: 1060 },
    { fdc: 171249, usda: 'Cheese, romano', proxy: true, note: 'Romano, a hard sheep-milk cheese, stands in for kefalotyri', shop: { unit: 'g', step: 50 } }),
  milk: F('Γάλα ημιαποβουτυρωμένο', 'Γάλα ημιαποβουτυρωμένο', 'dairy', 'protein',
    { p: 3.3, c: 4.8, f: 1.98, fib: 0, na: 47, fe: 0.02, ca: 120 },
    { fdc: 171267, usda: 'Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D', density: 1.03, note: 'Milk, reduced fat, 2%', shop: { unit: 'ml', step: 500 } }),
  egg: F('Αυγό', 'Αυγά', 'dairy', 'protein',
    { p: 12.6, c: 0.72, f: 9.51, fib: 0, na: 142, fe: 1.75, ca: 56 },
    { fdc: 171287, usda: 'Egg, whole, raw, fresh', pieceG: 50, note: 'One egg = 50 g edible', shop: { unit: 'τεμ', step: 6 } }),

  /* ── Meat & fish ────────────────────────────────────────────────────── */
  chicken: F('Στήθος κοτόπουλου', 'Στήθος κοτόπουλου', 'protein', 'protein',
    { p: 22.5, c: 0, f: 2.62, fib: 0, na: 45, fe: 0.37, ca: 5 },
    { fdc: 171077, usda: 'Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw', note: 'Skinless, boneless breast, raw', shop: { unit: 'g', step: 100 } }),
  beef: F('Κιμάς μοσχαρίσιος', 'Κιμάς μοσχαρίσιος', 'protein', 'protein',
    { p: 20, c: 0, f: 10, fib: 0, na: 66, fe: 2.24, ca: 12 },
    { fdc: 174030, usda: 'Beef, ground, 90% lean meat / 10% fat, raw', note: 'Ground beef, 90% lean, raw', shop: { unit: 'g', step: 100 } }),
  fish: F('Φιλέτο ψαριού (τσιπούρα/λαβράκι)', 'Φιλέτο ψαριού (τσιπούρα/λαβράκι)', 'protein', 'protein',
    { p: 18.4, c: 0, f: 2, fib: 0, na: 68, fe: 0.29, ca: 10 },
    { fdc: 175142, usda: 'Fish, sea bass, mixed species, raw', proxy: true, note: 'Sea bass stands in for lean white fish (sea bream, sea bass, hake)', shop: { unit: 'g', step: 100 } }),

  /* ── Legumes & grains ───────────────────────────────────────────────── */
  lentils: F('Φακές ξηρές', 'Φακές ξηρές', 'pantry', { protein: 0.5, carbs: 0.5 },
    { p: 24.6, c: 63.4, f: 1.06, fib: 10.7, na: 6, fe: 6.51, ca: 35 },
    { fdc: 172420, usda: 'Lentils, raw', shop: { unit: 'g', step: 50 } }),
  giantBeans: F('Γίγαντες ξηροί', 'Γίγαντες ξηροί', 'pantry', { protein: 0.5, carbs: 0.5 },
    { p: 21.5, c: 63.4, f: 0.69, fib: 19, na: 18, fe: 7.51, ca: 81 },
    { fdc: 174252, usda: 'Lima beans, large, mature seeds, raw', note: 'Large lima beans', shop: { unit: 'g', step: 50 } }),
  whiteBeans: F('Φασόλια ξηρά', 'Φασόλια ξηρά', 'pantry', { protein: 0.5, carbs: 0.5 },
    { p: 22.3, c: 60.8, f: 1.5, fib: 15.3, na: 5, fe: 5.49, ca: 147 },
    { fdc: 173745, usda: 'Beans, navy, mature seeds, raw', note: 'Navy (haricot) beans', shop: { unit: 'g', step: 50 } }),
  chickpeas: F('Ρεβίθια ξηρά', 'Ρεβίθια ξηρά', 'pantry', { protein: 0.5, carbs: 0.5 },
    { p: 20.5, c: 63, f: 6.04, fib: 12.2, na: 24, fe: 4.31, ca: 57 },
    { fdc: 173756, usda: 'Chickpeas (garbanzo beans, bengal gram), mature seeds, raw', shop: { unit: 'g', step: 50 } }),
  oats: F('Βρώμη', 'Βρώμη', 'pantry', 'carbs',
    { p: 13.2, c: 67.7, f: 6.52, fib: 10.1, na: 6, fe: 4.25, ca: 52 },
    { fdc: 173904, usda: 'Cereals, oats, regular and quick, not fortified, dry', note: 'Rolled oats, dry', shop: { unit: 'g', step: 50 } }),
  rice: F('Ρύζι', 'Ρύζι', 'pantry', 'carbs',
    { p: 7.13, c: 80, f: 0.66, fib: 1.3, na: 5, fe: 0.8, ca: 28 },
    { fdc: 169756, usda: 'Rice, white, long-grain, regular, raw, unenriched', note: 'White long-grain, raw, unenriched', shop: { unit: 'g', step: 50 } }),
  pasta: F('Ζυμαρικά ολικής', 'Ζυμαρικά ολικής', 'pantry', 'carbs',
    { p: 13.9, c: 73.4, f: 2.93, fib: 9.2, na: 6, fe: 3.62, ca: 29 },
    { fdc: 169738, usda: 'Pasta, whole-wheat, dry', note: 'Whole-wheat pasta, dry', shop: { unit: 'g', step: 50 } }),
  trahana: F('Τραχανάς', 'Τραχανάς', 'pantry', 'carbs',
    { p: 12, c: 68, f: 3, fib: 4, na: 600, fe: 3, ca: 90 },
    { approx: true, note: 'Typical retail-label figures for dry trahana (no USDA equivalent)', shop: { unit: 'g', step: 50 } }),
  paximadi: F('Παξιμάδι κριθαρένιο', 'Παξιμάδια κριθαρένια', 'bakery', 'carbs',
    { p: 10.5, c: 68, f: 2.5, fib: 9, na: 520, fe: 3, ca: 40 },
    { approx: true, pieceG: 60, note: 'Typical retail-label figures for barley rusk (no USDA equivalent)', shop: { unit: 'τεμ', step: 1 } }),

  /* ── Bread ──────────────────────────────────────────────────────────── */
  bread: F('Ψωμί ολικής', 'Ψωμί ολικής', 'bakery', 'carbs',
    { p: 12.4, c: 42.7, f: 3.5, fib: 6, na: 455, fe: 2.47, ca: 161 },
    { fdc: 172688, usda: 'Bread, whole-wheat, commercially prepared', note: 'Whole-wheat bread, commercial', shop: { unit: 'g', step: 50 } }),
  pita: F('Πίτα ολικής', 'Πίτες ολικής', 'bakery', 'carbs',
    { p: 9.8, c: 55.9, f: 1.71, fib: 6.1, na: 421, fe: 3.06, ca: 15 },
    { fdc: 174916, usda: 'Bread, pita, whole-wheat', pieceG: 80, note: 'Whole-wheat pita', shop: { unit: 'τεμ', step: 1 } }),

  /* ── Oils, nuts, sweet & pantry ─────────────────────────────────────── */
  oliveOil: F('Ελαιόλαδο', 'Ελαιόλαδο', 'pantry', 'fats',
    { p: 0, c: 0, f: 100, fib: 0, na: 2, fe: 0.56, ca: 1 },
    { fdc: 171413, usda: 'Oil, olive, salad or cooking', density: 0.91, shop: { unit: 'ml', step: 50 } }),
  walnuts: F('Καρύδια', 'Καρύδια', 'pantry', 'fats',
    { p: 15.2, c: 13.7, f: 65.2, fib: 6.7, na: 2, fe: 2.91, ca: 98 },
    { fdc: 170187, usda: 'Nuts, walnuts, english', shop: { unit: 'g', step: 50 } }),
  tahini: F('Ταχίνι', 'Ταχίνι', 'pantry', 'fats',
    { p: 17, c: 21.2, f: 53.8, fib: 9.3, na: 115, fe: 8.95, ca: 426 },
    { fdc: 170189, usda: 'Seeds, sesame butter, tahini, from roasted and toasted kernels (most common type)', note: 'Sesame butter, from roasted and toasted kernels', shop: { unit: 'g', step: 50 } }),
  olives: F('Ελιές', 'Ελιές', 'pantry', 'fats',
    { p: 1.03, c: 3.84, f: 15.3, fib: 3.3, na: 1560, fe: 0.49, ca: 52 },
    { fdc: 169096, usda: 'Olives, pickled, canned or bottled, green', proxy: true, note: 'Brined olives; brine makes them a major source of salt', shop: { unit: 'g', step: 50 } }),
  honey: F('Μέλι', 'Μέλι', 'pantry', 'carbs',
    { p: 0.3, c: 82.4, f: 0, fib: 0.2, na: 4, fe: 0.42, ca: 6 },
    { fdc: 169640, usda: 'Honey', shop: { unit: 'g', step: 50 } }),
  tomatoCanned: F('Ντομάτα κονκασέ (κονσέρβα)', 'Ντομάτα κονκασέ (κονσέρβα)', 'pantry', 'vegetables',
    { p: 1.64, c: 7.29, f: 0.28, fib: 1.9, na: 186, fe: 1.3, ca: 34 },
    { fdc: 170501, usda: 'Tomatoes, crushed, canned', note: 'Crushed tomatoes, canned', shop: { unit: 'g', step: 100 } }),

  /* ── Fruit & vegetables ─────────────────────────────────────────────── */
  banana: F('Μπανάνα', 'Μπανάνες', 'produce', 'carbs',
    { p: 1.09, c: 22.8, f: 0.33, fib: 2.6, na: 1, fe: 0.26, ca: 5 },
    { fdc: 173944, usda: 'Bananas, raw', pieceG: 118, note: 'One medium banana = 118 g peeled', shop: { unit: 'τεμ', step: 1 } }),
  fruit: F('Φρούτα εποχής', 'Φρούτα εποχής', 'produce', 'vegetables',
    { p: 0.26, c: 13.8, f: 0.17, fib: 2.4, na: 1, fe: 0.12, ca: 6 },
    { fdc: 171688, usda: 'Apples, raw, with skin', proxy: true, note: 'Apple stands in for typical seasonal fruit', shop: { unit: 'g', step: 100 } }),
  tomato: F('Ντομάτα', 'Ντομάτες', 'produce', 'vegetables',
    { p: 0.88, c: 3.89, f: 0.2, fib: 1.2, na: 5, fe: 0.27, ca: 10 },
    { fdc: 170457, usda: 'Tomatoes, red, ripe, raw, year round average', pieceG: 123, shop: { unit: 'g', step: 250 } }),
  cucumber: F('Αγγούρι', 'Αγγούρια', 'produce', 'vegetables',
    { p: 0.65, c: 3.63, f: 0.11, fib: 0.5, na: 2, fe: 0.28, ca: 16 },
    { fdc: 168409, usda: 'Cucumber, with peel, raw', pieceG: 200, shop: { unit: 'g', step: 250 } }),
  pepper: F('Πιπεριά', 'Πιπεριές', 'produce', 'vegetables',
    { p: 0.86, c: 4.64, f: 0.17, fib: 1.7, na: 3, fe: 0.34, ca: 10 },
    { fdc: 170427, usda: 'Peppers, sweet, green, raw', pieceG: 150, note: 'Green sweet pepper', shop: { unit: 'g', step: 250 } }),
  zucchini: F('Κολοκύθι', 'Κολοκυθάκια', 'produce', 'vegetables',
    { p: 1.21, c: 3.11, f: 0.32, fib: 1, na: 8, fe: 0.37, ca: 16 },
    { fdc: 169291, usda: 'Squash, summer, zucchini, includes skin, raw', shop: { unit: 'g', step: 250 } }),
  onion: F('Κρεμμύδι', 'Κρεμμύδια', 'produce', 'vegetables',
    { p: 1.1, c: 9.34, f: 0.1, fib: 1.7, na: 4, fe: 0.21, ca: 23 },
    { fdc: 170000, usda: 'Onions, raw', pieceG: 110, shop: { unit: 'g', step: 250 } }),
  carrot: F('Καρότο', 'Καρότα', 'produce', 'vegetables',
    { p: 0.93, c: 9.58, f: 0.24, fib: 2.8, na: 69, fe: 0.3, ca: 33 },
    { fdc: 170393, usda: 'Carrots, raw', pieceG: 61, shop: { unit: 'g', step: 250 } }),
  celery: F('Σέλινο', 'Σέλινο', 'produce', 'vegetables',
    { p: 0.69, c: 2.97, f: 0.17, fib: 1.6, na: 80, fe: 0.2, ca: 40 },
    { fdc: 169988, usda: 'Celery, raw', shop: { unit: 'g', step: 100 } }),
  potato: F('Πατάτες', 'Πατάτες', 'produce', 'carbs',
    { p: 2.05, c: 17.5, f: 0.09, fib: 2.1, na: 6, fe: 0.81, ca: 12 },
    { fdc: 170026, usda: 'Potatoes, flesh and skin, raw', shop: { unit: 'g', step: 250 } }),
  spinach: F('Σπανάκι', 'Σπανάκι', 'produce', 'vegetables',
    { p: 2.86, c: 3.63, f: 0.39, fib: 2.2, na: 79, fe: 2.71, ca: 99 },
    { fdc: 168462, usda: 'Spinach, raw', shop: { unit: 'g', step: 250 } }),
  mushroom: F('Μανιτάρια', 'Μανιτάρια', 'produce', 'vegetables',
    { p: 3.09, c: 3.26, f: 0.34, fib: 1, na: 5, fe: 0.5, ca: 3 },
    { fdc: 169251, usda: 'Mushrooms, white, raw', shop: { unit: 'g', step: 100 } }),
  lettuce: F('Μαρούλι', 'Μαρούλι', 'produce', 'vegetables',
    { p: 1.23, c: 3.29, f: 0.3, fib: 2.1, na: 8, fe: 0.97, ca: 33 },
    { fdc: 169247, usda: 'Lettuce, cos or romaine, raw', note: 'Romaine', shop: { unit: 'g', step: 250 } }),
  greens: F('Χόρτα εποχής', 'Χόρτα εποχής', 'produce', 'vegetables',
    { p: 1.7, c: 4.7, f: 0.3, fib: 4, na: 45, fe: 0.9, ca: 100 },
    { fdc: 169992, usda: 'Chicory greens, raw', proxy: true, note: 'Chicory greens stand in for wild/seasonal greens (horta)', shop: { unit: 'g', step: 250 } }),
  herbs: F('Μαϊντανός & δυόσμος', 'Μαϊντανός & δυόσμος', 'produce', 'vegetables',
    { p: 2.97, c: 6.33, f: 0.79, fib: 3.3, na: 56, fe: 6.2, ca: 138 },
    { fdc: 170416, usda: 'Parsley, fresh', note: 'Parsley', shop: { unit: 'g', step: 50 } }),
  lemon: F('Λεμόνι', 'Λεμόνια', 'produce', 'vegetables',
    { p: 1.1, c: 9.32, f: 0.3, fib: 2.8, na: 2, fe: 0.6, ca: 26 },
    { fdc: 167746, usda: 'Lemons, raw, without peel', pieceG: 58, shop: { unit: 'τεμ', step: 1 } })
};

/* ── Unit conversion ───────────────────────────────────────────────────── */

/** Grams represented by a recipe line: `q` × unit. Throws on an impossible unit. */
export function gramsOf(ing) {
  const food = FOODS[ing.f];
  if (!food) throw new Error(`Unknown food "${ing.f}"`);
  if (ing.u === 'g') return ing.q;
  if (ing.u === 'ml') return ing.q * (food.density ?? 1);
  if (ing.u === 'τεμ') {
    if (!food.pieceG) throw new Error(`"${ing.f}" has no piece weight but is used in τεμ`);
    return ing.q * food.pieceG;
  }
  throw new Error(`Unknown unit "${ing.u}" for "${ing.f}"`);
}

/** The inverse of `gramsOf`: `grams` expressed in a recipe line's own unit. */
export function qtyOf(ing, grams) {
  const food = FOODS[ing.f];
  if (ing.u === 'ml') return grams / (food.density ?? 1);
  if (ing.u === 'τεμ') return grams / food.pieceG;
  return grams;
}

/** Portion-group weights for a food, normalised to { protein, carbs, fats, vegetables }. */
export function roleWeights(food) {
  const r = food.role;
  if (typeof r === 'string') return { [r]: 1 };
  const sum = Object.values(r).reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v / sum]));
}

/**
 * Nutrients contained in `grams` of a food. Unrounded.
 *
 * `c` is AVAILABLE carbohydrate — sugars and starch, without fibre — because that
 * is what EU food labels list and what carries 4 kcal/g; fibre is reported on its
 * own and carries 2 kcal/g (Regulation (EU) 1169/2011, Annex XIV). USDA publishes
 * carbohydrate "by difference", which includes fibre, so per100 keeps the USDA
 * figure (and stays equal to its source) and the subtraction happens here.
 */
export function nutrientsIn(foodId, grams) {
  const food = FOODS[foodId];
  const k = grams / 100;
  const out = Object.fromEntries(NUTRIENTS.map(n => [n, food.per100[n] * k]));
  out.c = Math.max(0, out.c - out.fib);
  return out;
}

/* ── Recipe derivation ─────────────────────────────────────────────────── */

const r1 = n => Math.round(n * 10) / 10;

/**
 * Turns an authored recipe ({ ingredients: [{ f, q, u }] }) into the shape the
 * rest of the app reads: each line gains its display name, aisle and grams, and
 * the recipe gains `base` (macros of ONE reference adult serving) and `micro`
 * (fibre, sodium, iron, calcium) — all computed from the food table. Carbohydrate is
 * AVAILABLE carbohydrate (see nutrientsIn).
 */
export function deriveRecipe(raw) {
  const total = Object.fromEntries(NUTRIENTS.map(n => [n, 0]));
  const ingredients = raw.ingredients.map(ing => {
    const food = FOODS[ing.f];
    const g = gramsOf(ing);
    const n = nutrientsIn(ing.f, g);
    for (const k of NUTRIENTS) total[k] += n[k];
    return {
      ...ing,
      n: ing.n ?? (ing.u === 'τεμ' && ing.q > 1 ? food.plural : food.name),
      a: food.aisle,
      g
    };
  });
  return {
    ...raw,
    ingredients,
    base: { p: r1(total.p), c: r1(total.c), f: r1(total.f), fib: r1(total.fib) },
    micro: { fib: r1(total.fib), na: Math.round(total.na), fe: r1(total.fe), ca: Math.round(total.ca) }
  };
}
