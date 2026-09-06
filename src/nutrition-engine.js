export const ADULT_AGE = 18;

export function isMinor(profile) {
  return Number(profile.age) < ADULT_AGE;
}

export function bmi(profile) {
  const h = Number(profile.height) / 100;
  if (!h || !profile.weight) return null;
  return +(Number(profile.weight) / (h * h)).toFixed(1);
}

export function adultBmiLabel(profile) {
  if (isMinor(profile)) return null;
  const value = bmi(profile);
  if (value == null) return null;
  if (value < 18.5) return 'Below healthy adult range';
  if (value < 25) return 'Healthy adult range';
  if (value < 30) return 'Above healthy adult range';
  return 'High adult BMI range';
}

function mifflin(profile) {
  const sexConstant = profile.sex === 'm' ? 5 : -161;
  return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + sexConstant;
}

function adultEnergy(profile) {
  const bmr = mifflin(profile);
  const activity = Number(profile.activityFactor || 1.4);
  const maintenance = Math.round(bmr * activity);
  let center = maintenance;
  let note = 'Estimated maintenance range';
  if (profile.goal === 'gradual_fat_loss') {
    center = Math.round(maintenance * 0.88);
    note = 'Gentle estimated deficit; adjust from multi-week trend, hunger and function';
  }
  const lower = Math.max(1200, Math.round(center * 0.94 / 50) * 50);
  const upper = Math.round(center * 1.06 / 50) * 50;
  return { lower, upper, maintenance, note };
}

function adolescentEnergy(profile, trainingLoad = 'normal') {
  // Deliberately returns a broad planning range rather than prescribing a deficit.
  // Adolescents require growth-aware clinical interpretation; the app avoids adult dieting logic.
  const base = profile.sex === 'm'
    ? 17.686 * profile.weight + 658.2
    : 13.384 * profile.weight + 692.6;
  const activityMap = { rest: 1.45, light: 1.6, normal: 1.75, hard: 1.95, game: 2.05, tournament: 2.15 };
  const factor = activityMap[trainingLoad] || activityMap.normal;
  const center = Math.round(base * factor);
  return {
    lower: Math.round(center * 0.9 / 50) * 50,
    upper: Math.round(center * 1.1 / 50) * 50,
    maintenance: center,
    note: 'Growth/performance planning range only — never a weight-loss prescription for minors'
  };
}

export function proteinRange(profile) {
  if (isMinor(profile)) {
    if (profile.athlete) return { min: +(1.4 * profile.weight).toFixed(0), max: +(1.8 * profile.weight).toFixed(0), note: 'Food-first athlete planning range' };
    return { min: +(1.0 * profile.weight).toFixed(0), max: +(1.3 * profile.weight).toFixed(0), note: 'Growth-supportive planning range' };
  }
  if (profile.goal === 'gradual_fat_loss') return { min: +(1.2 * profile.weight).toFixed(0), max: +(1.6 * profile.weight).toFixed(0), note: 'Supports satiety and lean-mass retention' };
  if (profile.athlete) return { min: +(1.4 * profile.weight).toFixed(0), max: +(1.8 * profile.weight).toFixed(0), note: 'Training-supportive planning range' };
  return { min: +(1.0 * profile.weight).toFixed(0), max: +(1.3 * profile.weight).toFixed(0), note: 'General healthy adult planning range' };
}

export function energyRange(profile, trainingLoad = 'normal') {
  return isMinor(profile) ? adolescentEnergy(profile, trainingLoad) : adultEnergy(profile);
}

export function hydrationTarget(profile, trainingLoad = 'normal') {
  const baseMl = Math.round(profile.weight * 30);
  const add = { rest: 0, light: 250, normal: 500, hard: 750, game: 900, tournament: 1200 }[trainingLoad] || 0;
  return {
    ml: Math.max(1500, baseMl + (profile.athlete ? add : 0)),
    note: 'Starting estimate; heat, sweat rate, illness and medical conditions can materially change needs'
  };
}

export function portionProfile(profile, trainingLoad = 'normal') {
  if (isMinor(profile) && profile.athlete) {
    const carb = { rest: 1.0, light: 1.15, normal: 1.35, hard: 1.6, game: 1.75, tournament: 1.9 }[trainingLoad] || 1.35;
    return { vegetables: 1.0, protein: 1.2, carbs: carb, fats: 1.0, label: 'Athlete fuel' };
  }
  if (isMinor(profile)) return { vegetables: 1.0, protein: 1.0, carbs: 1.0, fats: 1.0, label: 'Growth & nourishment' };
  if (profile.goal === 'gradual_fat_loss') return { vegetables: 1.35, protein: 1.0, carbs: 0.75, fats: 0.8, label: 'Gentle fat-loss plate' };
  return { vegetables: 1.0, protein: 1.0, carbs: 1.0, fats: 1.0, label: 'Balanced maintenance' };
}

export function contextualGuidance({ profile, trainingLoad = 'normal', today = {}, plannedMeal = null }) {
  const tips = [];
  const minor = isMinor(profile);
  if (minor) tips.push('No calorie restriction or adult BMI labels are used for this profile.');
  if (profile.athlete) {
    if (['hard','game','tournament'].includes(trainingLoad)) tips.push('Prioritize carbohydrate availability before and after training, plus a normal protein-containing meal.');
    if ((today.sleepHours || 8) < 8) tips.push('Recovery flag: sleep is below the preferred range for a high-load adolescent day.');
    if ((today.waterMl || 0) < hydrationTarget(profile, trainingLoad).ml * 0.55) tips.push('Hydration is behind the current training-day estimate.');
  }
  if (!minor && profile.goal === 'gradual_fat_loss') {
    tips.push('Use the 3–4 week weight trend, not a single day, before reducing portions further.');
  }
  if (plannedMeal) tips.push(`Next planned meal: ${plannedMeal.name}.`);
  return tips.slice(0, 3);
}
