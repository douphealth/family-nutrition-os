import { describe, expect, it } from 'vitest';
import { FAMILY } from '@/engine/data';
import { assessReadiness, buildFitnessWeek, defaultFitnessSettings, normalizeFitnessSettings } from '@/training/fitness-engine';
import { buildSupplementaryProgram } from '@/training/performance-program';
import { EXERCISE_LIBRARY, TECHNIQUE_VIDEOS, isSafeYouTubeWatchUrl } from '@/training/exercise-library';

const athlete = FAMILY.find(p => p.id === 'son');
const settings = { ...defaultFitnessSettings(athlete), coachSupervised: true };
const ready = (date: string, extra = {}) => ({ memberId: 'son', date, checkedAt: `${date}T08:00:00Z`, sleepHours: 9, energy: 4, soreness: 1, ...extra });
const program = (logs: any[] = [], config = settings, date = '2026-11-02') => buildSupplementaryProgram(athlete, buildFitnessWeek(athlete, config, logs, date), logs);

describe('Recovered supplemental basketball safety rules', () => {
  it('restores exactly three 45-minute requested windows', () => {
    const p = program();
    expect(p.sessions.map((s: any) => [s.type,s.start,s.minutes])).toEqual([['strength','17:30',45],['recovery','19:00',45],['primer','06:00',45]]);
    expect(p.plannedMinutes).toBe(135);
    for (const s of p.sessions) expect(s.steps.reduce((n: number,x: any) => n+x.minutes,0)).toBe(45);
  });
  it('does not fabricate a future team calendar or sessions', () => {
    expect(program([],settings,'2026-11-16').sessions).toEqual([]);
  });
  it('requires reported readiness rather than a fabricated ready score', () => {
    expect(assessReadiness(undefined,athlete).level).toBe('unknown');
    expect(program().sessions[0].state).toBe('check-in');
  });
  it('blocks Friday 06:00 after Thursday 22:15 despite a good check-in', () => {
    const friday = program([ready('2026-11-06')]).sessions[2];
    expect(friday.state).toBe('blocked');
    expect(friday.reason).toBe('sleep-opportunity');
    expect(friday.overnightMinutes).toBe(465);
  });
  it('blocks supplemental work when pain is reported', () => {
    const monday = program([ready('2026-11-02',{ pain: true })]).sessions[0];
    expect(monday.state).toBe('blocked');
    expect(monday.reason).toBe('pain');
  });
  it('requires qualified supervision for strength even with good readiness', () => {
    const monday = program([ready('2026-11-02')],{ ...settings, coachSupervised: false }).sessions[0];
    expect(monday.state).toBe('coach-review');
  });
  it('keeps Wednesday recovery-only rather than sport conditioning', () => {
    const wed = program([ready('2026-11-04')]).sessions[1];
    expect(wed.state).toBe('recovery-only');
    expect(wed.type).toBe('recovery');
  });
  it('does not count planned sessions as completed', () => {
    expect(program().completedMinutes).toBe(0);
    expect(program().clearedMinutes).toBe(0);
  });
  it('does not rewrite recorded basketball workload when a future plan changes', () => {
    const log = { id: 'supplement-log:son:2026-11-02', memberId: 'son', date: '2026-11-02', done: true, completedMinutes: 12 };
    expect(program([log], { ...settings, supplementmonMinutes: 60 }).completedMinutes).toBe(12);
  });
  it('every session interval maps to known exercise guides', () => {
    for (const s of program().sessions) for (const step of s.steps) {
      expect(step.exerciseIds.length).toBeGreaterThan(0);
      for (const id of step.exerciseIds) expect(EXERCISE_LIBRARY[id]).toBeDefined();
    }
  });
  it('provides 14 direct YouTube demos with safe watch links', () => {
    expect(Object.keys(TECHNIQUE_VIDEOS)).toHaveLength(14);
    for (const video of Object.values(TECHNIQUE_VIDEOS) as any[]) expect(isSafeYouTubeWatchUrl(video.url)).toBe(true);
    expect(isSafeYouTubeWatchUrl('https://www.youtube.com.evil.test/watch?v=yzL1543i1-o')).toBe(false);
  });
  it('allows moving Friday later to protect sleep without bypassing timetable checks', () => {
    const moved = normalizeFitnessSettings({ ...settings, supplementfriTime: '17:00' },athlete);
    expect(moved.supplementfriTime).toBe('17:00');
    const friday = program([ready('2026-11-06')],moved).sessions[2];
    expect(friday.start).toBe('17:00');
    expect(friday.reason).toBe('checked');
  });
});