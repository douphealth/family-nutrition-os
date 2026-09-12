/**
 * ZENITH PRO · nutrition engine
 * ---------------------------------------------------------------------------
 * Pure functions only — no DOM, no storage, no I/O. This is the file the test
 * suite exercises, so every rule that protects a minor lives here rather than
 * in the UI where it could be bypassed by a new view.
 *
 * Design rule: estimates are always returned as RANGES with a `note`
 * explaining what they are, and energy is always DERIVED from macros via
 * Atwater factors so the numbers can never contradict each other.
 */

export const MINOR_AGE = 18;
export const ADULT_BMI_AGE = 20;

/** Atwater energy factors (kcal per gram). */
export const ATWATER = { protein: 4, carb: 4, fat: 9 };

const round = (n, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

export function kcalFromMacros({ p = 0, c = 0, f = 0 }) {
  return Math.round(ATWATER.protein * p + ATWATER.carb * c + ATWATER.fat * f);
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
    note = 'Ηπιο εκτιμώμενο έλλειμμα. Προσάρμοσε μόνο από τάση πολλών εβδομάδων, πείνα και λειτουργικότητα — όχι από μία μέτρηση.';
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

export function hydrationTarget(profile, trainingLoad = 'normal') {
  const baseMl = Math.round(Number(profile.weight) * 30);
  const add = { rest: 0, light: 250, normal: 500, hard: 750, game: 900, tournament: 1200 }[trainingLoad] || 0;
  const ml = Math.max(1500, baseMl + (profile.athlete ? add : 0));
  return {
    ml,
    glasses: Math.round(ml / 250),
    note: 'Αρχική εκτίμηση. Ζέστη, εφίδρωση, ασθένεια, φάρμακα και παθήσεις αλλάζουν σημαντικά την ανάγκη.'
  };
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
 * The reference serving's macros are scaled per macro group by the member's
 * portion profile, then by the logged portion multiplier. Energy is derived
 * with Atwater factors. This is the fix for v2, where portion multipliers were
 * displayed but never applied to anything.
 */
export function mealMacros(recipe, profile, trainingLoad = 'normal', portion = 1) {
  const pp = portionProfile(profile, trainingLoad);
  const mult = Number(portion) || 1;
  const p = recipe.base.p * pp.protein * mult;
  const c = recipe.base.c * pp.carbs * mult;
  const f = recipe.base.f * pp.fats * mult;
  return { p: round(p, 1), c: round(c, 1), f: round(f, 1), kcal: kcalFromMacros({ p, c, f }) };
}

/**
 * Totals for one day, split into what was CONFIRMED by the user and what is
 * merely PLANNED. v2 blurred the two; keeping them separate is what makes the
 * numbers trustworthy.
 */
export function dayMacros(planDay, profile, trainingLoad = 'normal', log = {}, recipeById = () => null) {
  const empty = () => ({ p: 0, c: 0, f: 0, kcal: 0 });
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
    planned.p += plannedMacros.p; planned.c += plannedMacros.c; planned.f += plannedMacros.f; planned.kcal += plannedMacros.kcal;

    const entry = log?.meals?.[slot];
    const done = entry?.status === 'done';
    if (done) {
      const m = mealMacros(r, profile, trainingLoad, entry.portion ?? 1);
      confirmed.p += m.p; confirmed.c += m.c; confirmed.f += m.f; confirmed.kcal += m.kcal;
      confirmedSlots.push(slot);
    }
    detail.push({ slot, recipe: r, planned: plannedMacros, logged: done, portion: entry?.portion ?? null, skipped: entry?.status === 'skipped' });
  }

  const finish = o => ({ p: round(o.p, 1), c: round(o.c, 1), f: round(o.f, 1), kcal: Math.round(o.kcal) });

  // Extra items logged outside the rotation (used to close an energy gap for a
  // high-load athlete). They count toward CONFIRMED only — never planned.
  const extras = [];
  for (const ex of (Array.isArray(log?.extras) ? log.extras : [])) {
    const r = recipeById(ex?.recipeId);
    if (!r) continue;
    const m = mealMacros(r, profile, trainingLoad, ex.portion ?? 1);
    confirmed.p += m.p; confirmed.c += m.c; confirmed.f += m.f; confirmed.kcal += m.kcal;
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

  const t0 = new Date(points[0].date + 'T00:00:00').getTime();
  const xs = points.map(p => (new Date(p.date + 'T00:00:00').getTime() - t0) / 86400000);
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
  const cursor = new Date(todayKey + 'T00:00:00');
  // Allow the streak to still count if today isn't logged yet.
  if (!set.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
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
