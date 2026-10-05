/**
 * ZENITH PRO · nutrition engine
 * ---------------------------------------------------------------------------
 * Pure functions only — no DOM, no storage, no I/O. This is the file the test
 * suite exercises, so every rule that protects a minor lives here rather than
 * in the UI where it could be bypassed by a new view.
 *
 * Design rule: estimates are always returned as RANGES with a `note`
 * explaining what they are, and energy is always DERIVED from macros (4/4/9, and
 * 2 for fibre) so the numbers can never contradict each other.
 */

import { dayNumber, addDays } from './dates.js?v=15.0.0';
import { FOODS, roleWeights, nutrientsIn } from './foods.js?v=15.0.0';

export const MINOR_AGE = 18;
export const ADULT_BMI_AGE = 20;

/**
 * Energy conversion factors (kcal per gram) as EU food labels apply them
 * (Regulation (EU) 1169/2011, Annex XIV): protein 4, AVAILABLE carbohydrate 4, fat 9,
 * dietary fibre 2. The classic Atwater general factors are the first three; counting
 * fibre at 2 rather than folding it into carbohydrate at 4 is what keeps the energy
 * of a bean or whole-grain dish in line with the label on the packet.
 */
export const ATWATER = { protein: 4, carb: 4, fat: 9, fibre: 2 };

const oneDecimal = new Intl.NumberFormat('el-GR', { maximumFractionDigits: 1 });

const round = (n, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

/** Energy from displayed amounts: `c` is available carbohydrate, `fib` is fibre (g). */
export function kcalFromMacros({ p = 0, c = 0, f = 0, fib = 0 }) {
  return Math.round(ATWATER.protein * p + ATWATER.carb * c + ATWATER.fat * f + ATWATER.fibre * fib);
}

export function isMinor(profile) {
  return Number(profile.age) < MINOR_AGE;
}

export function canUseAdultBmi(profile) {
  return Number(profile.age) >= ADULT_BMI_AGE;
}

export function bmi(profile) {
  const h = Number(profile.height) / 100;
  const w = Number(profile.weight);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
  return +(w / (h * h)).toFixed(1);
}

export function adultBmiLabel(profile) {
  if (!canUseAdultBmi(profile)) return null;
  const value = bmi(profile);
  if (value == null) return null;
  if (value < 18.5) return 'Κάτω από το εύρος ενηλίκων';
  if (value < 25) return 'Εντός εύρους ενηλίκων';
  if (value < 30) return 'Πάνω από το εύρος ενηλίκων';
  return 'Υψηλό εύρος BMI ενηλίκων';
}

function mifflin(profile) {
  const sexConstant = profile.sex === 'm' ? 5 : -161;
  return 10 * Number(profile.weight) + 6.25 * Number(profile.height) - 5 * Number(profile.age) + sexConstant;
}

function adultEnergy(profile) {
  const bmr = mifflin(profile);
  const activity = Number(profile.activityFactor || 1.4);
  const maintenance = Math.round(bmr * activity);
  let center = maintenance;
  let note = 'Εκτιμώμενο εύρος συντήρησης';
  if (profile.goal === 'gradual_fat_loss') {
    center = Math.round(maintenance * 0.88);
    note = 'Ήπιο εκτιμώμενο έλλειμμα. Προσάρμοσε μόνο από τάση πολλών εβδομάδων, πείνα και λειτουργικότητα — όχι από μία μέτρηση.';
  }
  const lower = Math.max(1200, Math.round(center * 0.94 / 50) * 50);
  const upper = Math.round(center * 1.06 / 50) * 50;
  return { lower, upper, maintenance, note };
}

function adolescentEnergy(profile, trainingLoad = 'normal') {
  // Schofield-style resting-energy estimate with a broad planning factor.
  // Intentionally NOT a weight-loss prescription; does not replace growth-chart
  // or clinical assessment. See SOURCES.reds.
  const weight = Number(profile.weight);
  const base = profile.sex === 'm' ? 17.686 * weight + 658.2 : 13.384 * weight + 692.6;
  const athleteFactors = { rest: 1.45, light: 1.6, normal: 1.75, hard: 1.95, game: 2.05, tournament: 2.15 };
  const factor = profile.athlete ? (athleteFactors[trainingLoad] || athleteFactors.normal) : Number(profile.activityFactor || 1.55);
  const center = Math.round(base * factor);
  return {
    lower: Math.round(center * 0.9 / 50) * 50,
    upper: Math.round(center * 1.1 / 50) * 50,
    maintenance: center,
    note: 'Ευρεία εκτίμηση ανάπτυξης/απόδοσης — ποτέ στόχος περιορισμού θερμίδων για ανήλικο.'
  };
}

export function energyRange(profile, trainingLoad = 'normal') {
  return isMinor(profile) ? adolescentEnergy(profile, trainingLoad) : adultEnergy(profile);
}

export function proteinRange(profile) {
  const weight = Number(profile.weight);
  if (isMinor(profile)) {
    if (profile.athlete) return { min: Math.round(1.4 * weight), max: Math.round(1.8 * weight), note: 'Εύρος σχεδιασμού με βάση την τροφή. Η συνολική επάρκεια ενέργειας προηγείται.' };
    return { min: Math.round(1.0 * weight), max: Math.round(1.3 * weight), note: 'Εύρος υποστήριξης ανάπτυξης — χωρίς ανάγκη συμπληρωμάτων.' };
  }
  if (profile.goal === 'gradual_fat_loss') return { min: Math.round(1.2 * weight), max: Math.round(1.6 * weight), note: 'Εύρος για κορεσμό και διατήρηση μυϊκής μάζας.' };
  if (profile.athlete) return { min: Math.round(1.4 * weight), max: Math.round(1.8 * weight), note: 'Εύρος υποστήριξης προπόνησης.' };
  return { min: Math.round(1.0 * weight), max: Math.round(1.3 * weight), note: 'Γενικό εύρος υγιούς ενήλικα.' };
}

/**
 * EFSA Adequate Intake of TOTAL water — drinks and the water in food — in
 * litres per day (EFSA 2010; Summary of Dietary Reference Values, Table 3):
 * 4–8 y 1.6 · 9–13 y 2.1 M / 1.9 F · 14 y and over 2.5 M / 2.0 F.
 */
export function totalWaterAI(profile) {
  const age = Number(profile.age);
  const male = profile.sex === 'm';
  if (age >= 14) return male ? 2.5 : 2.0;
  if (age >= 9) return male ? 2.1 : 1.9;
  if (age >= 4) return 1.6;
  return age >= 2 ? 1.3 : 1.0;
}

/** Share of total water that is assumed to be drunk (the rest arrives in food). A planning rule of thumb. */
export const DRINKS_SHARE = 0.8;

/**
 * Daily drinks target. It starts from the EFSA total-water AI for the member's
 * age and sex — not a body-weight formula — takes the drinks share of it, and
 * for athletes adds a training top-up for sweat losses.
 */
export function hydrationTarget(profile, trainingLoad = 'normal') {
  const add = { rest: 0, light: 250, normal: 500, hard: 750, game: 900, tournament: 1200 }[trainingLoad] || 0;
  const drinksMl = totalWaterAI(profile) * 1000 * DRINKS_SHARE + (profile.athlete ? add : 0);
  const ml = Math.round(drinksMl / 50) * 50;
  return {
    ml,
    glasses: Math.round(ml / 250),
    totalWaterL: totalWaterAI(profile),
    note: 'Αρχική εκτίμηση από την τιμή αναφοράς της EFSA. Ζέστη, εφίδρωση, ασθένεια, φάρμακα και παθήσεις αλλάζουν σημαντικά την ανάγκη.'
  };
}

/* ── Reference values ──────────────────────────────────────────────────────
 * What a member's day is compared against for the four micronutrient signals
 * the app shows: fibre, iron, calcium and sodium. Every number is quoted from
 * EFSA's Summary of Dietary Reference Values (version 4, Sept 2017) except the
 * sodium ceiling, which is the WHO guideline (< 5 g salt = < 2 g sodium a day for
 * adults), and each is labelled as an intake to aim for or stay under — not as a
 * diagnosis.
 *
 *   fibre    Adequate Intake, g/day:   4–6 y 14 · 7–10 y 16 · 11–14 y 19 · 15–17 y 21 · adults 25
 *   calcium  Population Ref. Intake:   4–10 y 800 · 11–17 y 1,150 · 18–24 y 1,000 · 25+ y 950
 *   iron     Population Ref. Intake:   7–11 y 11 · 12–17 y 11 (boys) / 13 (girls) ·
 *                                      men 11 · women 16 before / 11 after the menopause
 *   sodium   WHO: < 2,000 mg/day for adults (≈ 5 g salt).
 *
 * Women aged 45–54 are around the menopause, so their iron reference is shown as
 * the range 11–16 mg and the higher figure is used for the progress bar — the
 * cautious choice.
 */
export function referenceValues(profile) {
  const age = Number(profile.age);
  const female = profile.sex !== 'm';

  const fibre = age >= 18 ? 25 : age >= 15 ? 21 : age >= 11 ? 19 : age >= 7 ? 16 : age >= 4 ? 14 : 10;
  const calcium = age >= 25 ? 950 : age >= 18 ? 1000 : age >= 11 ? 1150 : age >= 4 ? 800 : 450;

  let iron;
  if (age >= 18) {
    if (!female) iron = { min: 11, max: 11 };
    else if (age >= 55) iron = { min: 11, max: 11 };
    else if (age >= 45) iron = { min: 11, max: 16 };
    else iron = { min: 16, max: 16 };
  } else if (age >= 12) {
    iron = female ? { min: 13, max: 13 } : { min: 11, max: 11 };
  } else {
    iron = { min: age >= 7 ? 11 : 7, max: age >= 7 ? 11 : 7 };
  }

  const sodiumMax = 2000;
  return {
    fibre: { g: fibre },
    calcium: { mg: calcium },
    iron: { ...iron, mg: iron.max },
    sodium: { maxMg: sodiumMax, saltG: round(sodiumMax * 2.5 / 1000, 1) }
  };
}

/** Salt (g) from sodium (mg): salt = sodium × 2.5. */
export const saltGrams = sodiumMg => round(Number(sodiumMg) * 2.5 / 1000, 1);

/**
 * Plain-language nutrition badges for a recipe, from its own per-serving totals.
 * Protein and iron follow the EU claim thresholds (Regulation (EC) 1924/2006):
 * "high protein" = at least 20 % of energy from protein; "high in" a mineral = at
 * least twice the 15 % "source of" level, i.e. 30 % of the EU reference value
 * (Regulation 1169/2011: iron 14 mg) — applied here per serving rather than per
 * 100 g, since a serving is what a person eats. Fibre and calcium use stricter
 * cut-offs than the legal ones so a badge stays a distinction: at the legal level
 * most dishes here would carry them and they would say nothing. Salt is the one
 * badge that is a caution rather than a compliment.
 */
export function nutritionBadges(recipe) {
  const { p } = recipe.base;
  const kcal = kcalFromMacros(recipe.base);
  const m = recipe.micro || {};
  const out = [];
  if (kcal > 0 && (p * 4) / kcal >= 0.2) out.push({ id: 'protein', label: 'Υψηλή πρωτεΐνη', tone: 'blue' });
  if (m.fib >= 10) out.push({ id: 'fibre', label: 'Πλούσιο σε ίνες', tone: 'accent' });      // 40 % of the 25 g adult AI
  if (m.fe >= 4.2) out.push({ id: 'iron', label: 'Πλούσιο σε σίδηρο', tone: 'rose' });       // 30 % of the 14 mg EU NRV, per serving
  if (m.ca >= 350) out.push({ id: 'calcium', label: 'Πλούσιο σε ασβέστιο', tone: 'gold' });  // ~45 % of the 800 mg EU NRV, per serving
  if (m.na >= 900) out.push({ id: 'salt', label: 'Αλμυρό', tone: 'warn' });
  return out;
}

export function portionProfile(profile, trainingLoad = 'normal') {
  if (isMinor(profile) && profile.athlete) {
    const carb = { rest: 1.0, light: 1.15, normal: 1.35, hard: 1.6, game: 1.75, tournament: 1.9 }[trainingLoad] || 1.35;
    return { vegetables: 1.0, protein: 1.2, carbs: carb, fats: 1.0, label: 'Καύσιμο αθλητή' };
  }
  if (isMinor(profile)) return { vegetables: 1.0, protein: 1.0, carbs: 1.0, fats: 1.0, label: 'Ανάπτυξη & θρέψη' };
  if (profile.goal === 'gradual_fat_loss') return { vegetables: 1.35, protein: 1.0, carbs: 0.75, fats: 0.8, label: 'Ηπιότερο πιάτο' };
  return { vegetables: 1.0, protein: 1.0, carbs: 1.0, fats: 1.0, label: 'Ισορροπημένη συντήρηση' };
}

export function contextualGuidance({ profile, trainingLoad = 'normal', today = {}, plannedMeal = null }) {
  const tips = [];
  const minor = isMinor(profile);
  if (minor) tips.push('Δεν χρησιμοποιείται περιορισμός θερμίδων ή κατηγορία BMI ενηλίκων σε αυτό το προφίλ.');
  if (profile.athlete) {
    if (['hard', 'game', 'tournament'].includes(trainingLoad)) tips.push('Δώσε προτεραιότητα στους υδατάνθρακες πριν και μετά την προπόνηση, μαζί με ένα κανονικό γεύμα με πρωτεΐνη.');
    if (today.sleepHours != null && Number(today.sleepHours) < 8) tips.push('Σήμα αποκατάστασης: ο ύπνος που καταγράφηκε είναι κάτω από 8 ώρες σε προφίλ υψηλών απαιτήσεων.');
    if (today.waterMl != null && Number(today.waterMl) < hydrationTarget(profile, trainingLoad).ml * 0.55) tips.push('Η ενυδάτωση που καταγράφηκε είναι πίσω από την αρχική εκτίμηση της ημέρας.');
  }
  if (!minor && profile.goal === 'gradual_fat_loss') tips.push('Χρησιμοποίησε την τάση 3–4 εβδομάδων, όχι μία ημέρα, πριν μειώσεις περαιτέρω τις μερίδες.');
  if (plannedMeal) tips.push(`Επόμενο προγραμματισμένο γεύμα: ${plannedMeal.name}.`);
  return tips.slice(0, 3);
}

/* ── Member-scaled meal math ───────────────────────────────────────────────
 * A member's plate is the reference serving with each INGREDIENT scaled by the
 * portion group it belongs to (protein / carbs / fats / vegetables — see `role`
 * in foods.js) and then by the logged portion multiplier. Macros and
 * micronutrients are summed from those scaled grams, and energy is derived from
 * the rounded macros with the Atwater factors.
 *
 * Because the numbers come from the grams, the grams the kitchen is told to
 * plate ("200 g chicken, 190 g potatoes") and the macros the app reports are the
 * same calculation and cannot disagree. (Before v13 the multipliers were applied
 * to macro totals, so a plate could not be described in grams at all.)
 */

const NUTRIENT_KEYS = ['p', 'c', 'f', 'fib', 'na', 'fe', 'ca'];

/** The multiplier a member's portion profile applies to one food. */
export function foodFactor(food, pp) {
  let k = 0;
  for (const [role, weight] of Object.entries(roleWeights(food))) k += weight * (pp[role] ?? 1);
  return k;
}

/**
 * A recipe's ingredient lines at this member's scale: `[{ ing, food, g }]`.
 *
 * Three independent multipliers, in the order a cook thinks about them:
 *   1. the portion PROFILE — what the plate is made of (a lighter carbohydrate
 *      helping, more vegetables…), from `portionProfile`;
 *   2. the PLATE size `profile.plate` — how big the whole plate is, calibrated to
 *      the member's estimated energy need (see `plateScale`); 1 when absent;
 *   3. the logged `portion` — "a bit less / a bit more today".
 */
export function scaledIngredients(recipe, profile, trainingLoad = 'normal', portion = 1) {
  const pp = portionProfile(profile, trainingLoad);
  const plate = Number.isFinite(profile?.plate) && profile.plate > 0 ? profile.plate : 1;
  const mult = (Number(portion) || 1) * plate;
  return recipe.ingredients.map(ing => {
    const food = FOODS[ing.f];
    return { ing, food, g: ing.g * foodFactor(food, pp) * mult };
  });
}

/* ── Plate size ────────────────────────────────────────────────────────────
 * One shared menu cannot fit four bodies: the reference serving suits an average
 * adult, and a 15-year-old basketball player needs roughly half as much again.
 * Rather than leave that as a permanent "gap" warning, each member's plate is
 * sized so that the rotation's average day lands on the CENTRE of their estimated
 * energy range.
 *
 * Safety rules, enforced here so no view can bypass them:
 *   • never below 1.0 — the app never proposes a smaller plate to reach a target;
 *   • never for a gradual-fat-loss adult — their plate composition already
 *     carries the deficit, and scaling it up would undo it;
 *   • capped at PLATE_MAX — beyond that, the honest answer is the "add a snack"
 *     card, not an ever-larger plate.
 */
export const PLATE_MIN = 1;
export const PLATE_MAX = 1.5;

/** Mean planned energy of the rotation for one profile at plate size 1. */
export function rotationEnergy(profile, trainingLoad, plan, recipeById) {
  const bare = { ...profile, plate: 1 };
  let total = 0;
  for (const day of plan) total += dayMacros(day, bare, trainingLoad, {}, recipeById).planned.kcal;
  return plan.length ? total / plan.length : 0;
}

export function plateScale(profile, planKcal, trainingLoad = 'normal') {
  if (!isMinor(profile) && profile.goal === 'gradual_fat_loss') return 1;
  if (!(planKcal > 0)) return 1;
  const { lower, upper } = energyRange(profile, trainingLoad);
  const raw = ((lower + upper) / 2) / planKcal;
  return Math.min(PLATE_MAX, Math.max(PLATE_MIN, Math.round(raw * 20) / 20)); // nearest 0.05
}

/** Sum of nutrients over scaled lines, unrounded. */
function sumLines(lines) {
  const acc = Object.fromEntries(NUTRIENT_KEYS.map(k => [k, 0]));
  for (const { ing, g } of lines) {
    const n = nutrientsIn(ing.f, g);
    for (const k of NUTRIENT_KEYS) acc[k] += n[k];
  }
  return acc;
}

/** Round raw sums into the shape the app displays. Energy comes from the ROUNDED macros. */
function finishNutrition(acc) {
  const p = round(acc.p, 1), c = round(acc.c, 1), f = round(acc.f, 1), fib = round(acc.fib, 1);
  return {
    p, c, f, fib, kcal: kcalFromMacros({ p, c, f, fib }),
    na: Math.round(acc.na), fe: round(acc.fe, 1), ca: Math.round(acc.ca)
  };
}

export function mealMacros(recipe, profile, trainingLoad = 'normal', portion = 1) {
  return finishNutrition(sumLines(scaledIngredients(recipe, profile, trainingLoad, portion)));
}

/**
 * Totals for one day, split into what was CONFIRMED by the user and what is
 * merely PLANNED. v2 blurred the two; keeping them separate is what makes the
 * numbers trustworthy.
 */
export function dayMacros(planDay, profile, trainingLoad = 'normal', log = {}, recipeById = () => null) {
  const empty = () => Object.fromEntries(NUTRIENT_KEYS.map(k => [k, 0]));
  const add = (acc, m) => { for (const k of NUTRIENT_KEYS) acc[k] += m[k] ?? 0; };
  const planned = empty();
  const confirmed = empty();
  const slots = ['breakfast', 'lunch', 'snack', 'dinner'];
  const confirmedSlots = [];
  const detail = [];

  for (const slot of slots) {
    const id = planDay?.[slot];
    const r = id ? recipeById(id) : null;
    if (!r) continue;
    const plannedMacros = mealMacros(r, profile, trainingLoad, 1);
    add(planned, plannedMacros);

    const entry = log?.meals?.[slot];
    const done = entry?.status === 'done';
    // CONFIRMED follows the dish actually logged. PLANNED remains the plan.
    // This matters when a family member swaps a recipe for another dish.
    const eaten = done && entry?.recipeId ? (recipeById(entry.recipeId) || r) : r;
    if (done) {
      add(confirmed, mealMacros(eaten, profile, trainingLoad, entry.portion ?? 1));
      confirmedSlots.push(slot);
    }
    detail.push({
      slot, recipe: r, eaten, planned: plannedMacros, logged: done,
      swapped: !!(done && entry?.recipeId && eaten?.id !== r?.id),
      portion: entry?.portion ?? null, skipped: entry?.status === 'skipped'
    });
  }

  // Energy for a day total is derived from that total's own rounded macros, the
  // same rule as a single meal, so p·4 + c·4 + f·9 always equals the kcal shown.
  const finish = finishNutrition;

  // Extra items logged outside the rotation (used to close an energy gap for a
  // high-load athlete). They count toward CONFIRMED only — never planned.
  const extras = [];
  for (const ex of (Array.isArray(log?.extras) ? log.extras : [])) {
    const r = recipeById(ex?.recipeId);
    if (!r) continue;
    const m = mealMacros(r, profile, trainingLoad, ex.portion ?? 1);
    add(confirmed, m);
    extras.push({ id: ex.id, recipe: r, portion: ex.portion ?? 1, macros: m });
  }

  return { planned: finish(planned), confirmed: finish(confirmed), confirmedSlots, detail, extras };
}

/** Everything a view needs about one member's targets, in one call. */
export function targetsFor(profile, trainingLoad = 'normal') {
  return {
    energy: energyRange(profile, trainingLoad),
    protein: proteinRange(profile),
    hydration: hydrationTarget(profile, trainingLoad),
    portions: portionProfile(profile, trainingLoad)
  };
}

/**
 * How much of a member's estimated need the shared family plan actually
 * covers. This exists because a single family menu cannot fit everyone: a
 * game-day adolescent athlete needs far more than a maintenance adult. Rather
 * than hide that, we quantify it and propose ADDITIONS only — the engine will
 * never propose eating less, and never for a minor.
 */
export function planCoverage(profile, trainingLoad, totals, targets, snackPool = []) {
  const center = Math.round((targets.energy.lower + targets.energy.upper) / 2);
  const planned = totals.planned.kcal;
  const pct = center > 0 ? planned / center : 1;
  const gapKcal = Math.max(0, center - planned);
  const proteinGap = Math.max(0, targets.protein.min - totals.planned.p);

  const extras = [];
  if (gapKcal >= 220) {
    const pool = snackPool
      .filter(r => r && r.base)
      .map(r => ({ r, kcal: kcalFromMacros(r.base) }))
      .sort((a, b) => b.kcal - a.kcal);
    let remaining = gapKcal;
    for (const { r, kcal } of pool) {
      if (extras.length >= 3) break;
      if (kcal <= remaining * 1.4) { extras.push(r); remaining -= kcal; }
    }
    if (!extras.length && pool.length) extras.push(pool[pool.length - 1].r);
  }

  let status = 'good';
  if (pct < 0.9) status = 'under';
  else if (pct > 1.15) status = 'over';

  return { center, planned, pct, gapKcal, proteinGap, extras, status };
}

/* ── Trends ────────────────────────────────────────────────────────────────
 * A single weigh-in is noise. Least-squares slope over the recorded window is
 * what the NIH weight-planner guidance actually supports using.
 */
export function weightTrend(measurements) {
  const points = [...(measurements || [])]
    .filter(m => Number.isFinite(Number(m.weight)))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map(m => ({ date: m.date, weight: Number(m.weight) }));

  if (points.length === 0) return { points, count: 0, slopePerWeek: null, change: null, first: null, last: null, spanDays: 0, direction: 'none' };

  // Calendar days, not elapsed hours: a weigh-in either side of a clock change
  // must not become 29.96 days apart.
  const d0 = dayNumber(points[0].date);
  const xs = points.map(p => dayNumber(p.date) - d0);
  const ys = points.map(p => p.weight);
  const first = points[0].weight;
  const last = points[points.length - 1].weight;
  const spanDays = xs[xs.length - 1];

  let slopePerWeek = null;
  if (points.length >= 2 && spanDays > 0) {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
    if (den > 0) slopePerWeek = round((num / den) * 7, 2);
  }

  const change = round(last - first, 1);
  const direction = change > 0.3 ? 'up' : change < -0.3 ? 'down' : 'flat';
  return { points, count: points.length, slopePerWeek, change, first, last, spanDays, direction };
}

/** Consecutive logged days ending on the most recent logged day. */
export function loggingStreak(dateKeys, todayKey) {
  const set = new Set(dateKeys);
  let streak = 0;
  // Allow the streak to still count if today isn't logged yet.
  let cursor = set.has(todayKey) ? todayKey : addDays(todayKey, -1);
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Honest completion metric: how much of the day's PLAN has been confirmed.
 * Deliberately named for logging completeness, not health — v1 shipped an
 * arbitrary "score" and it was the least credible thing in the app.
 */
export function loggingCompleteness(planDay, log = {}, hydration) {
  const slots = ['breakfast', 'lunch', 'snack', 'dinner'].filter(s => planDay?.[s]);
  const done = slots.filter(s => log?.meals?.[s]?.status === 'done').length;
  const skipped = slots.filter(s => log?.meals?.[s]?.status === 'skipped').length;
  const waterPct = hydration?.ml ? Math.min(1, (Number(log?.waterMl) || 0) / hydration.ml) : 0;
  return {
    mealsDone: done,
    mealsSkipped: skipped,
    mealsTotal: slots.length,
    waterPct,
    pct: slots.length ? (done + skipped + waterPct) / (slots.length + 1) : waterPct
  };
}

export function weeklyAdherence(logs, weekStartKeys) {
  const byDate = new Map((logs || []).map(l => [l.date, l]));
  return weekStartKeys.map(date => {
    const log = byDate.get(date);
    const meals = log?.meals ? Object.values(log.meals).filter(m => m?.status === 'done').length : 0;
    const skipped = log?.meals ? Object.values(log.meals).filter(m => m?.status === 'skipped').length : 0;
    return { date, meals, skipped, waterMl: Number(log?.waterMl) || 0, logged: meals > 0 || skipped > 0 };
  });
}

/* ── Persona brief ─────────────────────────────────────────────────────────
 * The live numbers behind the "what matters for you today" card. Deliberately
 * returns structure and numbers only — the framing sentences live in data.js
 * (PERSONA_FOCUS) and are composed in the view, so this file stays pure and
 * import-free.
 *
 * Safety rule restated: a minor profile never receives a deficit target, a
 * weight-loss rate, or an adult BMI category — not even as a "point to watch".
 */

/** Recipes in a plan day that are meaningful dietary iron sources. */
export function ironMeals(planDay = {}, recipeById = () => null, ironIds = []) {
  const set = new Set(ironIds);
  return Object.keys(planDay)
    .map(slot => ({ slot, recipe: recipeById(planDay[slot]) }))
    .filter(entry => entry.recipe && set.has(entry.recipe.id));
}

/**
 * General sports-nutrition targets around a session, scaled per kg of body
 * mass. Ranges, not prescriptions — and only ever for athlete profiles.
 */
export function trainingFueling(profile, trainingLoad = 'normal') {
  if (!profile?.athlete) return null;
  const w = Number(profile.weight) || 0;
  const heavy = ['hard', 'game', 'tournament'].includes(trainingLoad);
  const carbMultiplier = { rest: 0.5, light: 1, normal: 1.5, hard: 2, game: 2.5, tournament: 3 }[trainingLoad] ?? 1.5;
  return {
    load: trainingLoad,
    heavy,
    /** 1–3 g/kg 2–3 h before; the heavy end only on game/tournament days. */
    preCarbs: { min: Math.round(1 * w), max: Math.round(3 * w) },
    /** ~0.3 g/kg protein and ~1 g/kg carbohydrate within ~2 h after. */
    postProtein: Math.round(0.3 * w),
    postCarbs: Math.round(1.0 * w),
    /** Rough session carbohydrate emphasis, for the portion multiplier. */
    carbEmphasis: carbMultiplier
  };
}

export function personaPoints(profile, {
  trainingLoad = 'normal',
  targets = {},
  totals = {},
  coverage = null,
  streak = 0,
  ironToday = [],
  hydrationMl = 0,
  measurements = 0,
  refs = null
} = {}) {
  const points = [];
  const minor = isMinor(profile);
  const proteinMin = targets?.protein?.min ?? null;
  const hydration = targets?.hydration?.ml ?? null;
  const logged = totals?.confirmed?.kcal ?? 0;

  /* ── Minor athlete: fuelling around the session ── */
  if (minor && profile.athlete) {
    const fuel = trainingFueling(profile, trainingLoad);
    points.push({
      key: 'carbs', icon: 'zap', tone: 'gold', label: 'Υδατάνθρακες',
      value: fuel.heavy ? 'Αυξημένοι' : 'Κανονικοί',
      body: fuel.heavy
        ? 'Μέρα υψηλών απαιτήσεων: υδατάνθρακες στο γεύμα πριν και στο σνακ μετά. Η ποσότητα του πιάτου μεγαλώνει — όχι η πρωτεΐνη.'
        : 'Το σημερινό φορτίο δεν απαιτεί επιπλέον υδατάνθρακες. Κράτα το κανονικό πιάτο και τακτικά γεύματα.'
    });
    points.push({
      key: 'protein', icon: 'drumstick', tone: 'blue', label: 'Πρωτεΐνη',
      value: proteinMin ? `${proteinMin}+ g` : '—',
      body: 'Κατώτατο όριο για την ημέρα. Μοιράζεται στα γεύματα — δεν χρειάζεται συμπλήρωμα αν καλύπτεται από το πλάνο.'
    });
    points.push({
      key: 'fluid', icon: 'droplet', tone: 'accent', label: 'Υγρά',
      value: hydration ? `${hydrationMl} / ${hydration} ml` : `${hydrationMl} ml`,
      body: 'Η ζέστη και η διπλή προπόνηση ανεβάζουν την ανάγκη. Μέτρα πριν και μετά την προπόνηση αν θέλεις ακρίβεια.'
    });
    return points;
  }

  /* ── Minor, non-athlete: growth, iron, variety. Never a deficit. ── */
  if (minor) {
    const ironNames = ironToday.map(e => e.recipe.name);
    const plannedFe = totals?.planned?.fe;
    const ironRef = refs?.iron?.mg;
    points.push({
      key: 'iron', icon: 'leaf', tone: 'rose', label: 'Σίδηρος σήμερα',
      value: plannedFe != null && ironRef
        ? `${oneDecimal.format(plannedFe)} από ${oneDecimal.format(ironRef)} mg`
        : `${ironToday.length} ${ironToday.length === 1 ? 'γεύμα' : 'γεύματα'}`,
      body: ironNames.length
        ? `Πλούσια σε σίδηρο σήμερα: ${ironNames.join(' · ')}. Ο σίδηρος από φυτικές τροφές απορροφάται καλύτερα μαζί με ντομάτα ή λεμόνι — τα περισσότερα γεύματα το έχουν ήδη.`
        : 'Καμία πηγή σιδήρου στο σημερινό πλάνο. Οι φακές, τα ρεβίθια και τα μπιφτέκια είναι οι πιο εύκολες προσθήκες.'
    });
    points.push({
      key: 'variety', icon: 'sparkles', tone: 'blue', label: 'Ποικιλία',
      value: `${totals?.groups ?? 0} ομάδες`,
      body: 'Στόχος είναι η ποικιλία μέσα στην εβδομάδα, όχι ο τέλειος κάθε μέρα. Δεν υπάρχει «καλό» και «κακό» φαγητό σε αυτό το προφίλ.'
    });
    points.push({
      key: 'noDeficit', icon: 'shield', tone: 'accent', label: 'Προστασία προφίλ',
      value: 'Χωρίς έλλειμμα',
      body: 'Σε αυτή την ηλικία η εφαρμογή δεν εφαρμόζει ποτέ έλλειμμα θερμίδων και δεν εμφανίζει κατηγορία BMI ενηλίκων.'
    });
    return points;
  }

  /* ── Adult, gradual fat loss: rate over speed, protein to keep muscle ── */
  if (profile.goal === 'gradual_fat_loss') {
    // Expected rate = the plan's daily deficit × 7 ÷ ~7,700 kcal per kg of body-weight change. A rule of
    // thumb (Hall et al. show the real response is gradual and slows), so it is shown as «≈» — but it is the
    // number THIS plan implies, not a generic range.
    const energy = targets?.energy;
    const deficit = energy ? Math.max(0, energy.maintenance - (energy.lower + energy.upper) / 2) : 0;
    points.push({
      key: 'rate', icon: 'target', tone: 'accent', label: 'Ρυθμός',
      value: deficit > 0 ? `≈ ${oneDecimal.format((deficit * 7) / 7700)} kg / εβδομάδα` : 'αργός και σταθερός · kg / εβδομάδα',
      body: 'Το μικρό έλλειμμα του πλάνου δίνει αργό, σταθερό ρυθμό. Μέχρι 0,5 kg την εβδομάδα θεωρείται ασφαλές· πιο γρήγορα δεν είναι καλύτερο — χάνεται και μυϊκή μάζα και ο ρυθμός δεν κρατά.'
    });
    points.push({
      key: 'protein', icon: 'drumstick', tone: 'blue', label: 'Πρωτεΐνη',
      value: proteinMin ? `${proteinMin}+ g` : '—',
      body: 'Η πρωτεΐνη βοηθά να διατηρείς μυϊκή μάζα όσο το βάρος πέφτει — είναι ο αριθμός που αξίζει να έχεις στο μυαλό σου κάθε μέρα.'
    });
    points.push({
      key: 'trend', icon: 'chart', tone: 'rose', label: 'Τάση',
      value: measurements < 3 ? `Χρειάζονται ${3 - measurements} μετρήσεις` : `${measurements} μετρήσεις`,
      body: measurements < 3
        ? 'Ζυγίσου 3 φορές σε 3 εβδομάδες, ίδια ώρα, και τότε η εφαρμογή θα δείξει τάση. Μία μέτρηση δεν λέει τίποτα.'
        : 'Η εικόνα βγαίνει από την κλίση 3–4 εβδομάδων. Καμία μεμονωμένη μέτρηση δεν κρίνεται.'
    });
    return points;
  }

  /* ── Adult, maintenance ── */
  points.push({
    key: 'protein', icon: 'drumstick', tone: 'blue', label: 'Πρωτεΐνη',
    value: proteinMin ? `${proteinMin}+ g` : '—',
    body: 'Σταθερή πρωτεΐνη σε κάθε γεύμα κρατά κόρο και μυϊκή μάζα, ανεξάρτητα από το βάρος.'
  });
  const plannedSalt = totals?.planned?.na != null ? saltGrams(totals.planned.na) : null;
  points.push({
    key: 'salt', icon: 'shield', tone: 'gold', label: 'Αλάτι',
    value: plannedSalt != null ? `${oneDecimal.format(plannedSalt)} g από 5 g` : 'Προσοχή',
    body: 'Από τα υλικά του σημερινού πλάνου, χωρίς το αλάτι που προσθέτεις εσύ. Φέτα, ελιές και ψωμί είναι οι κύριες πηγές — το όριο του ΠΟΥ είναι 5 g την ημέρα, οπότε δεν χρειάζεται επιπλέον αλάτι στο πιάτο.'
  });
  points.push({
    key: 'fluid', icon: 'droplet', tone: 'accent', label: 'Υγρά',
    value: hydration ? `${hydrationMl} / ${hydration} ml` : `${hydrationMl} ml`,
    body: 'Καταγραφή νερού με ένα πάτημα στα ποτήρια — δεν χρειάζεται ζύγισμα.'
  });
  return points;
}

/* ── Household shopping share ──────────────────────────────────────────────
 * A household pot is shared across the whole plate, so a member's share of the
 * shopping is the average of their four portion groups — not a per-macro split.
 * This replaces the old "× number of people" shortcut, which counted a 0,75×
 * carber (the mother) and a 1,35× fuelled athlete (the son) as the same eater.
 */
export function memberShare(profile) {
  const pp = portionProfile(profile, 'normal');
  return (pp.vegetables + pp.protein + pp.carbs + pp.fats) / 4;
}

export function householdServings(profiles) {
  const members = Array.isArray(profiles) ? profiles : [];
  if (!members.length) return 1;
  return members.reduce((sum, p) => sum + memberShare(p), 0) || 1;
}

/**
 * How many reference servings of each portion group the household eats from one
 * cooked dish: the sum, over members, of their portion-group multiplier × their
 * plate size. This is what the shopping list and Cook Mode scale by, and what
 * the "why these quantities" note quotes.
 */
export function householdRoleServings(profiles, loadFor = () => 'normal') {
  const out = { protein: 0, carbs: 0, fats: 0, vegetables: 0 };
  for (const p of Array.isArray(profiles) ? profiles : []) {
    const pp = portionProfile(p, loadFor(p));
    const plate = Number.isFinite(p.plate) && p.plate > 0 ? p.plate : 1;
    for (const k of Object.keys(out)) out[k] += pp[k] * plate;
  }
  return out;
}

/**
 * A recipe cooked for the whole household: each ingredient's total and each
 * member's share of it, in grams, plus each member's plate totals. Cook Mode and
 * the recipe sheet read this so the cook is told what to weigh out for four
 * people — and what to put on each plate — instead of one reference serving.
 */
export function householdPlate(recipe, profiles, loadFor = () => 'normal') {
  const members = (Array.isArray(profiles) ? profiles : []).map(p => {
    const lines = scaledIngredients(recipe, p, loadFor(p), 1);
    return { id: p.id, name: p.name, lines, ...finishNutrition(sumLines(lines)) };
  });
  const lines = recipe.ingredients.map((ing, i) => {
    const perMember = members.map(m => ({ id: m.id, name: m.name, g: m.lines[i].g }));
    return { ing, food: FOODS[ing.f], totalG: perMember.reduce((a, m) => a + m.g, 0), perMember };
  });
  return { lines, members: members.map(({ lines: _drop, ...rest }) => rest) };
}

/* ── Shopping list ─────────────────────────────────────────────────────────
 * Built from the real week: every meal on every day, every ingredient scaled to
 * each member's plate, summed over the household, merged by canonical food (so
 * "Αυγά" and "Αυγό" are one line), and then rounded UP to a unit a person can
 * actually buy — a quarter-kilo of tomatoes, a half-dozen eggs, 50 ml of oil.
 *
 * Rounding up is deliberate and is what the in-app explanation promises: a list
 * that leaves you a little short is worse than one that leaves a little over.
 */
export function buildShoppingListForMembers({ daysByMember, profiles, recipeById, loadFor = () => 'normal' }) {
  const need = new Map();
  const members = Array.isArray(profiles) ? profiles : [];

  for (const p of members) {
    const days = daysByMember?.[p.id] || [];
    for (const day of days) {
      for (const slot of MEAL_ORDER) {
        const recipe = recipeById(day?.plan?.[slot]);
        if (!recipe) continue;
        const lines = scaledIngredients(recipe, p, loadFor(p), 1);
        recipe.ingredients.forEach((ing, i) => {
          const grams = Number(lines[i]?.g) || 0;
          const cur = need.get(ing.f) || { grams: 0, meals: 0 };
          cur.grams += grams;
          cur.meals += 1;
          need.set(ing.f, cur);
        });
      }
    }
  }

  return [...need.entries()].map(([id, { grams, meals }]) => {
    const food = FOODS[id];
    const { unit, step } = food.shop;
    const raw = unit === 'ml' ? grams / (food.density ?? 1) : unit === 'τεμ' ? grams / food.pieceG : grams;
    const qty = Math.max(step, Math.ceil(raw / step - 1e-9) * step);
    return { id, key: id, name: food.plural, aisle: food.aisle, unit, qty, exact: raw, meals };
  }).sort((a, b) => a.name.localeCompare(b.name, 'el'));
}

export function buildShoppingList({ days, profiles, recipeById, loadFor = () => 'normal' }) {
  const need = new Map();
  for (const day of Array.isArray(days) ? days : []) {
    for (const slot of MEAL_ORDER) {
      const recipe = recipeById(day?.plan?.[slot]);
      if (!recipe) continue;
      const perMember = (Array.isArray(profiles) ? profiles : []).map(p => scaledIngredients(recipe, p, loadFor(p), 1));
      recipe.ingredients.forEach((ing, i) => {
        const grams = perMember.reduce((sum, lines) => sum + lines[i].g, 0);
        const cur = need.get(ing.f) || { grams: 0, meals: 0 };
        cur.grams += grams;
        cur.meals += 1;
        need.set(ing.f, cur);
      });
    }
  }

  return [...need.entries()].map(([id, { grams, meals }]) => {
    const food = FOODS[id];
    const { unit, step } = food.shop;
    const raw = unit === 'ml' ? grams / (food.density ?? 1) : unit === 'τεμ' ? grams / food.pieceG : grams;
    const qty = Math.max(step, Math.ceil(raw / step - 1e-9) * step);
    return { id, key: id, name: food.plural, aisle: food.aisle, unit, qty, exact: raw, meals };
  }).sort((a, b) => a.name.localeCompare(b.name, 'el'));
}

/* ── Member name upgrade ───────────────────────────────────────────────────
 * v4.1 renamed the four household members from their placeholder labels
 * (Μητέρα / Πατέρας / Κόρη / Γιος) to their real names. Profiles are persisted,
 * so an existing install would otherwise keep the old labels forever.
 *
 * The upgrade is deliberately conservative: a stored name is only replaced when
 * it still equals the shipped placeholder for that id. A name the user typed is
 * never overwritten, and `id` never changes — so portions, plans, logs and
 * measurements stay attached to the right person.
 *
 * Returns { profiles, changed } so the caller can skip the write when nothing
 * moved.
 */
export function upgradeMemberNames(profiles, legacyNames, shippedFamily) {
  const list = Array.isArray(profiles) ? profiles : [];
  const shipped = new Map(
    (Array.isArray(shippedFamily) ? shippedFamily : []).map(f => [f.id, f])
  );
  let changed = 0;
  const next = list.map(p => {
    const legacy = legacyNames?.[p?.id];
    const target = shipped.get(p?.id);
    if (!legacy || !target || p.name !== legacy) return p;
    changed += 1;
    return { ...p, name: target.name, relation: target.relation };
  });
  return { profiles: next, changed };
}


/** The lowest physical-activity level (PAL) any free-living person sustains — EFSA and FAO/WHO/UNU. */
export const PAL_FLOOR = 1.4;

/** The first option of v12's activity menu. v12 wrote it silently, on any save, for a profile whose own level was not in that menu. */
const V12_MENU_FALLBACK = 1.2;

/**
 * v13 moved activity levels onto the EFSA/FAO ladder (1.4 · 1.6 · 1.8 · 2.0). Two kinds of stored value are
 * corrected on upgrade, and nothing else:
 *   • a shipped member still holding the exact value the app once shipped — `legacy` maps id → [old, new] —
 *     and the value v12's form silently wrote for such a member (1.2) both become that member's new default;
 *   • any other level below PAL 1.4, which no free-living person sustains, is raised to the floor.
 * A level a person chose that is at or above the floor is never overwritten.
 */
export function upgradeActivityLevels(profiles, legacy) {
  const list = Array.isArray(profiles) ? profiles : [];
  let changed = 0;
  const next = list.map(p => {
    const current = Number(p?.activityFactor);
    if (!Number.isFinite(current)) return p;
    const rule = legacy?.[p?.id];
    let target = current;
    if (rule && (current === rule[0] || current === V12_MENU_FALLBACK)) target = rule[1];
    else if (current < PAL_FLOOR) target = PAL_FLOOR;
    if (target === current) return p;
    changed += 1;
    return { ...p, activityFactor: target };
  });
  return { profiles: next, changed };
}

/* ── Time-aware next meal ─────────────────────────────────────────────────
 * Pure and deterministic: caller injects both clock and schedule.
 */
const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];
const MEAL_LABELS = { breakfast: 'Πρωινό', lunch: 'Μεσημεριανό', snack: 'Σνακ', dinner: 'Βραδινό' };
const NUDGE_WINDOW_MIN = 45;

export function nextMealNudge({ log, slotTimes, now } = {}) {
  const at = now instanceof Date && Number.isFinite(now.getTime()) ? now : null;
  if (!at) return { slot: null, state: 'complete' };

  const meals = log && typeof log === 'object' && log.meals && typeof log.meals === 'object' ? log.meals : {};
  const schedule = slotTimes && typeof slotTimes === 'object' ? slotTimes : {};

  for (const slot of MEAL_ORDER) {
    const status = meals[slot]?.status;
    if (status === 'done' || status === 'skipped') continue;

    const time = typeof schedule[slot] === 'string' ? schedule[slot] : null;
    const parsed = time && /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!parsed) continue;
    const hh = Number(parsed[1]);
    const mm = Number(parsed[2]);
    if (hh > 23 || mm > 59) continue;

    const slotMs = new Date(at.getFullYear(), at.getMonth(), at.getDate(), hh, mm, 0, 0).getTime();
    const minutesUntil = Math.round((slotMs - at.getTime()) / 60000);
    const state = minutesUntil > NUDGE_WINDOW_MIN ? 'upcoming'
      : minutesUntil < -NUDGE_WINDOW_MIN ? 'overdue'
        : 'due';

    return { slot, label: MEAL_LABELS[slot], time, minutesUntil, state };
  }

  return { slot: null, state: 'complete' };
}
