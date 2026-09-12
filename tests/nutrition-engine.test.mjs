import assert from 'node:assert/strict';
import {
  isMinor, canUseAdultBmi, adultBmiLabel, energyRange, portionProfile, hydrationTarget,
  mealMacros, swapCandidates, nextMealNudge
} from '../src/nutrition-engine.js';

const son={sex:'m',age:15,height:179,weight:67,athlete:true,goal:'performance',activityFactor:1.8};
const daughter={sex:'f',age:17,height:165,weight:52,athlete:false,goal:'growth',activityFactor:1.55};
const nineteen={sex:'f',age:19,height:165,weight:60,athlete:false,goal:'maintain',activityFactor:1.5};
const mother={sex:'f',age:51,height:167,weight:87,athlete:false,goal:'gradual_fat_loss',activityFactor:1.35};

assert.equal(isMinor(son),true);
assert.equal(canUseAdultBmi(son),false);
assert.equal(adultBmiLabel(son),null,'Minors must never receive adult BMI labels');
assert.equal(canUseAdultBmi(nineteen),false,'Adult BMI categories should not be used below age 20');
assert.equal(adultBmiLabel(nineteen),null);
assert.ok(energyRange(son,'hard').upper>energyRange(son,'rest').upper,'Athlete energy estimate should rise with training load');
assert.ok(portionProfile(son,'hard').carbs>portionProfile(son,'rest').carbs,'Athlete carb portion should respond to training load');
assert.equal(energyRange(daughter,'hard').upper,energyRange(daughter,'rest').upper,'Non-athlete teen estimate should not change from another member training load');
assert.equal(isMinor(mother),false);
assert.equal(canUseAdultBmi(mother),true);
assert.ok(adultBmiLabel(mother));
assert.ok(energyRange(mother).upper<energyRange({...mother,goal:'maintain'}).upper,'Adult gradual fat-loss estimate should be below maintenance');
assert.ok(hydrationTarget(son,'game').ml>hydrationTarget(son,'rest').ml,'Athlete hydration starting estimate should respond to load');

/* ── swapCandidates: same-slot, no self, ranked in the MEMBER's numbers ────
 * A swap is only useful if it is a real alternative for the same meal slot and
 * if "closest" is measured against what THIS person's plate would have been.
 * The fixtures are built so the expected kcal are exact for a maintenance
 * adult: all four portion groups are 1,0×, so a delta in the fixture is a
 * property of the function, not of a rounding coincidence.
 */

const adultMaintain={sex:'f',age:40,height:167,weight:70,athlete:false,goal:'maintain',activityFactor:1.4};
const R=(id,slot,p,c,f)=>({id,slot,base:{p,c,f}});

const dinner=R('orig','dinner',30,40,10);                  // 370 kcal reference serving
const swapPool=[
  R('far','dinner',30,40,20),                              // 460 kcal → +90
  R('mid','dinner',30,40,12),                              // 388 kcal → +18
  R('near','dinner',30,40,11),                             // 379 kcal → +9
  R('lunchish','lunch',30,40,10),                          // right macros, WRONG slot
  R('breakish','breakfast',30,40,10),                      // right macros, WRONG slot
  dinner                                                   // the recipe we are replacing
];
const swaps=swapCandidates(dinner,adultMaintain,'normal',swapPool);

// same-slot-only filtering
assert.ok(swaps.length>0,'a slot with alternatives must return some');
assert.ok(swaps.every(s=>s.recipe.slot==='dinner'),'every swap must belong to the original slot');
assert.equal(swaps.some(s=>s.recipe.id==='lunchish'),false,'a lunch recipe must never be offered for dinner');
assert.equal(swaps.some(s=>s.recipe.id==='breakish'),false,'a breakfast recipe must never be offered for dinner');

// no self-inclusion, even though the original is in the pool
assert.equal(swaps.some(s=>s.recipe===dinner),false,'the original recipe must not be offered as its own swap');
assert.equal(swaps.some(s=>s.recipe.id==='orig'),false,'the original id must be filtered out by id too');

// ordering is truly by kcal closeness: |+9| < |+18| < |+90|
assert.deepEqual(swaps.map(s=>s.recipe.id),['near','mid','far'],'closest energy first');
const gaps=swaps.map(s=>Math.abs(s.kcalDelta));
assert.ok(gaps[0]<gaps[1]&&gaps[1]<gaps[2],'the returned deltas must be strictly increasing in magnitude');

// closeness is ABSOLUTE: a dish 4 kcal above the plan beats one 36 kcal below it,
// otherwise the list would silently push everyone toward a smaller plate.
const over=R('aBitOver','dinner',30,40,10.4);   // 374 kcal → +4
const under=R('wayUnder','dinner',30,40,6);     // 334 kcal → −36
const absolute=swapCandidates(dinner,adultMaintain,'normal',[under,over]);
assert.deepEqual(absolute.map(s=>s.recipe.id),['aBitOver','wayUnder'],'a near-but-higher dish must outrank a far-but-lower one');
assert.equal(absolute[0].kcalDelta,4);
assert.equal(absolute[1].kcalDelta,-36);

// entry shape and signed deltas (candidate − original)
const near=swaps[0];
assert.deepEqual(Object.keys(near).sort(),['cDelta','fDelta','kcalDelta','macros','pDelta','recipe']);
assert.equal(near.kcalDelta,9,'signed kcal delta points up: candidate is 9 kcal above the original');
assert.equal(near.pDelta,0,'same protein');
assert.equal(near.cDelta,0,'same carbs');
assert.equal(near.fDelta,1,'one extra fat gram: +9 kcal');
assert.deepEqual(near.macros,mealMacros(near.recipe,adultMaintain,'normal',1),'macros must be the member-scaled mealMacros result');
assert.ok(swaps.find(s=>s.recipe.id==='far').kcalDelta===90,'a far candidate reports its real surplus');

// a candidate BELOW the original reports a negative delta, not an absolute value
const lighter=R('lighter','dinner',30,40,8);                // 352 kcal → −18
const down=swapCandidates(dinner,adultMaintain,'normal',[lighter]);
assert.equal(down.length,1);
assert.equal(down[0].kcalDelta,-18,'a lighter candidate must report a negative delta');
assert.equal(down[0].fDelta,-2);

// deterministic tie-breaking: ±18 must order by id, not by pool position
const tied=swapCandidates(dinner,adultMaintain,'normal',[R('zzzHigh','dinner',30,40,12),R('aaaLow','dinner',30,40,8)]);
assert.deepEqual(tied.map(s=>s.recipe.id),['aaaLow','zzzHigh'],'equal energy gaps must break on the recipe id');
assert.deepEqual(
  swapCandidates(dinner,adultMaintain,'normal',[R('aaaLow','dinner',30,40,8),R('zzzHigh','dinner',30,40,12)]).map(s=>s.recipe.id),
  ['aaaLow','zzzHigh'],
  'tie order must not depend on the order of the input pool'
);
assert.deepEqual(swapCandidates(dinner,adultMaintain,'normal',swapPool),swaps,'identical inputs must give an identical result');

// limit: defaults to 4, is honoured, and a zero limit is an empty list rather than everything
const five=['p1','p2','p3','p4','p5'].map((id,i)=>R(id,'dinner',30,40,i+8));
assert.equal(swapCandidates(dinner,adultMaintain,'normal',five).length,4,'default limit is four');
assert.equal(swapCandidates(dinner,adultMaintain,'normal',five,{limit:2}).length,2,'an explicit limit must be honoured');
assert.deepEqual(swapCandidates(dinner,adultMaintain,'normal',five,{limit:0}),[],'a zero limit offers nothing');
assert.equal(swapCandidates(dinner,adultMaintain,'normal',five).length<five.length,true,'the limit must actually truncate the pool');

// empty-result cases must return [] and must not throw
assert.deepEqual(swapCandidates(dinner,adultMaintain,'normal',[]),[],'no pool, no swaps');
assert.deepEqual(swapCandidates(dinner,adultMaintain,'normal',null),[],'a garbage pool is treated as empty');
assert.deepEqual(swapCandidates(dinner,adultMaintain,'normal',[dinner]),[],'only the original in the pool means no swap');
assert.deepEqual(swapCandidates(dinner,adultMaintain,'normal',swapPool.filter(r=>r.slot!=='dinner')),[],'nothing in the right slot means no swap');
assert.deepEqual(swapCandidates(null,adultMaintain,'normal',swapPool),[],'a missing recipe must not throw');
assert.deepEqual(swapCandidates({id:'broken',slot:'dinner'},adultMaintain,'normal',swapPool),[],'a recipe without base macros must not throw');
assert.doesNotThrow(()=>swapCandidates(dinner,adultMaintain,'normal',[null,undefined,{id:'x'}]),'malformed pool entries must not throw');

/* "Closest for whom?" — the same pair of candidates must rank differently for
 * the fat-loss mother (fat 0,8×, carbs 0,75×) and the fuelled athlete son
 * (carbs 1,6× on a hard day). Otherwise the ranking is using the reference
 * serving and the feature is not macro-aware at all.
 */
const flipBase=R('orig2','dinner',20,60,5);                 // mother 296 kcal · son 525 kcal
const flipPool=[R('carbHeavy','dinner',20,70,5),R('fatHeavy','dinner',20,60,10)];
const forMother=swapCandidates(flipBase,mother,'normal',flipPool);
const forSon=swapCandidates(flipBase,son,'hard',flipPool);
assert.equal(forMother[0].recipe.id,'carbHeavy','the fat-loss plate has fats trimmed, so extra carbs are the closer swap');
assert.equal(forSon[0].recipe.id,'fatHeavy','a fuelled athlete already eats more carbs, so extra fat is the closer swap');
assert.equal(forMother[0].kcalDelta,30,'deltas are scaled to the mother, not the reference serving');
assert.equal(forSon[0].kcalDelta,45,'deltas are scaled to the son, not the reference serving');
assert.notEqual(forSon[0].kcalDelta,forMother[0].kcalDelta,'the same recipe pair must not carry one shared delta for every member');

/* ── nextMealNudge: which meal is next, and is it late? ────────────────────
 * Injected clock and schedule, so every boundary below is exact. Times are
 * built with the local Date constructor to match how the function reads them.
 */

const nudgeTimes={breakfast:'07:30',lunch:'13:30',snack:'17:30',dinner:'20:30'};
const at=(h,m=0)=>new Date(2026,8,12,h,m,0,0);
const nudge=(log,now)=>nextMealNudge({log,slotTimes:nudgeTimes,now});

// upcoming, and named in Greek
const morning=nudge({meals:{}},at(6,0));
assert.deepEqual(morning,{slot:'breakfast',label:'Πρωινό',time:'07:30',minutesUntil:90,state:'upcoming'});
assert.equal(nudge(undefined,at(6,0)).slot,'breakfast','a missing log means nothing is logged yet');

// due window: ±45 minutes is still "due", one minute further is not
assert.equal(nudge({meals:{}},at(7,30)).minutesUntil,0);
assert.equal(nudge({meals:{}},at(7,30)).state,'due','exactly on time is due');
assert.equal(nudge({meals:{}},at(6,45)).state,'due','+45 min is the last minute that is still due');
assert.equal(nudge({meals:{}},at(6,44)).state,'upcoming','+46 min has tipped into upcoming');
assert.equal(nudge({meals:{}},at(8,15)).state,'due','−45 min is the last minute that is still due');
assert.equal(nudge({meals:{}},at(8,16)).state,'overdue','−46 min has tipped into overdue');
assert.equal(nudge({meals:{}},at(8,16)).minutesUntil,-46,'minutesUntil is signed once the time has passed');

// the case the feature exists for: at 21:00 dinner is due, not "four meals to go"
const evening=nudge({meals:{breakfast:{status:'done'},lunch:{status:'done'},snack:{status:'done'}}},at(21,0));
assert.equal(evening.slot,'dinner','at 21:00 the family is not four meals away from the plan');
assert.equal(evening.minutesUntil,-30);
assert.equal(evening.state,'due','dinner is 30 minutes behind, still within the window');
assert.equal(nudge({meals:{breakfast:{status:'done'},lunch:{status:'done'},snack:{status:'done'}}},at(22,0)).state,'overdue');
assert.equal(nudge({meals:{}},at(21,0)).slot,'breakfast','an unlogged day still points at the first meal, never at a count of four');
assert.equal(nudge({meals:{}},at(21,0)).minutesUntil,-810,'breakfast is 13,5 hours behind at 21:00');
assert.equal(nudge({meals:{}},at(21,0)).state,'overdue');
assert.equal(nudge({meals:{}},at(8,20)).state,'overdue');

// first meal that is neither done nor skipped, with the right Greek label
assert.equal(nudge({meals:{breakfast:{status:'done'}}},at(12,0)).slot,'lunch');
assert.equal(nudge({meals:{breakfast:{status:'done'}}},at(12,0)).label,'Μεσημεριανό');
assert.equal(nudge({meals:{breakfast:{status:'skipped'}}},at(12,0)).slot,'lunch','a skipped meal is behind you too');
assert.equal(nudge({meals:{breakfast:{status:'done'},lunch:{status:'skipped'}}},at(12,0)).slot,'snack');
assert.equal(nudge({meals:{breakfast:{status:'done'},lunch:{status:'done'},snack:{status:'done'}}},at(18,0)).label,'Βραδινό');
assert.equal(nudge({meals:{breakfast:{status:'done'},lunch:{status:'done'},snack:{status:'done'}}},at(18,0)).minutesUntil,150);
assert.equal(nudge({meals:{breakfast:{status:'done'},lunch:{status:'skipped'}}},at(18,0)).slot,'snack','a skipped lunch moves the nudge forward');

// an unknown status is still an unlogged meal
assert.equal(nudge({meals:{breakfast:{status:'eaten-ish'}}},at(6,0)).slot,'breakfast');

// all done / all skipped → complete, with nothing else to say
assert.deepEqual(nudge({meals:{breakfast:{status:'done'},lunch:{status:'done'},snack:{status:'done'},dinner:{status:'done'}}},at(22,0)),{slot:null,state:'complete'});
assert.deepEqual(nudge({meals:{breakfast:{status:'skipped'},lunch:{status:'skipped'},snack:{status:'skipped'},dinner:{status:'skipped'}}},at(22,0)),{slot:null,state:'complete'});
assert.deepEqual(nudge({meals:{breakfast:{status:'done'},lunch:{status:'done'},snack:{status:'done'},dinner:{status:'skipped'}}},at(8,0)),{slot:null,state:'complete'});

// day boundary: just after midnight, breakfast is ahead of us, not behind
const midnight=nudge({meals:{}},at(0,30));
assert.equal(midnight.slot,'breakfast');
assert.equal(midnight.minutesUntil,420,'00:30 to a 07:30 breakfast is +420 minutes, never a wrap');
assert.equal(midnight.state,'upcoming');
assert.equal(nudge({meals:{}},at(0,0)).minutesUntil,450,'00:00 is the widest positive gap to breakfast');
assert.equal(nudge({meals:{}},new Date(2026,8,12,23,59,0,0)).slot,'breakfast','late at night the next meal is still breakfast');
assert.equal(nudge({meals:{}},new Date(2026,8,12,23,59,0,0)).minutesUntil,-989,'and it counts as long overdue');

// malformed input must degrade to 'complete' rather than throw
assert.doesNotThrow(()=>nextMealNudge(),'a call with no arguments must not throw');
assert.deepEqual(nextMealNudge(),{slot:null,state:'complete'});
assert.deepEqual(nextMealNudge({log:null,slotTimes:null,now:null}),{slot:null,state:'complete'});
assert.deepEqual(nextMealNudge({log:'nope',slotTimes:'nope',now:new Date(2026,8,12,7,0)}),{slot:null,state:'complete'});
assert.equal(nextMealNudge({log:{meals:'nope'},slotTimes:nudgeTimes,now:at(7,0)}).slot,'breakfast','a garbage meals map is treated as an empty log, not as a crash');
assert.deepEqual(nextMealNudge({log:{meals:{}},slotTimes:{breakfast:'not-a-time'},now:at(7,0)}),{slot:null,state:'complete'},'an unparseable time cannot be nudged');
assert.deepEqual(nextMealNudge({log:{meals:{}},slotTimes:{breakfast:'25:00'},now:at(7,0)}),{slot:null,state:'complete'},'an impossible time cannot be nudged');
assert.deepEqual(nextMealNudge({log:{meals:{}},slotTimes:nudgeTimes,now:'2026-09-12'}),{slot:null,state:'complete'},'a non-Date clock is ignored');
assert.deepEqual(nextMealNudge({log:{meals:{}},slotTimes:nudgeTimes,now:new Date('nope')}),{slot:null,state:'complete'},'an invalid Date is ignored');

// purity: same inputs, same answer
assert.deepEqual(nudge({meals:{breakfast:{status:'done'}}},at(13,0)),nudge({meals:{breakfast:{status:'done'}}},at(13,0)));
assert.equal(nudge({meals:{breakfast:{status:'done'}}},at(13,0)).minutesUntil,30,'13:00 to a 13:30 lunch is +30 minutes');
assert.equal(nudge({meals:{breakfast:{status:'done'}}},at(13,0)).state,'due');

console.log('nutrition-engine tests: PASS');
