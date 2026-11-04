/**
 * ZENITH PRO · athlete-specific, low-fatigue supplementary performance plan.
 *
 * Important: supplementary ≠ team training, and "planned" ≠ cleared to perform.
 * A dated, family-confirmed team calendar is required. Missing check-in, poor
 * recovery, reported pain or absent qualified strength supervision can block a
 * planned workout without hiding the actual program.
 *
 * Evidence basis (not a guarantee of performance improvement):
 * AAP 2020 Resistance Training for Children and Adolescents:
 * https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/
 * AAP 2024 Overuse, Overtraining and Burnout:
 * https://publications.aap.org/pediatrics/article/153/2/e2023065129/196435
 * USA Basketball Youth Guidelines:
 * https://www.usab.com/play/youth-basketball-guidelines
 * Youth basketball injury prevention review:
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC11355145/
 */
import { timeMinutes } from './fitness-calendar.js';

const FOCUS = ['balanced','strength','movement','durability'];
const hhmm = minutes => String(Math.floor(minutes / 60)).padStart(2,'0')+':'+String(minutes % 60).padStart(2,'0');
const title = (el,en)=>({el,en});
const step = (minutes,el,en)=>({minutes,...title(el,en)});
const SERIES = Object.freeze({
  strength: [
    step(4,'Δυναμική προθέρμανση: βάδισμα, κύκλοι ισχίων και αστραγάλων, ρυθμικές άρσεις γονάτου.',
           'Dynamic warm-up: walk, hip/ankle circles and easy marching.'),
    step(4,'Split squat με στήριξη, 1–2 × 6 ανά πόδι, αργή κάθοδος. 45–60″ διάλειμμα. Άριστη τεχνική.',
           'Supported split squat 1–2 × 6 each leg, slow lowering; rest 45–60 sec. Perfect technique.'),
    step(3,'Hip hinge χωρίς βάρος, 1–2 × 8, ουδέτερη σπονδυλική στήλη. Τεχνική πριν από επιβάρυνση.',
           'Unloaded hip hinge 1–2 × 8, neutral back. Technique before load.'),
    step(3,'Push-ups σε σταθερό πάγκο/τοίχο, 1–2 × 8, ελεγχόμενη κίνηση.',
           'Incline or wall push-ups 1–2 × 8, controlled movement.'),
    step(3,'Dead bug 1–2 × 6 ανά πλευρά και ήπια σανίδα 15–20″. Χωρίς κράτημα αναπνοής.',
           'Dead bug 1–2 × 6 per side and easy plank 15–20 sec; do not hold breath.'),
    step(3,'Ήπια χαλάρωση και έλεγχος: πόνος/ανώμαλη κόπωση σημαίνει διακοπή.',
           'Gentle cool-down; stop with pain or unusual fatigue.')
  ],
  movement: [
    step(3,'Δυναμική κινητοποίηση αστραγάλων/ισχίων, χωρίς άλματα.',
           'Easy dynamic ankle and hip mobility; no jumps.'),
    step(3,'Ισορροπία στο ένα πόδι, 2 × 20″ ανά πλευρά, σταθερό γόνατο.',
           'Single-leg balance 2 × 20 sec each side, stable knee alignment.'),
    step(3,'Αργές άρσεις γάμπας, 2 × 10, με ελεγχόμενη κάθοδο.',
           'Slow calf raises 2 × 10 with controlled lowering.'),
    step(3,'Πλάγιο βήμα και σταμάτημα (stick), 2 × 4 ανά πλευρά, χωρίς μέγιστη ταχύτητα.',
           'Lateral step-and-stick, 2 × 4 each side; never maximal speed.'),
    step(3,'Dead bug ή Pallof press με πολύ ελαφρύ λάστιχο, 2 × 6 ανά πλευρά.',
           'Dead bug or very-light-band Pallof press, 2 × 6 each side.')
  ]
});
export const PERFORMANCE_FOCUS = Object.freeze(FOCUS);
export const PERFORMANCE_BASE_WEEK = '2026-11-02';
export const WORKOUT_OBJECTIVES = Object.freeze([
  {key:'strength',el:'Βάσεις δύναμης',en:'Strength foundations'},
  {key:'speed',el:'Μηχανική ταχύτητας',en:'Speed mechanics'},
  {key:'power',el:'Έλεγχος απορρόφησης δύναμης',en:'Power and landing control'},
  {key:'stamina',el:'Αντοχή από την ομάδα',en:'Endurance from team practices'},
  {key:'health',el:'Ισορροπία / πρόληψη',en:'Joint stability and prevention'}
]);
export const SUPPLEMENTARY_SOURCES = Object.freeze([
  {name:'AAP · Youth resistance',url:'https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/'},
  {name:'AAP · Overuse & recovery',url:'https://publications.aap.org/pediatrics/article/153/2/e2023065129/196435'},
  {name:'USA Basketball · Participation',url:'https://www.usab.com/play/youth-basketball-guidelines'},
  {name:'Basketball injury prevention review',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11355145/'}
]);

export function supplementLogId(memberId,date) {
  return 'supplement-log:'+memberId+':'+date;
}

/** Date and member selection are explicit: never show another member's sessions. */
export function eligiblePerformanceAthlete(profile,week) {
  const age=Number(profile?.age);
  return profile?.id==='son' && profile?.athlete!==false && age>=13 && age<18 &&
    week?.settings?.sport==='basketball';
}

/** Focus changes the *small* time allocation, not the intensity or safety gates. */
function targetMinutes(focus) {
  if(focus==='strength')return [22,13];
  if(focus==='movement')return [15,20];
  if(focus==='durability')return [18,17];
  return [20,15];
}
const pace = (amount,initial) => {
  if(!/^(?:1[6-9]):[0-5]\d$/.test(String(initial)))return amount;
  return timeMinutes(initial);
};
const score = status => status==='ready'?3:status==='coach-review'||status==='check-in'?2:1;

/**
 * Determine a real, *proposed* free window. Does not assume the trip from
 * school to home is instantaneous: leave >= 90 min after school, >= 120 min
 * before practice. Time is Europe/Athens local wall clock, no UTC arithmetic.
 */
export function findSafeWindow(day,preferred,minutes) {
  if(!day||!Array.isArray(day.events)||minutes<8||minutes>30)return null;
  const busy=day.events.filter(e=>['school','team','game'].includes(e.type));
  if(!busy.some(e=>e.type==='team') && !busy.some(e=>e.type==='game'))return null;
  const schoolEnds=busy.filter(e=>e.type==='school').map(e=>timeMinutes(e.end)).filter(Number.isFinite);
  const starts=busy.filter(e=>e.type==='team'||e.type==='game').map(e=>timeMinutes(e.start)).filter(Number.isFinite);
  if(!starts.length||starts.some(v=>v===null))return null;
  const candidate=Math.max(timeMinutes(preferred)||1050,schoolEnds.length?Math.max(...schoolEnds)+90:960);
  const finish=candidate+minutes;
  if(candidate>19*60 || finish>=22*60)return null;
  if(starts.some(start=>start-finish<120))return null;
  if(busy.some(e=>{
    const from=timeMinutes(e.start),to=timeMinutes(e.end);
    return from===null||to===null||candidate<to&&finish>from;
  }))return null;
  return {start:hhmm(candidate),end:hhmm(finish),minutes};
}

function readinessStatus(day,settings,kind) {
  if(day.readiness?.level==='stop')return {state:'blocked',reason:'pain'};
  if(day.readiness?.level==='recover')return {state:'blocked',reason:'recovery'};
  if(day.readiness?.level==='caution')return {state:'blocked',reason:'fatigue'};
  if(day.readiness?.level!=='normal')return {state:'check-in',reason:'missing-check-in'};
  if(kind==='strength'&&!settings.coachSupervised)return {state:'coach-review',reason:'coach-required'};
  return {state:'ready',reason:'checked'};
}

function adaptSteps(series,minutes) {
  const original=series.reduce((sum,x)=>sum+x.minutes,0);
  if(original===minutes)return series.map(x=>({...x}));
  // Trim or extend non-loaded warm-up/cool-down rather than scaling reps.
  const out=series.map(x=>({...x}));
  const gap=minutes-original;
  if(gap>0){out[0].minutes+=Math.min(gap,4);out.at(-1).minutes+=Math.max(0,gap-4);}
  else {
    let remaining=-gap;
    for(const i of [out.length-1,0,3,2,1]){
      if(!remaining)break;
      const n=Math.min(remaining,Math.max(0,out[i].minutes-1));
      out[i].minutes-=n;remaining-=n;
    }
  }
  return out;
}

/**
 * @param {object} profile - real family profile (age, height, weight are context)
 * @param {object} week - buildFitnessWeek() output from dated team events
 * @param {Array} logs - separate real supplement completion records
 */
export function buildSupplementaryProgram(profile,week,logs=[]) {
  const empty={available:false,reason:'not-eligible',sessions:[],plannedMinutes:0,
    clearedMinutes:0,completedMinutes:0,remainingMinutes:0,teamMinutes:null,
    restPreserved:true,objectives:WORKOUT_OBJECTIVES};
  if(!eligiblePerformanceAthlete(profile,week))return empty;
  if(!week.calendarKnown)return {...empty,reason:'unconfirmed-calendar'};
  const settings=week.settings;
  const focus=FOCUS.includes(settings.supplementFocus)?settings.supplementFocus:'balanced';
  const dates=[0,3]; // Mon and Thu; protect Wed's rest, Tue's late match and busy weekend.
  const kinds=['strength','movement'];
  const target=targetMinutes(focus);
  const tooMuchBasketball=week.calendarStats.teamMinutes>=14*60||week.sportDays===7||week.restDays<1;
  const sessions=[];
  for(let i=0;i<2;i++){
    const day=week.days[dates[i]];
    if(!day)continue;
    const intended=target[i],preferred=i===0?settings.supplementMondayTime:settings.supplementThursdayTime;
    const window=findSafeWindow(day,preferred||'17:30',intended);
    if(!window)continue;
    const kind=kinds[i],check=readinessStatus(day,settings,kind);
    let state=check.state,reason=check.reason;
    if(settings.supplementEnabled===false){state='disabled';reason='disabled';}
    if(tooMuchBasketball){state='blocked';reason='over-limit';}
    const doneLog=logs.find(x=>x?.id===supplementLogId(profile.id,day.date));
    const done=doneLog?.done===true;
    const steps=adaptSteps(SERIES[kind],intended);
    sessions.push({
      id:supplementLogId(profile.id,day.date),date:day.date,dayIndex:dates[i],
      type:kind,start:window.start,end:window.end,minutes:intended,
      intensity:kind==='strength'?'RPE 4–5/10':'RPE 3–4/10',state,reason,
      steps,done,requiresQualifiedCoach:kind==='strength',
      goals:kind==='strength'?['strength','power','health']:['speed','power','health'],
      schoolMinutes:day.schoolMinutes,teamMinutes:day.sportMinutes,
      readiness:day.readiness?.level||'unknown'
    });
  }
  const plannedMinutes=sessions.reduce((sum,x)=>sum+x.minutes,0);
  const clearedMinutes=sessions.filter(x=>x.state==='ready'&&!x.done).reduce((sum,x)=>sum+x.minutes,0);
  const completedMinutes=sessions.filter(x=>x.done).reduce((sum,x)=>sum+x.minutes,0);
  return {available:true,reason:tooMuchBasketball?'over-limit':null,sessions,focus,
    plannedMinutes,clearedMinutes,completedMinutes,
    remainingMinutes:Math.max(0,plannedMinutes-completedMinutes),
    teamMinutes:week.calendarStats.teamMinutes,
    restPreserved:week.days[2]?.sportMinutes===0&&!sessions.some(x=>x.dayIndex===2),
    objectives:WORKOUT_OBJECTIVES,highTeamLoad:week.highYouthLoad,
    sleepWarning:week.calendarStats.shortestSchoolTurnaround?.minutes<9*60,
    sources:SUPPLEMENTARY_SOURCES};
}
