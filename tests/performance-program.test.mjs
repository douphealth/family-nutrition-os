import assert from 'node:assert/strict';
import {buildFitnessWeek,defaultFitnessSettings,normalizeFitnessSettings,fitnessLogId} from '../src/fitness-engine.js';
import {buildSupplementaryProgram,findSafeWindow,supplementLogId} from '../src/performance-program.js';

const son={id:'son',name:'Δημήτρης',age:15,height:181,weight:65,athlete:true,role:'Basketball · απόδοση'};
const dad={id:'father',age:54,height:174,weight:82};
const start='2026-11-04';
const settings=defaultFitnessSettings(son);
const plan=()=>buildFitnessWeek(son,settings,[],start);
const good=date=>({id:fitnessLogId('son',date),date,memberId:'son',checkedAt:date+'T09:00:00Z',
  sleepHours:9,energy:4,soreness:1,pain:false});
let assertions=0;
function test(name,fn){fn();assertions++;console.log('  ok  '+name);}
test('actual screenshot creates exactly two supplementary micro-sessions',()=>{
  const w=plan();
  const p=buildSupplementaryProgram(son,w);
  assert.equal(p.available,true);
  assert.equal(p.sessions.length,2);
  assert.equal(p.plannedMinutes,35);
  assert.equal(p.teamMinutes,745);
  assert.deepEqual(p.sessions.map(x=>[x.date,x.start,x.end,x.type,x.minutes]),[
    ['2026-11-02','17:30','17:50','strength',20],
    ['2026-11-05','17:30','17:45','movement',15]
  ]);
  assert.equal(p.restPreserved,true);
  assert.equal(p.clearedMinutes,0); // no invented readiness
});
test('exercise durations add up exactly; details include sets and safe intensity',()=>{
  const p=buildSupplementaryProgram(son,plan());
  for(const x of p.sessions){
    assert.equal(x.steps.reduce((sum,step)=>sum+step.minutes,0),x.minutes);
    assert.ok(x.steps.length>=5);
    assert.match(x.intensity,/RPE/);
  }
  assert.match(p.sessions[0].steps.map(x=>x.en).join(' '),/split squat/i);
  assert.match(p.sessions[1].steps.map(x=>x.en).join(' '),/balance/i);
});
test('school and team commitments always remain unmodified',()=>{
  const w=plan(),p=buildSupplementaryProgram(son,w);
  assert.equal(w.calendarStats.schoolMinutes,2250);
  assert.equal(w.calendarStats.teamMinutes,745);
  assert.equal(p.sessions[0].teamMinutes,105);
  assert.equal(p.sessions[1].schoolMinutes,450);
  assert.equal(w.days[2].mode,'rest');
});
test('normal check-in alone does not qualify unsupervised youth strength',()=>{
  const w=buildFitnessWeek(son,settings,[good('2026-11-02'),good('2026-11-05')],start);
  const p=buildSupplementaryProgram(son,w);
  assert.equal(p.sessions[0].state,'coach-review');
  assert.equal(p.sessions[1].state,'ready');
  assert.equal(p.clearedMinutes,15);
});
test('qualified supervision and readiness release strength, not hard conditioning',()=>{
  const w=buildFitnessWeek(son,{...settings,coachSupervised:true},[good('2026-11-02'),good('2026-11-05')],start);
  const p=buildSupplementaryProgram(son,w);
  assert.equal(p.clearedMinutes,35);
  assert.equal(p.sessions[0].state,'ready');
});
test('pain, inadequate sleep and soreness block a supplemental session',()=>{
  const cases=[
    {...good('2026-11-05'),pain:true},
    {...good('2026-11-05'),sleepHours:6},
    {...good('2026-11-05'),soreness:4},
    {...good('2026-11-05'),energy:2}
  ];
  for(const x of cases){
    const w=buildFitnessWeek(son,settings,[x],start),p=buildSupplementaryProgram(son,w);
    assert.equal(p.sessions[1].state,'blocked');
    assert.equal(p.clearedMinutes,0);
  }
});
test('actual completion logs remain distinct from planned and team minutes',()=>{
  const w=buildFitnessWeek(son,{...settings,coachSupervised:true},[good('2026-11-02'),good('2026-11-05')],start);
  const log={id:supplementLogId('son','2026-11-02'),memberId:'son',date:'2026-11-02',done:true};
  const p=buildSupplementaryProgram(son,w,[log]);
  assert.equal(p.plannedMinutes,35);
  assert.equal(p.completedMinutes,20);
  assert.equal(p.clearedMinutes,15);
});
test('calendar gaps block session with only one hour before practice',()=>{
  const original=plan();
  const monday=structuredClone(original.days[0]);
  monday.events=monday.events.map(x=>x.type==='team'?{...x,start:'19:00',end:'21:00'}:x);
  assert.equal(findSafeWindow(monday,'17:30',20),null);
});
test('user priority changes time allocation without raising loading intensity',()=>{
  for(const focus of ['balanced','strength','movement','durability']){
    const w=buildFitnessWeek(son,{...settings,supplementFocus:focus},[],start);
    const p=buildSupplementaryProgram(son,w);
    assert.equal(p.plannedMinutes,35);
    assert.equal(p.sessions.length,2);
    assert.ok(p.sessions.every(x=>x.steps.reduce((sum,step)=>sum+step.minutes,0)===x.minutes));
  }
});
test('future weeks and other family members get no invented supplementary sessions',()=>{
  const future=buildFitnessWeek(son,settings,[],'2026-11-11');
  assert.equal(buildSupplementaryProgram(son,future).available,false);
  assert.equal(buildSupplementaryProgram(dad,plan()).available,false);
});
test('no session is suggested when team basketball exceeds 14h',()=>{
  const w=plan();w.calendarStats.teamMinutes=850;
  const p=buildSupplementaryProgram(son,w);
  assert.equal(p.clearedMinutes,0);
  assert.ok(p.sessions.every(x=>x.state==='blocked'));
});
test('disabled preference is preserved and visible',()=>{
  const custom=normalizeFitnessSettings({...settings,supplementEnabled:false},son);
  const w=buildFitnessWeek(son,custom,[],start);
  const p=buildSupplementaryProgram(son,w);
  assert.equal(p.sessions.length,2);
  assert.ok(p.sessions.every(x=>x.state==='disabled'));
});
console.log('supplementary athlete plan: PASS ('+assertions+' checks)');
