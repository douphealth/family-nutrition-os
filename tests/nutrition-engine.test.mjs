import assert from 'node:assert/strict';
import { isMinor, canUseAdultBmi, adultBmiLabel, energyRange, portionProfile, hydrationTarget } from '../src/nutrition-engine.js';

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
console.log('nutrition-engine tests: PASS');
