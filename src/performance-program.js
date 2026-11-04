/**
 * ZENITH / ATHLETE ATLAS
 * Three requested personal training blocks, explicitly separate from team work.
 * This is a conservative educational planning aid, not an individualized medical
 * or strength-conditioning clearance. Report planned, cleared and completed
 * minutes separately; never conceal inconvenient scheduling conflicts.
 *
 * Source guidelines:
 * USA Basketball youth participation: https://www.usab.com/play/youth-basketball-guidelines
 * AAP youth overuse: https://publications.aap.org/pediatrics/article/153/2/e2023065129/196435
 * CDC adolescent sleep: https://www.cdc.gov/healthy-schools/sleep/
 * AAP youth resistance: https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/
 */
import { timeMinutes } from './fitness-calendar.js';

export const PERFORMANCE_FOCUS = Object.freeze(['balanced','strength','speed','stamina','movement','durability']);
export const PERFORMANCE_BASE_WEEK = '2026-11-02';
export const WORKOUT_OBJECTIVES = Object.freeze([
  {key:'strength',el:'Τεχνική δύναμης',en:'Strength technique'},
  {key:'speed',el:'Μηχανική ταχύτητας',en:'Speed mechanics'},
  {key:'power',el:'Ισχύς / έλεγχος',en:'Power and control'},
  {key:'stamina',el:'Αντοχή από την ομάδα',en:'Endurance from team basketball'},
  {key:'health',el:'Σταθερότητα & πρόληψη',en:'Joint stability and prevention'}
]);
export const SUPPLEMENTARY_SOURCES = Object.freeze([
  {name:'USA Basketball · Youth participation',url:'https://www.usab.com/play/youth-basketball-guidelines'},
  {name:'AAP · Overuse & recovery',url:'https://publications.aap.org/pediatrics/article/153/2/e2023065129/196435'},
  {name:'AAP · Youth resistance',url:'https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/'},
  {name:'CDC · Teen sleep 8–10h',url:'https://www.cdc.gov/healthy-schools/sleep/'}
]);
export const REQUESTED_PERSONAL_SLOTS = Object.freeze([
  {index:0,key:'mon',type:'strength',start:'17:30',duration:45},
  {index:2,key:'wed',type:'recovery',start:'19:00',duration:45},
  {index:4,key:'fri',type:'primer',start:'06:00',duration:45}
]);
const seq = (minutes,el,en)=>({minutes,el,en});
const DRILLS = Object.freeze({
  strength:[
    seq(8,'Ελεγχόμενη προθέρμανση: βάδισμα 2′, δυναμικά ισχία/αστράγαλοι 3′, ασκήσεις ισορροπίας 3′.','Easy warm-up: walk 2m; dynamic hips/ankles 3m; balance 3m.'),
    seq(8,'Καθίσματα χωρίς επιπλέον βάρος 2 × 8 και split squat με στήριξη 2 × 6/πόδι. Διάλειμμα 60″.','Bodyweight squats 2 × 8 and supported split squats 2 × 6/leg; 60s rests.'),
    seq(7,'Hip hinge με ελαφρύ λάστιχο 2 × 8, άρσεις γάμπας 2 × 10. Ουδέτερη πλάτη, αργή κίνηση.','Band hip hinge 2 × 8 and slow calf raises 2 × 10; neutral back and controlled tempo.'),
    seq(7,'Push-up σε πάγκο 2 × 6–8, ήπιες κωπηλατικές με λάστιχο 2 × 8. Προπονητής ελέγχει την τεχνική.','Incline push-ups 2 × 6–8 and easy band rows 2 × 8; coach checks technique.'),
    seq(6,'Dead bug 2 × 6/πλευρά και side plank 2 × 15″/πλευρά, αναπνοή φυσιολογική.','Dead bug 2 × 6/side and side plank 2 × 15s/side; breathe normally.'),
    seq(4,'Τεχνική επιτάχυνσης ΧΩΡΙΣ σπριντ: στάση σώματος και ρυθμικά βήματα 3 × 15″.','Acceleration mechanics WITHOUT sprinting: posture and marching drills 3 × 15s.'),
    seq(5,'Αποθεραπεία, ήρεμη αναπνοή και έλεγχος πόνου/κόπωσης. Καμία προσπάθεια έως εξάντληση.','Cool-down, calm breathing and pain/fatigue check; never train to failure.')
  ],
  recovery:[
    seq(8,'Περπάτημα και ήρεμη αναπνοή. Καμία προπόνηση μπάσκετ ή τρέξιμο για αντοχή.','Easy walking and calm breathing; no basketball-specific or endurance session.'),
    seq(8,'Ήπιες κινητοποιήσεις ισχίων, θωρακικής μοίρας και αστραγάλων με ελεύθερο εύρος.','Gentle hip, thoracic spine and ankle mobility within comfortable range.'),
    seq(8,'Ισορροπία στο ένα πόδι 2 × 20″/πόδι και ελεγχόμενες άρσεις γάμπας 2 × 8.','Single-leg balance 2 × 20s/leg; controlled calf raises 2 × 8.'),
    seq(8,'Διαφραγματική αναπνοή, ήπιο dead bug 2 × 5/πλευρά και διατάσεις χωρίς πίεση.','Diaphragmatic breathing, easy dead bug 2 × 5/side and painless stretches.'),
    seq(8,'Χαμηλής έντασης διατάσεις/χαλάρωση χωρίς άλματα, σπριντ ή βάρη.','Gentle stretching and relaxation; no jumping, sprinting or weights.'),
    seq(5,'Έλεγχος ύπνου, πόνου και κόπωσης· αν η ημέρα είναι βαριά, προτίμησε πλήρη ανάπαυση.','Check sleep, pain and fatigue; choose full rest if recovery is inadequate.')
  ],
  primer:[
    seq(8,'Μόνο αν έχει αποκατασταθεί επαρκής ύπνος: ήπια κινητοποίηση, χωρίς ένταση.','Only after adequate sleep opportunity: gentle mobility without intensity.'),
    seq(10,'Σταθεροποίηση γόνατος/ποδοκνημικής: ήπια ισορροπία 2 × 20″ και ελεγχόμενα step-ups 2 × 5.','Knee/ankle control: easy balance 2 × 20s and controlled step-ups 2 × 5.'),
    seq(9,'Ρυθμικά βήματα τεχνικής σε χαμηλή ταχύτητα, 3 × 20″ με μακρά διαλείμματα.','Low-speed footwork mechanics, 3 × 20s with generous rest.'),
    seq(8,'Ήπια κινητικότητα ώμων/ισχίων και dead bug 2 × 5/πλευρά.','Gentle shoulder/hip mobility and dead bug 2 × 5 per side.'),
    seq(10,'Αργό περπάτημα, χαλάρωση, νερό και πρωινό. Όχι εξαντλητική αντοχή.','Slow walking, relaxation, fluids and breakfast; no exhaustive conditioning.')
  ]
});
const CLOCK=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
const clock=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const validInt=(x,a,b,fallback)=>Number.isInteger(Number(x))&&Number(x)>=a&&Number(x)<=b?Number(x):fallback;

export function supplementLogId(memberId,date){return 'supplement-log:'+memberId+':'+date;}
export function eligiblePerformanceAthlete(profile,week){
  const age=Number(profile?.age);
  return profile?.id==='son'&&profile?.athlete!==false&&age>=13&&age<18&&week?.settings?.sport==='basketball';
}
export function normalizePersonalSlotPreferences(settings={}){
  return REQUESTED_PERSONAL_SLOTS.map((s)=>({
    ...s,
    start:CLOCK.test(settings['supplement'+s.key+'Time']||'')?settings['supplement'+s.key+'Time']:s.start,
    duration:validInt(settings['supplement'+s.key+'Minutes'],40,60,s.duration)
  }));
}
function previousDay(week,i){return i>0?week.days[i-1]:null;}

/** Check both same-day obligations and true overnight opportunity, not a
 * purported "recovery score" inferred from height, weight or labels. */
export function inspectTrainingWindow(week,slot){
  const day=week?.days?.[slot.index];
  if(!day)return {valid:false,reason:'missing-day',minutesBeforeSleep:null};
  const start=timeMinutes(slot.start);
  const end=start===null?null:start+slot.duration;
  if(start===null||end>1440||slot.duration<40||slot.duration>60)
    return {valid:false,reason:'invalid-time',minutesBeforeSleep:null};
  const events=day.events||[];
  for(const e of events){
    const a=timeMinutes(e.start),b=timeMinutes(e.end);
    if(a===null||b===null)continue;
    if(start<b&&end>a)return {valid:false,reason:'calendar-conflict',minutesBeforeSleep:null};
  }
  // Buffer for travel, food and transition. Pre-school morning session needs
  // at least 60 minutes afterward, evening practice at least 120 minutes after.
  const school=events.filter(e=>e.type==='school');
  if(school.some(e=>timeMinutes(e.end)<=start&&start-timeMinutes(e.end)<90))
    return {valid:false,reason:'school-buffer',minutesBeforeSleep:null};
  if(school.some(e=>timeMinutes(e.start)>=end&&timeMinutes(e.start)-end<60))
    return {valid:false,reason:'school-buffer',minutesBeforeSleep:null};
  const team=events.filter(e=>e.type==='team'||e.type==='game');
  if(team.some(e=>timeMinutes(e.start)>=end&&timeMinutes(e.start)-end<120))
    return {valid:false,reason:'team-buffer',minutesBeforeSleep:null};
  const prior=previousDay(week,slot.index);
  const priorEnds=(prior?.events||[]).filter(e=>e.type==='team'||e.type==='game')
    .map(e=>timeMinutes(e.end)).filter(x=>x!==null);
  const latest=priorEnds.length?Math.max(...priorEnds):null;
  const overnight=latest===null?null:1440-latest+start;
  // More than 8h in bed is necessary to actually obtain 8h sleep after travel
  // and settling. Conservative 9h opportunity gate, not an estimate of sleep.
  if(overnight!==null&&overnight<540)
    return {valid:false,reason:'sleep-opportunity',overnightMinutes:overnight};
  // Wednesday must remain free of SPORT-SPECIFIC load; recovery work is optional.
  return {valid:true,reason:'window-confirmed',overnightMinutes:overnight,
    start:slot.start,end:clock(end),minutes:slot.duration};
}
function readinessStatus(day,settings,slot){
  if(day.readiness?.level==='stop')return {state:'blocked',reason:'pain'};
  if(day.readiness?.level==='recover')return {state:'blocked',reason:'recovery'};
  if(day.readiness?.level==='caution')return {state:'blocked',reason:'fatigue'};
  if(day.readiness?.level!=='normal')return {state:'check-in',reason:'missing-check-in'};
  if(slot.type==='strength'&&!settings.coachSupervised)return {state:'coach-review',reason:'coach-required'};
  return {state:'ready',reason:'checked'};
}
function adaptSteps(steps,duration){
  const source=steps.map(x=>({...x}));
  const original=source.reduce((sum,x)=>sum+x.minutes,0);
  if(duration===original)return source;
  const delta=duration-original;
  // Vary rest and gentle warm-up only, not loading or repetitions.
  if(delta>0){
    source[0].minutes+=Math.floor(delta/2);
    source[source.length-1].minutes+=delta-Math.floor(delta/2);
  }else{
    let n=-delta;
    for(const i of [0,source.length-1,source.length-2]){
      const amount=Math.min(n,Math.max(0,source[i].minutes-2));
      source[i].minutes-=amount;n-=amount;
      if(!n)break;
    }
  }
  return source;
}
export function buildSupplementaryProgram(profile,week,logs=[]){
  const empty={available:false,reason:'unverified-week',sessions:[],plannedMinutes:0,
    clearedMinutes:0,completedMinutes:0,remainingMinutes:0,teamMinutes:null,
    objectives:WORKOUT_OBJECTIVES,sources:SUPPLEMENTARY_SOURCES};
  if(!eligiblePerformanceAthlete(profile,week))return {...empty,reason:'not-eligible'};
  if(!week.calendarKnown)return empty;
  const settings=week.settings;
  const focus=PERFORMANCE_FOCUS.includes(settings.supplementFocus)?settings.supplementFocus:'balanced';
  const slots=normalizePersonalSlotPreferences(settings);
  const sessions=slots.map((slot)=>{
    const day=week.days[slot.index];
    const window=inspectTrainingWindow(week,slot);
    const check=readinessStatus(day,settings,slot);
    let state=check.state,reason=check.reason;
    // No realistic check-in can override a timetable conflict or insufficient
    // overnight opportunity at 06:00 after a 22:15 team session.
    if(!window.valid){state='blocked';reason=window.reason;}
    if(settings.supplementEnabled===false){state='disabled';reason='disabled';}
    if(week.calendarStats.teamMinutes>=840||week.sportDays>=7){
      state='blocked';reason='high-team-load';
    }
    if(slot.type==='recovery'&&state==='ready')state='recovery-only';
    const recorded=logs.find(x=>x?.id===supplementLogId(profile.id,day.date));
    const done=recorded?.done===true;
    return {
      id:supplementLogId(profile.id,day.date),date:day.date,dayIndex:slot.index,
      type:slot.type,start:slot.start,end:clock(timeMinutes(slot.start)+slot.duration),
      minutes:slot.duration,goals:slot.type==='strength'?['strength','power','health']:
        slot.type==='recovery'?['mobility','health']:['speed','health'],
      intensity:slot.type==='recovery'?'RPE 1–2/10':'RPE 3–4/10',
      steps:adaptSteps(DRILLS[slot.type],slot.duration),
      requiresQualifiedCoach:slot.type==='strength',state,reason,done,
      conflict:window.valid?null:window.reason,
      overnightMinutes:window.overnightMinutes??null,
      teamMinutes:day.sportMinutes,schoolMinutes:day.schoolMinutes,
      readiness:day.readiness?.level||'unknown',
      note:slot.type==='recovery'?'no-sport-specific-training':null
    };
  });
  const plannedMinutes=sessions.reduce((sum,s)=>sum+s.minutes,0);
  const clearedMinutes=sessions.filter(s=>(s.state==='ready'||s.state==='recovery-only')&&!s.done)
    .reduce((sum,s)=>sum+s.minutes,0);
  const completedMinutes=sessions.filter(s=>s.done).reduce((sum,s)=>sum+s.minutes,0);
  const blockedMinutes=sessions.filter(s=>s.state==='blocked'||s.state==='disabled')
    .reduce((sum,s)=>sum+s.minutes,0);
  return {
    available:true,reason:null,sessions,focus,plannedMinutes,clearedMinutes,
    completedMinutes,blockedMinutes,
    remainingMinutes:Math.max(0,plannedMinutes-completedMinutes),
    teamMinutes:week.calendarStats.teamMinutes,
    restPreserved:sessions[1]?.type==='recovery',
    objectives:WORKOUT_OBJECTIVES,
    sleepWarning:week.calendarStats.shortestSchoolTurnaround?.minutes<9*60,
    sources:SUPPLEMENTARY_SOURCES
  };
}
