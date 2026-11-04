/**
 * ZENITH PRO · deterministic, privacy-first training planner.
 * The planner does not diagnose, predict performance, prescribe body-weight
 * targets, or invent readiness data. It layers recovery and optional conditioning
 * around actual team commitments; never treats them as empty training days.
 * References: AAP Pediatrics 2024 (overuse prevention), AAP 2020 (resistance
 * training), AOSSM 2025 (youth strength), CDC adolescent sleep recommendations.
 */

import { defaultDimitrisCalendar, resolveCalendarWeek, cleanCalendarWeeks, summarizeCalendarEvents, eventDuration, timeMinutes } from './fitness-calendar.js';

export const FITNESS_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const FITNESS_MODES = ['free', 'team', 'game', 'light', 'rest'];
export const FITNESS_GOALS = ['wellbeing', 'court', 'strength', 'endurance', 'mobility'];
export const FITNESS_EQUIPMENT = ['none', 'bands', 'gym'];
export const FITNESS_LEVELS = ['beginner', 'intermediate'];
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const contains = (arr, value) => arr.includes(value);
const choose = (arr, value, fallback) => contains(arr, value) ? value : fallback;
const clamp = (value, min, max, fallback) => {
  if (value === '' || value == null || !Number.isFinite(Number(value))) return fallback;
  return Math.min(max, Math.max(min, Math.round(Number(value))));
};

export function isYouthAthlete(profile) {
  const age = Number(profile?.age);
  return Number.isFinite(age) && age >= 10 && age < 18;
}

export function defaultFitnessSettings(profile = {}) {
  const basket = profile.id === 'son' || /basketball|μπάσκετ/i.test(String(profile.role || ''));
  return {
    id: 'fitness:' + (profile.id || 'unknown'),
    memberId: profile.id || 'unknown',
    goal: basket ? 'court' : 'wellbeing',
    sport: basket ? 'basketball' : 'general',
    experience: 'beginner',
    equipment: 'none',
    minutes: basket ? 20 : 25,
    strengthSessions: basket ? 1 : 2,
    coachSupervised: false,
    // Screenshot fixtures are dated and never silently become recurring events.
    calendarWeeks: profile.id === 'son' ? defaultDimitrisCalendar() : {},
    calendarSource: profile.id === 'son' ? 'family-screenshot' : 'unconfirmed',
    repeatWeekly: false,
    repeatFromWeek: '2026-11-02',
    // Presets are starting assumptions and are always editable.
    schedule: basket
      ? ['team', 'team', 'team', 'team', 'team', 'game', 'rest']
      : ['free', 'free', 'free', 'free', 'free', 'light', 'rest'],
    source: 'starter-preset'
  };
}

export function normalizeFitnessSettings(input = {}, profile = {}) {
  const defaults = defaultFitnessSettings(profile);
  const youth = isYouthAthlete(profile);
  return {
    id: 'fitness:' + profile.id,
    memberId: profile.id,
    goal: choose(FITNESS_GOALS, input.goal, defaults.goal),
    sport: choose(['basketball', 'football', 'running', 'cycling', 'general', 'other'], input.sport, defaults.sport),
    experience: choose(FITNESS_LEVELS, input.experience, defaults.experience),
    equipment: choose(FITNESS_EQUIPMENT, input.equipment, defaults.equipment),
    minutes: clamp(input.minutes, 10, youth ? 40 : 60, defaults.minutes),
    strengthSessions: clamp(input.strengthSessions, 0, youth ? 2 : 3, defaults.strengthSessions),
    coachSupervised: input.coachSupervised === true || input.coachSupervised === 'on',
    schedule: FITNESS_DAYS.map((_, i) => choose(FITNESS_MODES, input.schedule?.[i], defaults.schedule[i])),
    calendarWeeks: cleanCalendarWeeks(input.calendarWeeks === undefined ? defaults.calendarWeeks : input.calendarWeeks),
    calendarSource: typeof input.calendarSource === 'string' ? input.calendarSource.slice(0,36) : defaults.calendarSource,
    repeatWeekly: input.repeatWeekly === true,
    repeatFromWeek: typeof input.repeatFromWeek === 'string' ? input.repeatFromWeek : defaults.repeatFromWeek,
    source: input.source === 'starter-preset' ? 'starter-preset' : 'custom',
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : null
  };
}

export function weekStartOf(dateKey) {
  if (!isoDate.test(String(dateKey))) throw new Error('Invalid date key');
  const d = new Date(dateKey + 'T12:00:00Z');
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== dateKey) throw new Error('Invalid date');
  const weekday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - weekday);
  return d.toISOString().slice(0, 10);
}

export function shiftDate(dateKey, days) {
  const d = new Date(dateKey + 'T12:00:00Z');
  if (!isoDate.test(String(dateKey)) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== dateKey) {
    throw new Error('Invalid date');
  }
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function fitnessLogId(memberId, dateKey) {
  return 'fitness-log:' + memberId + ':' + dateKey;
}

/** Avoid default "ready" scores when the user has supplied no observation. */
export function assessReadiness(log, profile) {
  if (log?.pain === true) return { level: 'stop', reason: 'pain' };
  if (!log || !log.checkedAt) return { level: 'unknown', reason: 'unrecorded' };
  const sleep = Number(log.sleepHours);
  const energy = Number(log.energy);
  const soreness = Number(log.soreness);
  if (!Number.isFinite(sleep) || !Number.isFinite(energy) || !Number.isFinite(soreness) ||
      sleep < 0 || sleep > 16 || energy < 1 || energy > 5 || soreness < 1 || soreness > 5) {
    return { level: 'unknown', reason: 'incomplete' };
  }
  const youth = isYouthAthlete(profile);
  if (sleep < (youth ? 7 : 6) || soreness >= 4 || energy <= 2) {
    return { level: 'recover', reason: sleep < (youth ? 7 : 6) ? 'sleep' : soreness >= 4 ? 'soreness' : 'energy' };
  }
  if (sleep < (youth ? 8 : 7) || soreness === 3 || energy === 3) {
    return { level: 'caution', reason: 'fatigue' };
  }
  return { level: 'normal', reason: 'reported' };
}

const step = (el, en) => ({ el, en });
const prep = [
  step('5′ δυναμική προθέρμανση, ήπιες κινήσεις ισχίων/αστραγάλων.', '5 min dynamic warm-up and easy hip/ankle movement.'),
  step('Ρυθμός που επιτρέπει άνετη ομιλία· τεχνική πριν από ένταση.', 'Conversational effort; technique before intensity.')
];
const restore = [
  step('Ήπια κινητικότητα 5–8′ ή ανάπαυση αν υπάρχει κόπωση.', 'Gentle mobility for 5–8 min, or full rest if tired.'),
  step('Νερό, κανονικά γεύματα και επαρκής ύπνος.', 'Fluids, regular meals and adequate sleep.')
];
const strengthA = [
  step('5′ ήπια δυναμική προθέρμανση.', '5 min of easy dynamic warm-up.'),
  step('Καθίσματα με βάρος σώματος 1–2 × 8, αργή τεχνική.', 'Bodyweight squats 1–2 × 8, controlled form.'),
  step('Split squat 1–2 × 6 ανά πόδι, με υποστήριξη.', 'Supported split squats 1–2 × 6 per leg.'),
  step('Push-ups στον τοίχο ή πάγκο 1–2 × 8.', 'Wall or incline push-ups 1–2 × 8.'),
  step('Dead bug 1–2 × 6 ανά πλευρά, μετά χαλάρωμα.', 'Dead bug 1–2 × 6 each side, then cool down.')
];
const strengthB = [
  step('5′ δυναμική προθέρμανση και έλεγχος ισορροπίας.', '5 min dynamic warm-up and balance check.'),
  step('Hip hinge χωρίς βάρος 1–2 × 8 με επίβλεψη.', 'Unloaded hip hinge 1–2 × 8 with supervision.'),
  step('Step-up σε χαμηλό σκαλί 1–2 × 6 ανά πόδι.', 'Low step-ups 1–2 × 6 per leg.'),
  step('Αργές άρσεις γάμπας 1–2 × 10.', 'Controlled calf raises 1–2 × 10.'),
  step('Side plank 1–2 × 15–20″ ανά πλευρά· ήπια αποθεραπεία.', 'Side plank 1–2 × 15–20 sec each side; easy cool-down.')
];
const courtPrep = [
  step('Κινητικότητα ισχίων/αστραγάλων 2–3′.', '2–3 min hip and ankle mobility.'),
  step('Ισορροπία στο ένα πόδι 2 × 20″ ανά πλευρά.', 'Single-leg balance 2 × 20 sec each side.'),
  step('Ήπια πλάγια βήματα 2 × 20″, χωρίς εξάντληση.', 'Easy lateral steps 2 × 20 sec, without fatigue.'),
  step('Μετά την ομαδική προπόνηση: χαλάρωμα 3–5′.', 'After team practice: 3–5 min easy cool-down.')
];

function selectStrengthDays(schedule, settings, youth) {
  if (youth && !settings.coachSupervised) return [];
  const sportDays = schedule.filter(v => v === 'team' || v === 'game').length;
  const restDays = schedule.filter(v => v === 'rest').length;
  // No additional loading for highly committed adolescent athletes.
  if (youth && (sportDays >= 5 || restDays === 0)) return [];
  const max = Math.min(settings.strengthSessions, youth ? 2 : 3);
  const picks = [];
  const candidates = FITNESS_DAYS.map((_, i) => i).filter(i => schedule[i] === 'free');
  for (const day of candidates) {
    const prev = (day + 6) % 7;
    const next = (day + 1) % 7;
    if (schedule[day] === 'game' || schedule[prev] === 'game' || schedule[next] === 'game') continue;
    if (picks.some(p => Math.abs(day - p) <= 1 || Math.abs(day - p) >= 6)) continue;
    picks.push(day);
    if (picks.length >= max) break;
  }
  return picks;
}

function sessionForMode(mode, strength, goal, settings, youth, index) {
  if (mode === 'rest') return { kind: 'rest', duration: 0, steps: restore };
  if (mode === 'game') return {
    kind: 'game', duration: 0,
    steps: [step('Ομαδικός αγώνας: ακολούθησε την προθέρμανση του προπονητή.', 'Game day: follow your coach’s warm-up.'),
      step('Μην προσθέτεις έντονη ενδυνάμωση ή σπριντ μετά τον αγώνα.', 'Do not add hard strength or sprints after the game.'),
      ...restore]
  };
  if (mode === 'team') return {
    kind: 'team', duration: 0,
    steps: [step('Η ομαδική προπόνηση είναι ο κύριος φόρτος. Επιπλέον ενδυνάμωση: 0′.', 'Team practice is the main load. Extra strength: 0 minutes.'),
      step('Ακολούθησε την προθέρμανση και τις οδηγίες του προπονητή· μην προσθέτεις σπριντ.', 'Follow the coach’s warm-up and instructions; do not add sprints.')]
  };
  if (mode === 'light') return { kind: 'recovery', duration: 10, steps: restore };
  if (strength) {
    const strengthSteps = index % 2 === 0 ? strengthA : strengthB;
    const equipmentTip = settings.equipment === 'bands'
      ? step('Ελαφριές έλξεις με λάστιχο 1–2 × 8, χωρίς πόνο και χωρίς εξάντληση.', 'Easy band rows 1–2 × 8, pain-free, without fatigue.')
      : settings.equipment === 'gym'
        ? step('Χρησιμοποίησε εξοπλισμό μόνο με έλεγχο τεχνικής από προπονητή· όχι μέγιστες προσπάθειες.', 'Use gym equipment only after technique review by a coach; no maximal efforts.')
        : step('Δεν απαιτείται εξοπλισμός· σταμάτα αν χαθεί η τεχνική.', 'No equipment is required; stop when technique deteriorates.');
    const experienceTip = settings.experience === 'beginner'
      ? step('Ξεκίνα με 1 σετ και μάθε την κίνηση με επίβλεψη.', 'Start with 1 set and learn the movement under supervision.')
      : step('Έως 2 ήπια σετ μόνο αν η τεχνική παραμένει σωστή.', 'Up to 2 easy sets only while technique stays controlled.');
    return {
      kind: 'strength',
      duration: Math.min(settings.minutes, youth ? 25 : 35),
      steps: [...strengthSteps, equipmentTip, experienceTip]
    };
  }
  if (goal === 'endurance' && !youth) return { kind: 'easy', duration: settings.minutes, steps: prep };
  if (goal === 'court') return youth
    ? {kind: 'rest', duration: 0, steps: restore}
    : {kind: 'skills', duration: Math.min(settings.minutes, 25), steps: courtPrep};
  return { kind: 'mobility', duration: Math.min(settings.minutes, youth ? 15 : 25), steps: restore };
}

function adjustSession(session, readiness) {
  if (readiness.level === 'stop') return {
    ...session, kind: 'stop', duration: 0,
    steps: [step('Διακοπή προπόνησης λόγω αναφερόμενου πόνου.', 'Stop training because pain was reported.'),
      step('Ενημέρωσε γονέα/προπονητή και αναζήτησε αξιολόγηση από επαγγελματία υγείας.', 'Tell a parent/coach and seek qualified medical assessment.')]
  };
  if (readiness.level === 'recover' || (readiness.level === 'caution' && session.kind === 'strength')) {
    return { ...session, kind: 'recovery', duration: 8, steps: restore };
  }
  return session;
}

/**
 * Build the week from actual dated calendar events where available.
 * For Dimitris, an unknown future week never inherits screenshot fixture
 * commitments or produces imaginary extra workouts.
 */
export function buildFitnessWeek(profile, savedSettings, logs = [], anchorDate) {
  const settings = normalizeFitnessSettings(savedSettings || defaultFitnessSettings(profile), profile);
  const start = weekStartOf(anchorDate);
  const youth = isYouthAthlete(profile);
  const athleteCalendar = profile.id === 'son' && settings.sport === 'basketball';
  const resolved = athleteCalendar ? resolveCalendarWeek(settings, start) :
    {known:false,events:[],source:'manual',repeated:false};
  const calendarKnown = athleteCalendar && resolved.known;
  const calendarMissing = athleteCalendar && !resolved.known;
  const calendarStats = summarizeCalendarEvents(resolved.events);

  const modes = calendarKnown
    ? FITNESS_DAYS.map((_,i) => {
        const date=shiftDate(start,i);
        const events=resolved.events.filter(e=>e.date===date);
        if(events.some(e=>e.type==='game'))return 'game';
        if(events.some(e=>e.type==='team'))return 'team';
        return 'rest'; // a genuine free day is recovery, not an extra workout
      })
    : calendarMissing ? FITNESS_DAYS.map(()=>'unconfirmed') : settings.schedule;
  const sportDays = calendarKnown ? calendarStats.teamDays : modes.filter(v=>v==='team'||v==='game').length;
  const restDays = modes.filter(v=>v==='rest').length;
  const highYouthLoad = youth && (sportDays>=5 || (calendarKnown && (calendarStats.teamMinutes>=600 || calendarStats.lateNights>=2)));
  const selected = calendarMissing || highYouthLoad ? [] : selectStrengthDays(modes,settings,youth);
  const warnings=[];
  if(calendarMissing)warnings.push('calendar-unconfirmed');
  if(calendarKnown && resolved.repeated)warnings.push('calendar-repeated');
  if(youth && !calendarMissing && restDays<1) warnings.push('no-rest');
  if(youth && !calendarMissing && restDays===1) warnings.push('one-rest');
  if(youth && sportDays>=5) warnings.push('high-team-load');
  if(youth && calendarStats.lateNights>=2) warnings.push('late-finishes');
  if(youth && calendarStats.teamMinutes>=600) warnings.push('high-hours');
  if(youth && settings.strengthSessions>0 && !settings.coachSupervised && !highYouthLoad && !calendarMissing) warnings.push('supervision');
  if(youth && sportDays>=5 && settings.goal==='court') warnings.push('avoid-stacking');
  if(resolved.events.some(e=>e.note==='game-status-unconfirmed'))warnings.push('match-unconfirmed');
  const days=FITNESS_DAYS.map((dayKey,i)=>{
    const date=shiftDate(start,i),events=resolved.events.filter(e=>e.date===date);
    const log=logs.find(l=>l?.memberId===profile.id&&l?.date===date)||null;
    const readiness=assessReadiness(log,profile);
    const base=calendarMissing
      ? {kind:'unconfirmed',duration:0,steps:[step('Δεν έχει επιβεβαιωθεί πρόγραμμα ομάδας για αυτή την εβδομάδα. Εισήγαγε ημερολόγιο ή ενημέρωσε τις ώρες.', 'No team schedule is confirmed for this week. Import or update the calendar.')]}
      : sessionForMode(modes[i],selected.includes(i),settings.goal,settings,youth,i);
    let session=adjustSession(base,readiness);
    const sportMinutes=events.filter(x=>x.type==='team'||x.type==='game').reduce((sum,x)=>sum+eventDuration(x),0);
    const schoolMinutes=events.filter(x=>x.type==='school').reduce((sum,x)=>sum+eventDuration(x),0);
    // Never count guided team practice as extra workout time.
    if(calendarKnown && sportMinutes>0)session={...session,duration:0};
    // Youth resistance needs same-day observed readiness; otherwise no permission
    // to schedule additional independent training.
    if(youth&&session.kind==='strength'&&readiness.level!=='normal'){
      session={...session,kind:'recovery',duration:0,steps:restore};
    }
    return {...session,dayKey,date,mode:modes[i],events,sportMinutes,schoolMinutes,
      extraMinutes: Math.max(0,session.duration||0),readiness,done:!!log?.done,
      sleepHours:log?.sleepHours??null,energy:log?.energy??null,soreness:log?.soreness??null,
      pain:log?.pain===true};
  });
  const extraMinutes=days.reduce((sum,x)=>sum+x.extraMinutes,0);
  const scheduledBasketballMinutes=calendarKnown?calendarStats.teamMinutes:null;
  return {settings,days,weekStart:start,youth,restDays,sportDays,
    strengthDays: days.reduce((a,d,i)=>(d.kind==='strength'?a.concat(i):a),[]),
    warnings,calendar:resolved,calendarStats,calendarKnown,calendarMissing,
    extraMinutes,scheduledBasketballMinutes,highYouthLoad};
}
