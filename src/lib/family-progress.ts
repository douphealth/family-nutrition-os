import { SLOTS } from '@/engine/data';
import { addDays } from '@/engine/dates';
import type { State } from './store';

export function memberProgress(state: State, memberId: string, start: string, end: string) {
  let meals = 0, completeDays = 0, days = 0;
  for (let date = start; date <= end; date = addDays(date, 1)) {
    days += 1;
    const count = SLOTS.filter(slot => state.logs[memberId]?.[date]?.meals[slot]?.status === 'done').length;
    meals += count;
    if (count === SLOTS.length) completeDays += 1;
  }
  const sessions = Object.values(state.trainingLogs ?? {}).filter(log =>
    log.memberId === memberId && log.done === true && log.date >= start && log.date <= end &&
    /^(member-session:|supplement-log:|activity-log:)/.test(String(log.id)));
  return { meals, mealTotal: days * SLOTS.length, completeDays, sessions: sessions.length,
    completedMinutes: sessions.reduce((sum, log) => sum + Math.max(0, Number(log.completedMinutes) || 0), 0),
    unknownMinutes: sessions.filter(log => !Number.isFinite(log.completedMinutes)).length };
}

/** Local-only aggregates: no identifiers or personal details leave the device. */
export function familyRoutines(state: State, end: string, days: 7 | 28) {
  const start = addDays(end, 1 - days);
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(start, -days);
  const daily = Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    const members = state.profiles.map(p => memberProgress(state, p.id, date, date));
    return { date, meals: members.reduce((sum, p) => sum + p.meals, 0),
      mealTotal: members.reduce((sum, p) => sum + p.mealTotal, 0),
      sessions: members.reduce((sum, p) => sum + p.sessions, 0) };
  });
  const current = state.profiles.map(p => memberProgress(state, p.id, start, end));
  const previous = state.profiles.map(p => memberProgress(state, p.id, previousStart, previousEnd));
  const meals = current.reduce((sum, p) => sum + p.meals, 0);
  const mealTotal = current.reduce((sum, p) => sum + p.mealTotal, 0);
  const previousMeals = previous.reduce((sum, p) => sum + p.meals, 0);
  return { start, end, daily, meals, mealTotal, previousMeals,
    sessions: current.reduce((sum, p) => sum + p.sessions, 0),
    previousSessions: previous.reduce((sum, p) => sum + p.sessions, 0),
    completedMinutes: current.reduce((sum, p) => sum + p.completedMinutes, 0),
    unknownMinutes: current.reduce((sum, p) => sum + p.unknownMinutes, 0),
    slots: SLOTS.map(slot => ({ slot, completed: daily.reduce((sum, day) => sum +
      state.profiles.filter(p => state.logs[p.id]?.[day.date]?.meals[slot]?.status === 'done').length, 0),
      total: days * state.profiles.length })) };
}
export const ACTIVITY_KINDS = ['team', 'walk', 'strength', 'mobility', 'sport'] as const;
export type ActivityKind = typeof ACTIVITY_KINDS[number];
/** A member-reported completed activity; minutes are what the member actually did, never a plan. */
export function activityLog(memberId: string, date: string, kind: ActivityKind, minutes: number, stamp: number) {
  const m = Math.round(Number(minutes));
  if (!Number.isFinite(m) || m < 1 || m > 240 || !ACTIVITY_KINDS.includes(kind)) return null;
  return { id: `activity-log:${memberId}:${date}:${stamp}`, memberId, date, kind, done: true, completedMinutes: m };
}
