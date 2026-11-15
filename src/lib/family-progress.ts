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
    /^(member-session:|supplement-log:)/.test(String(log.id)));
  return { meals, mealTotal: days * SLOTS.length, completeDays, sessions: sessions.length,
    completedMinutes: sessions.reduce((sum, log) => sum + Math.max(0, Number(log.completedMinutes) || 0), 0),
    unknownMinutes: sessions.filter(log => !Number.isFinite(log.completedMinutes)).length };
}