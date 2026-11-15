import { describe, expect, it } from 'vitest';
import { FAMILY } from '@/engine/data';
import { memberProgress } from '@/lib/family-progress';
import { mergeChangedState, parseSavedState } from '@/lib/persistence';
import type { State } from '@/lib/store';

function fixture(): State {
  return { profiles: structuredClone(FAMILY), activeId: 'mother', loads: {}, logs: {}, measurements: {}, shopChecked: {}, trainingLogs: {} };
}
describe('Saved family completion', () => {
  it('counts eaten meals for only the selected member, excluding skipped meals', () => {
    const state = fixture();
    state.logs = { mother: { '2026-11-15': { waterMl: 0, meals: { breakfast: { status: 'done', portion: 1 }, lunch: { status: 'skipped', portion: 1 } } } }, father: { '2026-11-15': { waterMl: 0, meals: { breakfast: { status: 'done', portion: 1 } } } } };
    expect(memberProgress(state, 'mother', '2026-11-15', '2026-11-15').meals).toBe(1);
    expect(memberProgress(state, 'daughter', '2026-11-15', '2026-11-15').meals).toBe(0);
  });
  it('counts only completed training, keeping recorded minutes and excluding readiness', () => {
    const state = fixture();
    state.trainingLogs = { a: { id: 'member-session:mother:2026-11-15', memberId: 'mother', date: '2026-11-15', done: true, completedMinutes: 12 }, b: { id: 'fitness-log:mother:2026-11-15', memberId: 'mother', date: '2026-11-15', done: true }, c: { id: 'member-session:father:2026-11-15', memberId: 'father', date: '2026-11-15', done: true, completedMinutes: 30 } };
    const progress = memberProgress(state, 'mother', '2026-11-15', '2026-11-15');
    expect(progress.sessions).toBe(1); expect(progress.completedMinutes).toBe(12);
  });
  it('preserves unrelated tab edits while merging new meal tracking', () => {
    const before = fixture(), after = fixture(), latest = fixture();
    after.logs = { mother: { '2026-11-15': { meals: { breakfast: { status: 'done', portion: 1 } }, waterMl: 0 } } };
    latest.shopChecked = { milk: true };
    const first = latest.profiles[0];
    if (!first) throw new Error('Missing fixture member');
    first.name = 'Updated name';
    const merged = mergeChangedState(before, after, latest);
    expect(merged.shopChecked['milk']).toBe(true); expect(merged.profiles[0]?.name).toBe('Updated name');
    expect(merged.logs['mother']?.['2026-11-15']?.meals['breakfast']?.status).toBe('done');
  });
  it('round trips meal and training tracking through validated backup', () => {
    const state = fixture(); state.trainingLogs = { a: { id: 'member-session:mother:2026-11-15', done: true, completedMinutes: 12 } };
    expect(parseSavedState(JSON.parse(JSON.stringify(state))).trainingLogs?.['a']?.['completedMinutes']).toBe(12);
  });
  it('rejects incomplete backups rather than destroying existing member records', () => {
    expect(() => parseSavedState({ profiles: [{}] })).toThrow();
    expect(() => parseSavedState({ ...fixture(), activeId: 'missing' })).toThrow();
  });
});