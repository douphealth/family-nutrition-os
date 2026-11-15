import type { Profile } from '@/lib/store';
import { assessReadiness, buildFitnessWeek, defaultFitnessSettings, fitnessLogId, shiftDate } from './fitness-engine';

export const WHO_ACTIVITY = 'https://www.who.int/news-room/fact-sheets/detail/physical-activity';
const copy = (el: string, en: string) => ({ el, en });
export function memberFocus(p: Profile) {
  if (p.age < 18) return copy('Κίνηση, αυτοπεποίθηση & ανάπτυξη', 'Movement, confidence & growth');
  if (p.goal === 'gradual_fat_loss') return copy('Δύναμη & σταθερή καθημερινή κίνηση', 'Strength & steady daily movement');
  return copy('Καρδιομεταβολική υγεία & λειτουργική δύναμη', 'Cardiometabolic health & functional strength');
}
export function memberDefaults(p: Profile) {
  return { ...defaultFitnessSettings(p), goal: p.age < 18 ? 'mobility' : 'wellbeing', schedule: ['free','light','free','light','free','light','rest'], minutes: p.age < 18 ? 15 : 25, strengthSessions: p.age < 18 ? 0 : 2 };
}
export function buildMemberProgram(p: Profile, saved: any, logs: any[], start: string) {
  const settings = { ...memberDefaults(p), ...saved, ...(p.age < 18 ? { strengthSessions: 0, goal: 'mobility' } : {}) };
  const week = buildFitnessWeek(p, settings, logs, start);
  const sessions = week.days.map((d: any, i: number) => {
    const observation = logs.find(l => l.id !== undefined ? l.id === fitnessLogId(p.id,d.date) : l.memberId === p.id && l.date === d.date);
    const readiness = assessReadiness(observation,p);
    const strength = d.kind === 'strength';
    const rest = d.mode === 'rest' || d.kind === 'rest' || d.kind === 'team' || d.kind === 'game' || d.kind === 'unconfirmed';
    const state = readiness.level === 'stop' || readiness.level === 'recover' || readiness.level === 'caution' ? 'blocked' : rest ? 'disabled' : readiness.level !== 'normal' ? 'check-in' : 'ready';
    const reason = readiness.level === 'stop' ? 'pain' : readiness.level === 'recover' ? 'recovery' : readiness.level === 'caution' ? 'fatigue' : rest ? 'rest' : state === 'check-in' ? 'missing-check-in' : 'checked';
    const minutes = rest || state === 'blocked' ? 0 : d.duration;
    let steps;
    if (strength) steps = [
      { minutes: 5, ...copy('Ήπια προθέρμανση: περπάτημα και άνετη κινητικότητα ισχίων/αστραγάλων.', 'Easy warm-up: walk and gently move hips and ankles.'), exerciseIds: ['hip-mobility','ankle-mobility'] },
      { minutes: Math.max(5,minutes-10), ...copy('Ξεκίνα με 1 σετ: κάθισμα προς καρέκλα × 8, push-up στον τοίχο × 8, άρσεις γάμπας × 10 και dead bug × 6/πλευρά. 60″ ανάπαυση μεταξύ ασκήσεων. Δεύτερο σετ μόνο αν η τεχνική παραμένει άνετη.', 'Start with 1 set: chair squat × 8, wall push-up × 8, calf raise × 10 and dead bug × 6/side. Rest 60 sec between exercises. Add a second set only while technique remains comfortable.'), exerciseIds: ['squat','push','calf','deadbug'] },
      { minutes: 5, ...copy('Χαλαρό περπάτημα και φυσιολογική αναπνοή. Καμία προσπάθεια έως εξάντληση.', 'Easy walking and normal breathing. Never train to failure.'), exerciseIds: ['walk','breathing'] },
    ];
    else steps = [
      { minutes: Math.max(1,minutes-5), ...copy(p.age < 18 ? 'Διάλεξε κίνηση που απολαμβάνεις: ήπιο περπάτημα, χορό ή ποδήλατο. Άνετος ρυθμός, χωρίς στόχο καύσης θερμίδων.' : 'Περπάτημα σε επίπεδη ασφαλή διαδρομή, σε άνετο ρυθμό που επιτρέπει συνομιλία. Ξεκίνα με λιγότερα λεπτά αν είσαι αδρανής.', p.age < 18 ? 'Choose movement you enjoy: easy walking, dancing or cycling. Comfortable pace, with no calorie-burning target.' : 'Walk on a safe level route at a comfortable talking pace. Start with fewer minutes if you have been inactive.'), exerciseIds: ['walk'] },
      { minutes: 5, ...copy('Ήπια κινητικότητα ισχίων/αστραγάλων και ισορροπία με στήριξη: 1 × 20″/πόδι. Σταμάτα αν υπάρχει πόνος.', 'Gentle hip/ankle mobility and supported balance: 1 × 20 sec/leg. Stop if painful.'), exerciseIds: ['hip-mobility','ankle-mobility','balance'] },
    ];
    return { id: `member-session:${p.id}:${d.date}`, date: d.date, dayIndex:i, type: strength ? 'strength' : 'mobility', start:'', end:'', minutes, intensity:'RPE 2–4/10', steps, state, reason, done: logs.some(l => l.id === `member-session:${p.id}:${d.date}` && l.done === true) };
  });
  return { week, sessions, settings, focus:memberFocus(p), plannedMinutes:sessions.reduce((n:number,s:any)=>n+s.minutes,0), completedMinutes:logs.filter(l => l.memberId === p.id && l.done === true && l.date >= start && l.date <= shiftDate(start,6) && String(l.id).startsWith('member-session:')).reduce((n:number,l:any)=>n+Math.max(0,Number(l.completedMinutes)||0),0) };
}