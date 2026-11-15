import { describe, expect, it } from 'vitest';
import { FAMILY, RECIPES } from '@/engine/data';
import { buildMemberProgram, memberFocus } from '@/training/member-program';
import { buildFitnessWeek, defaultFitnessSettings } from '@/training/fitness-engine';
import { mealMacros, scaledIngredients, kcalFromMacros, targetsFor } from '@/engine/nutrition-engine';
import { translate } from '@/lib/i18n';

describe('Member-specific training and language-neutral nutrition', () => {
  it('gives the mother strength and consistent-movement focus', () => {
    const p=FAMILY.find(p=>p.id==='mother');
    expect(memberFocus(p).en).toBe('Strength & steady daily movement');
    expect(buildMemberProgram(p,{},[],'2026-11-16').sessions.filter((s:any)=>s.type==='strength')).toHaveLength(2);
  });
  it('gives the father cardiometabolic and functional strength focus', () => {
    const p=FAMILY.find(p=>p.id==='father');
    expect(memberFocus(p).en).toBe('Cardiometabolic health & functional strength');
  });
  it('gives the daughter growth-oriented movement without weight-loss or strength prescription', () => {
    const p=FAMILY.find(p=>p.id==='daughter');
    expect(memberFocus(p).en).toBe('Movement, confidence & growth');
    expect(buildMemberProgram(p,{},[],'2026-11-16').sessions.some((s:any)=>s.type==='strength')).toBe(false);
  });
  it('zero requested strength sessions really means zero', () => {
    const p=FAMILY.find(p=>p.id==='father');
    const week=buildFitnessWeek(p,{...defaultFitnessSettings(p),strengthSessions:0},[],'2026-11-16');
    expect(week.strengthDays).toHaveLength(0);
  });
  it('does not restore youth strength from saved adult settings', () => {
    const p=FAMILY.find(p=>p.id==='daughter');
    expect(buildMemberProgram(p,{strengthSessions:3,goal:'strength'},[],'2026-11-16').sessions.some((s:any)=>s.type==='strength')).toBe(false);
  });
  it('keeps reported completed minutes independent of a changed plan', () => {
    const p=FAMILY.find(p=>p.id==='mother');
    const log={id:'member-session:mother:2026-11-16',memberId:'mother',date:'2026-11-16',done:true,completedMinutes:12};
    expect(buildMemberProgram(p,{minutes:30},[log],'2026-11-16').completedMinutes).toBe(12);
  });
  it('requires each member’s own readiness and blocks their own pain report', () => {
    const mother=FAMILY.find(p=>p.id==='mother');
    const fatherLog={memberId:'father',date:'2026-11-16',checkedAt:'2026-11-16T09:00Z',sleepHours:9,energy:4,soreness:1};
    expect(buildMemberProgram(mother,{},[fatherLog],'2026-11-16').sessions[0].state).toBe('check-in');
    const own={...fatherLog,memberId:'mother',pain:true};
    expect(buildMemberProgram(mother,{},[own],'2026-11-16').sessions[0].reason).toBe('pain');
    expect(buildMemberProgram(mother,{},[own],'2026-11-16').sessions[0].minutes).toBe(0);
  });
  it('all recipes preserve energy derived from macros across every member', () => {
    for(const p of FAMILY) for(const r of RECIPES) {
      const before=mealMacros(r,p,'normal');
      translate(r.name,'en');
      expect(mealMacros(r,p,'normal')).toEqual(before);
      expect(before.kcal).toBeCloseTo(kcalFromMacros(before),0);
      expect(scaledIngredients(r,p,'normal').every((line:any)=>Number.isFinite(line.g)&&line.g>0)).toBe(true);
    }
  });
  it('both adolescents retain the engine’s no-restriction safety note', () => {
    for(const id of ['daughter','son']) expect(targetsFor(FAMILY.find(p=>p.id===id)).energy.note).toMatch(/ποτέ στόχος περιορισμού/);
  });
});