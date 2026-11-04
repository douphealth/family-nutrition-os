import assert from 'node:assert/strict';
import {buildFitnessWeek,defaultFitnessSettings,normalizeFitnessSettings,fitnessLogId} from '../src/fitness-engine.js';
import {buildSupplementaryProgram,inspectTrainingWindow,normalizePersonalSlotPreferences,supplementLogId} from '../src/performance-program.js';
const athlete={id:'son',name:'Δημήτρης',age:15,height:181,weight:65,athlete:true,role:'Basketball · απόδοση'};
const parent={id:'father',age:54,height:174,weight:82};
const baseline=defaultFitnessSettings(athlete);
const reference='2026-11-04';
const build=(settings=baseline,checkins=[])=>buildFitnessWeek(athlete,settings,checkins,reference);
const checkin=date=>({id:fitnessLogId('son',date),date,memberId:'son',checkedAt:date+'T08:00:00Z',
  sleepHours:9,energy:4,soreness:1,pain:false});
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('  ok  '+name);};
test('the requested three 45-minute blocks are visible on exact dates and times',()=>{
 const p=buildSupplementaryProgram(athlete,build());
 assert.equal(p.available,true);
 assert.deepEqual(p.sessions.map(s=>[s.date,s.start,s.end,s.minutes,s.type]),[
  ['2026-11-02','17:30','18:15',45,'strength'],
  ['2026-11-04','19:00','19:45',45,'recovery'],
  ['2026-11-06','06:00','06:45',45,'primer']
 ]);
 assert.equal(p.plannedMinutes,135);
 assert.equal(p.teamMinutes,745);
 assert.equal(p.clearedMinutes,0);
 assert.equal(p.blockedMinutes,45);
});
test('Friday pre-school workout is blocked from Thursday 22:15 finish',()=>{
 const p=buildSupplementaryProgram(athlete,build());
 assert.equal(p.sessions[2].state,'blocked');
 assert.equal(p.sessions[2].reason,'sleep-opportunity');
 assert.equal(p.sessions[2].overnightMinutes,465);
 assert.equal(p.sessions[2].done,false);
});
test('Wednesday is non-sport recovery and preserves strength recovery',()=>{
 const p=buildSupplementaryProgram(athlete,build());
 assert.equal(p.sessions[1].type,'recovery');
 assert.equal(p.restPreserved,true);
 assert.ok(p.sessions[1].steps.every(x=>!/sprints|heavy weights|basketball-specific conditioning/i.test(x.en)));
});
test('exercise steps total exactly 45 minutes for all three requested blocks',()=>{
 const p=buildSupplementaryProgram(athlete,build());
 for(const session of p.sessions){
  assert.equal(session.steps.reduce((n,x)=>n+x.minutes,0),45);
  assert.ok(session.steps.length>=5);
  assert.match(session.intensity,/RPE/);
 }
 assert.match(p.sessions[0].steps.map(x=>x.en).join(' '),/split squats/i);
 assert.match(p.sessions[2].steps.map(x=>x.en).join(' '),/footwork/i);
});
test('normal check-in does not override supervision requirement',()=>{
 const week=build(baseline,[checkin('2026-11-02'),checkin('2026-11-04'),checkin('2026-11-06')]);
 const p=buildSupplementaryProgram(athlete,week);
 assert.equal(p.sessions[0].state,'coach-review');
 assert.equal(p.sessions[1].state,'recovery-only');
 assert.equal(p.sessions[2].state,'blocked');
 assert.equal(p.clearedMinutes,45);
});
test('supervised strength can be cleared, but Friday remains blocked',()=>{
 const settings={...baseline,coachSupervised:true};
 const week=build(settings,[checkin('2026-11-02'),checkin('2026-11-04'),checkin('2026-11-06')]);
 const p=buildSupplementaryProgram(athlete,week);
 assert.equal(p.sessions[0].state,'ready');
 assert.equal(p.sessions[1].state,'recovery-only');
 assert.equal(p.sessions[2].state,'blocked');
 assert.equal(p.clearedMinutes,90);
});
test('reported pain and sleep deficit block a proposed session',()=>{
 for(const modified of [{pain:true},{sleepHours:6},{soreness:4},{energy:2}]){
  const entry={...checkin('2026-11-02'),...modified};
  const p=buildSupplementaryProgram(athlete,build({...baseline,coachSupervised:true},[entry]));
  assert.equal(p.sessions[0].state,'blocked');
  assert.equal(p.clearedMinutes,0);
 }
});
test('time customization accepts 40–60 minutes and preserves calendar',()=>{
 const settings=normalizeFitnessSettings({...baseline,
  supplementmonMinutes:50,supplementwedMinutes:40,supplementfriMinutes:60,
  supplementmonTime:'17:30',supplementwedTime:'19:30',supplementfriTime:'06:10'},athlete);
 const p=buildSupplementaryProgram(athlete,build(settings));
 assert.deepEqual(p.sessions.map(s=>s.minutes),[50,40,60]);
 assert.deepEqual(p.sessions.map(s=>s.start),['17:30','19:30','06:10']);
 assert.equal(p.plannedMinutes,150);
 assert.equal(settings.calendarWeeks['2026-11-02'].length,11);
 assert.equal(p.sessions[2].state,'blocked');
 assert.ok(p.sessions.every(s=>s.steps.reduce((n,x)=>n+x.minutes,0)===s.minutes));
});
test('school/team overlap blocks sessions even with good check-in',()=>{
 const w=build({...baseline,coachSupervised:true},[checkin('2026-11-02')]);
 const slot=normalizePersonalSlotPreferences({...baseline,supplementmonTime:'20:30'})[0];
 assert.equal(inspectTrainingWindow(w,slot).reason,'calendar-conflict');
});
test('sleep-conflict cannot be dismissed by a coach or preference toggle',()=>{
 const custom={...baseline,coachSupervised:true,supplementFocus:'speed'};
 const p=buildSupplementaryProgram(athlete,build(custom,[checkin('2026-11-06')]));
 assert.equal(p.sessions[2].reason,'sleep-opportunity');
 assert.equal(p.sessions[2].state,'blocked');
});
test('a genuinely changed team calendar can change the blocked-window decision',()=>{
 const updated=structuredClone(baseline);
 updated.calendarWeeks['2026-11-02']=updated.calendarWeeks['2026-11-02'].map(e=>
   e.date==='2026-11-05'&&e.type==='team'?{...e,start:'17:00',end:'18:15'}:e);
 const w=build(updated,[checkin('2026-11-06')]);
 const p=buildSupplementaryProgram(athlete,w);
 assert.equal(p.sessions[2].state,'ready');
 assert.equal(p.sessions[2].overnightMinutes,705);
});
test('stored completion is separate from requested or cleared workload',()=>{
 const w=build({...baseline,coachSupervised:true},[checkin('2026-11-02')]);
 const log={id:supplementLogId('son','2026-11-02'),date:'2026-11-02',memberId:'son',done:true};
 const p=buildSupplementaryProgram(athlete,w,[log]);
 assert.equal(p.completedMinutes,45);
 assert.equal(p.plannedMinutes,135);
 assert.equal(p.clearedMinutes,0);
});
test('previous and future unverified weeks have no fabricated sessions',()=>{
 const w=buildFitnessWeek(athlete,baseline,[],'2026-11-11');
 const p=buildSupplementaryProgram(athlete,w);
 assert.equal(p.available,false);
 assert.equal(p.sessions.length,0);
 assert.equal(buildSupplementaryProgram(parent,build()).available,false);
});
test('preferences do not create unsafe 14h+ team workloads',()=>{
 const w=build();w.calendarStats.teamMinutes=845;
 const p=buildSupplementaryProgram(athlete,w);
 assert.equal(p.clearedMinutes,0);
 assert.equal(p.sessions.filter(s=>s.state==='blocked').length,3);
});
test('disabled schedule retains visible requested times but clears no sessions',()=>{
 const w=build({...baseline,supplementEnabled:false});
 const p=buildSupplementaryProgram(athlete,w);
 assert.equal(p.sessions.length,3);
 assert.equal(p.clearedMinutes,0);
 assert.ok(p.sessions.every(s=>s.state==='disabled'));
});
console.log('Athlete Atlas training tests: PASS ('+passed+' checks)');
