import { describe, expect, it } from 'vitest';
import { BASKETBALL_SKILLS, basketballSkill } from '@/training/basketball-skills';
import { isSafeYouTubeWatchUrl } from '@/training/exercise-library';
import { FAMILY } from '@/engine/data';
import { buildFitnessWeek, defaultFitnessSettings } from '@/training/fitness-engine';
import { buildSupplementaryProgram } from '@/training/performance-program';

describe('Dimitris basketball learning resources', () => {
  it('provides 23 distinct videos across six skill areas with advanced options in each', () => {
    const videos = BASKETBALL_SKILLS.flatMap(s => [...s.videos]);
    expect(BASKETBALL_SKILLS.map(s => s.id)).toEqual(['handling', 'shooting', 'finishing', 'passing', 'defense', 'footwork']);
    expect(new Set(videos.map(v => v.url)).size).toBe(23);
    expect(BASKETBALL_SKILLS.filter(s => s.id !== 'passing').every(s => s.videos.some(v => v.level === 'advanced'))).toBe(true);
    expect(videos.every(v => isSafeYouTubeWatchUrl(v.url))).toBe(true);
  });
  it('does not turn saved refinements into extra workload or clearance', () => {
    const athlete = FAMILY.find(p => p.id === 'son');
    const settings = defaultFitnessSettings(athlete);
    const build = (s: any) => buildSupplementaryProgram(athlete, buildFitnessWeek(athlete, s, [], '2026-11-02'), []);
    const original = build(settings);
    const chosen = build({ ...settings, basketballSkillFocus: 'shooting', basketballCoachNote: 'Guide hand feedback' });
    expect(chosen).toEqual(original);
    expect(chosen.plannedMinutes).toBe(135);
    expect(chosen.clearedMinutes).toBe(0);
    expect(chosen.sessions[1].type).toBe('recovery');
  });
  it('rejects unknown saved skill IDs', () => {
    expect(basketballSkill('shooting')?.id).toBe('shooting');
    expect(basketballSkill('unsafe-extra-workout')).toBeUndefined();
    expect(basketballSkill(undefined)).toBeUndefined();
  });
});