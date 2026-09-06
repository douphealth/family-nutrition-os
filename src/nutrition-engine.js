export const MINOR_AGE = 18;
export const ADULT_BMI_AGE = 20;

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
  if (value < 18.5) return 'Below healthy adult range';
  if (value < 25) return 'Healthy adult range';
  if (value < 30) return 'Above healthy adult range';
  return 'High adult BMI range';
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
  let note = 'Estimated maintenance planning range';
  if (profile.goal === 'gradual_fat_loss') {
    center = Math.round(maintenance * 0.88);
    note = 'Gentle estimated deficit; adjust only from multi-week trend, hunger, function and clinician advice when relevant';
  }
  const lower = Math.max(1200, Math.round(center * 0.94 / 50) * 50);
  const upper = Math.round(center * 1.06 / 50) * 50;
  return { lower, upper, maintenance, note };
}

function adolescentEnergy(profile, trainingLoad = 'normal') {
  // Schofield-style resting-energy estimate with a broad planning factor.
  // This is intentionally not a weight-loss prescription and should not replace growth-chart or clinical assessment.
  const weight = Number(profile.weight);
  const base = profile.sex === 'm' ? 17.686 * weight + 658.2 : 13.384 * weight + 692.6;
  const athleteFactors = { rest:1.45, light:1.6, normal:1.75, hard:1.95, game:2.05, tournament:2.15 };
  const factor = profile.athlete ? (athleteFactors[trainingLoad] || athleteFactors.normal) : Number(profile.activityFactor || 1.55);
  const center = Math.round(base * factor);
  return {
    lower: Math.round(center * 0.9 / 50) * 50,
    upper: Math.round(center * 1.1 / 50) * 50,
    maintenance: center,
    note: 'Broad growth/performance planning estimate only — never a calorie-restriction target for minors'
  };
}

export function proteinRange(profile) {
  const weight = Number(profile.weight);
  if (isMinor(profile)) {
    if (profile.athlete) return { min:Math.round(1.4 * weight), max:Math.round(1.8 * weight), note:'Food-first athlete planning range; total energy adequacy remains the priority' };
    return { min:Math.round(1.0 * weight), max:Math.round(1.3 * weight), note:'Growth-supportive planning range, not a requirement to supplement' };
  }
  if (profile.goal === 'gradual_fat_loss') return { min:Math.round(1.2 * weight), max:Math.round(1.6 * weight), note:'Planning range to support satiety and lean-mass retention' };
  if (profile.athlete) return { min:Math.round(1.4 * weight), max:Math.round(1.8 * weight), note:'Training-supportive planning range' };
  return { min:Math.round(1.0 * weight), max:Math.round(1.3 * weight), note:'General healthy-adult planning range' };
}

export function energyRange(profile, trainingLoad = 'normal') {
  return isMinor(profile) ? adolescentEnergy(profile, trainingLoad) : adultEnergy(profile);
}

export function hydrationTarget(profile, trainingLoad = 'normal') {
  const baseMl = Math.round(Number(profile.weight) * 30);
  const add = { rest:0, light:250, normal:500, hard:750, game:900, tournament:1200 }[trainingLoad] || 0;
  return {
    ml: Math.max(1500, baseMl + (profile.athlete ? add : 0)),
    note: 'Starting estimate only; heat, sweat rate, illness, medications and medical conditions can materially change fluid needs'
  };
}

export function portionProfile(profile, trainingLoad = 'normal') {
  if (isMinor(profile) && profile.athlete) {
    const carb = { rest:1.0, light:1.15, normal:1.35, hard:1.6, game:1.75, tournament:1.9 }[trainingLoad] || 1.35;
    return { vegetables:1.0, protein:1.2, carbs:carb, fats:1.0, label:'Athlete fuel' };
  }
  if (isMinor(profile)) return { vegetables:1.0, protein:1.0, carbs:1.0, fats:1.0, label:'Growth & nourishment' };
  if (profile.goal === 'gradual_fat_loss') return { vegetables:1.35, protein:1.0, carbs:0.75, fats:0.8, label:'Gentle fat-loss plate' };
  return { vegetables:1.0, protein:1.0, carbs:1.0, fats:1.0, label:'Balanced maintenance' };
}

export function contextualGuidance({ profile, trainingLoad = 'normal', today = {}, plannedMeal = null }) {
  const tips = [];
  const minor = isMinor(profile);
  if (minor) tips.push('No calorie restriction or adult BMI category is used for this profile.');
  if (profile.athlete) {
    if (['hard','game','tournament'].includes(trainingLoad)) tips.push('Prioritize carbohydrate availability before and after training, plus a normal protein-containing meal.');
    if (today.sleepHours != null && Number(today.sleepHours) < 8) tips.push('Recovery flag: recorded sleep is below 8 hours on a high-demand adolescent profile.');
    if (today.waterMl != null && Number(today.waterMl) < hydrationTarget(profile, trainingLoad).ml * 0.55) tips.push('Recorded hydration is behind the current training-day starting estimate.');
  }
  if (!minor && profile.goal === 'gradual_fat_loss') tips.push('Use the 3–4 week weight trend, not a single day, before reducing portions further.');
  if (plannedMeal) tips.push(`Next planned meal: ${plannedMeal.name}.`);
  return tips.slice(0, 3);
}
