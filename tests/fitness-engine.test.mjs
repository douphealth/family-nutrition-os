import assert from 'node:assert/strict';
import {
  defaultFitnessSettings,normalizeFitnessSettings,buildFitnessWeek,assessReadiness,
  fitnessLogId,weekStartOf,shiftDate
} from '../src/fitness-engine.js';

const son={id:'son',name:'Δημήτρης',age:15,sex:'m',height:181,weight:65,role:'Basketball · απόδοση'};
const dad={id:'father',age:54,sex:'m',height:174,weight:82,role:'Γενική υγεία'};
let checks=0;
function test(name,fn){fn();checks++;console.log('  ok  '+name);}
const today='2026-11-04';
test('default youth basketball schedule is editable, not asserted actual',()=>{
 const s=defaultFitnessSettings(son);
 assert.equal(s.source,'starter-preset');assert.deepEqual(s.schedule,['team','team','team','team','team','game','rest']);
 assert.equal(s.coachSupervised,false);
});
test('age guard and profile-specific normalization',()=>{
 const a=normalizeFitnessSettings({strengthSessions:7,minutes:100,goal:'invalid',schedule:['game','rest','illegal']},son);
 assert.equal(a.strengthSessions,2);assert.equal(a.minutes,40);assert.equal(a.goal,'court');assert.equal(a.schedule[2],'team');
 assert.equal(a.memberId,'son');assert.equal(a.id,'fitness:son');
});
test('youth with six sport commitments gets zero extra strength',()=>{
 const w=buildFitnessWeek(son,{...defaultFitnessSettings(son),coachSupervised:true},[],today);
 assert.equal(w.sportDays,6);assert.equal(w.strengthDays.length,0);
 assert.ok(w.warnings.includes('high-team-load'));
 assert.equal(w.days[5].kind,'team');assert.equal(w.days[6].kind,'team');
 assert.equal(w.days[2].kind,'rest'); assert.equal(w.extraMinutes,0);
});
test('no rest triggers warning',()=>{
 const s={...defaultFitnessSettings(son),sport:'general',schedule:Array(7).fill('team')};
 const w=buildFitnessWeek(son,s,[],today);
 assert.equal(w.restDays,0);assert.ok(w.warnings.includes('no-rest'));
});
test('optional strength only with supervision and free days',()=>{
 const s={...defaultFitnessSettings(son),sport:'general',schedule:['free','team','free','light','free','rest','rest'],strengthSessions:2};
 assert.deepEqual(buildFitnessWeek(son,s,[],today).strengthDays,[]);
 const supervised={...s,coachSupervised:true};
 const logs=['2026-11-02','2026-11-04'].map(date=>({
   id:fitnessLogId('son',date),memberId:'son',date,checkedAt:date+'T08:00:00Z',
   sleepHours:9,energy:5,soreness:1
 }));
 const w=buildFitnessWeek(son,supervised,logs,today);
 assert.equal(w.strengthDays.length,2);
 assert.ok(w.strengthDays.every(i=>s.schedule[i]==='free'));
});
test('pain stops the day and sleep fatigue downgrades intensity',()=>{
 const s={...defaultFitnessSettings(son),schedule:['free','rest','team','team','rest','free','rest'],coachSupervised:true};
 const date='2026-11-04';
 const pain={id:fitnessLogId('son',date),memberId:'son',date,checkedAt:'2026-11-04T08:00:00Z',pain:true,sleepHours:9,energy:5,soreness:1};
 let w=buildFitnessWeek(son,s,[pain],date);
 assert.equal(w.days[2].kind,'stop');
 const fatigue={...pain,pain:false,sleepHours:6};
 w=buildFitnessWeek(son,s,[fatigue],date);
 assert.equal(w.days[2].kind,'recovery');
});
test('missing readiness never receives fabricated recovery metrics',()=>{
 const w=buildFitnessWeek(son,defaultFitnessSettings(son),[],today);
 assert.equal(w.days[2].readiness.level,'unknown');
 assert.equal(w.days[2].sleepHours,null);
 assert.equal(w.days[2].energy,null);
});
test('adult program supports optional sessions without youth supervision constraint',()=>{
 const s={...defaultFitnessSettings(dad),schedule:['free','rest','free','rest','free','free','rest'],strengthSessions:3};
 const w=buildFitnessWeek(dad,s,[],today);
 assert.equal(w.youth,false);assert.equal(w.strengthDays.length,3);
});
test('week/date selection is UTC-stable',()=>{
 assert.equal(weekStartOf('2026-11-04'),'2026-11-02');
 assert.equal(shiftDate('2026-11-02',6),'2026-11-08');
 assert.throws(()=>weekStartOf('2026-02-30'));
});
test('readiness thresholds are not diagnoses',()=>{
 assert.equal(assessReadiness(null,son).level,'unknown');
 assert.equal(assessReadiness({pain:true},son).level,'stop');
 assert.equal(assessReadiness({checkedAt:'now',sleepHours:9,energy:4,soreness:1},son).level,'normal');
});
console.log('fitness engine: PASS ('+checks+' checks)');
