/**
 * ZENITH / ATHLETE ATLAS · screen-only athlete cockpit.
 * Planner is not a medical diagnosis; planned ≠ cleared ≠ completed.
 */
import {esc,icon} from './ui.js?v=16.0.0';
import {SUPPLEMENTARY_SOURCES} from './performance-program.js';
import {exerciseFor,isVerifiedYouTube} from './exercise-library.js';

const T=(en,el,english)=>en?english:el;
const kinds={
  strength:['Δύναμη & βασική ισχύς','Strength foundations'],
  recovery:['Αποκατάσταση & κινητικότητα','Recovery and mobility'],
  primer:['Προετοιμασία κίνησης','Movement primer']
};
const reasons={
  'pain':['Αναφέρθηκε πόνος. Μην προπονηθείς: ενημέρωσε γονέα, προπονητή και επαγγελματία υγείας.',
          'Pain reported. Stop: inform a parent, coach and qualified clinician.'],
  'recovery':['Δεν έχει εξασφαλιστεί επαρκής αποκατάσταση. Μην προσθέτεις προπόνηση.',
    'Recovery insufficient. Do not add training.'],
  'fatigue':['Η σημερινή κόπωση δεν επιτρέπει πρόσθετη άσκηση.','Today’s fatigue prevents extra activity.'],
  'missing-check-in':['Συμπλήρωσε ώρες ύπνου, ενέργεια, μυϊκή κόπωση και πόνο την ημέρα της συνεδρίας.',
    'Complete sleep, energy, soreness and pain check-in on the session day.'],
  'coach-required':['Η ενδυνάμωση εφήβου απαιτεί κατάλληλη επίβλεψη προπονητή.',
    'Adolescent strength training requires qualified coach supervision.'],
  'sleep-opportunity':['ΑΠΑΓΟΡΕΥΣΗ ΠΡΟΤΕΙΝΟΜΕΝΗΣ ΩΡΑΣ: μετά από μπάσκετ που τελειώνει 22:15, η έναρξη 06:00 αφήνει μόλις 7ώ45λ πριν από μετακίνηση και ύπνο.',
    'EARLY SLOT BLOCKED: after basketball ending 22:15, a 06:00 start leaves only 7h45m before travel and sleep.'],
  'calendar-conflict':['Η ώρα συγκρούεται με σχολείο ή προπόνηση ομάδας.','Time overlaps school or team practice.'],
  'school-buffer':['Ανεπαρκής χρόνος μετάβασης γύρω από το σχολείο.','Insufficient transition time around school.'],
  'team-buffer':['Χρειάζονται τουλάχιστον 2 ώρες μεταξύ προσωπικής και ομαδικής συνεδρίας.',
    'Allow at least two hours between personal and team sessions.'],
  'high-team-load':['Υψηλό φορτίο ομάδας· χωρίς πρόσθετη προπόνηση.','High team workload; no additional training.'],
  'disabled':['Το προσωπικό πρόγραμμα απενεργοποιήθηκε από τις ρυθμίσεις.','Personal sessions disabled.'],
  'checked':['Με έλεγχο ετοιμότητας, τεχνική και μικρή κόπωση.','After check-in, prioritize technique and low fatigue.']
};
const statuses={
  ready:['Ετοιμότητα ελεγμένη','Readiness checked'],
  'recovery-only':['Μόνο ήπια αποκατάσταση','Gentle recovery only'],
  'check-in':['Περιμένει έλεγχο','Check-in needed'],
  'coach-review':['Περιμένει προπονητή','Coach supervision needed'],
  blocked:['Μη ασφαλές παράθυρο','Unsafe window'],
  disabled:['Απενεργοποιημένο','Disabled']
};
const dateName=(date,en)=>new Intl.DateTimeFormat(en?'en-GB':'el-GR',
  {timeZone:'UTC',weekday:'long',day:'numeric',month:'long'})
    .format(new Date(date+'T12:00:00Z'));

function metric(label,value,sub,extra=''){
 return '<div class="atlas-metric '+extra+'"><span>'+label+'</span><strong>'+value+'</strong><small>'+sub+'</small></div>';
}
function slotSettings(label,timeKey,durationKey,settings,en){
 const minuteOpts=[40,45,50,55,60].map(m=>'<option value="'+m+'" '
   +(Number(settings[durationKey]||45)===m?'selected':'')+'>'+m+' min</option>').join('');
 return '<div class="atlas-slot-editor"><strong>'+label+'</strong>'
   +'<label>'+T(en,'Ώρα','Time')+'<input type="time" name="'+timeKey+'" value="'
   +esc(settings[timeKey]||({supplementmonTime:'17:30',supplementwedTime:'19:00',supplementfriTime:'06:00'})[timeKey])+'""></label>'
   +'<label>'+T(en,'Διάρκεια','Duration')+'<select name="'+durationKey+'">'+minuteOpts+'</select></label></div>';
}
export function performanceSettingsForm(ctx){
 const s=ctx.fitnessWeek.settings,en=ctx.lang==='en';
 const opts=[['balanced','Ισορροπία','Balanced'],['strength','Δύναμη','Strength'],
  ['speed','Τεχνική ταχύτητας','Speed mechanics'],['stamina','Αντοχή ομάδας','Stamina from team'],
  ['movement','Κινητικότητα','Movement'],['durability','Πρόληψη τραυματισμών','Durability']];
 return '<form id="performanceSettingsForm" class="atlas-config">'
  +'<p>'+T(en,'Επεξεργάσου τα τρία επιθυμητά μπλοκ. Ο αλγόριθμος δεν παρακάμπτει ποτέ σύγκρουση ωρών, ελλιπή ύπνο ή πόνους.',
    'Edit three requested blocks. The planner never bypasses overlap, inadequate sleep opportunity or pain.')+'</p>'
  +'<label class="atlas-config-field"><span>'+T(en,'Στόχος','Goal')+'</span><select name="supplementFocus">'
  +opts.map(x=>'<option value="'+x[0]+'" '+(x[0]===(s.supplementFocus||'balanced')?'selected':'')+'>'+x[en?2:1]+'</option>').join('')
  +'</select></label>'
  +'<label class="atlas-config-checkbox"><input name="supplementEnabled" type="checkbox" '+(s.supplementEnabled!==false?'checked':'')+'>'
  +T(en,'Ενεργοποίηση προσωπικού πλάνου','Enable personal plan')+'</label>'
  +'<label class="atlas-config-checkbox"><input name="coachSupervised" type="checkbox" '+(s.coachSupervised===true?'checked':'')+'>'
  +T(en,'Επιβεβαίωση κατάλληλης προπονητικής επίβλεψης στην ενδυνάμωση',
    'Confirm qualified strength coaching supervision')+'</label>'
  +'<div class="atlas-edit-slots">'
  +slotSettings(T(en,'Δευτέρα · Δύναμη','Monday · Strength'),'supplementmonTime','supplementmonMinutes',s,en)
  +slotSettings(T(en,'Τετάρτη · Αποκατάσταση','Wednesday · Recovery'),'supplementwedTime','supplementwedMinutes',s,en)
  +slotSettings(T(en,'Παρασκευή · Πρωινό μπλοκ','Friday · Morning'),'supplementfriTime','supplementfriMinutes',s,en)
  +'</div><p class="atlas-config-warning">'+icon('shield',17)+' '
  +T(en,'Παρασκευή 06:00: αποκλείεται με το ισχύον 22:15 της Πέμπτης. Χρειάζεται πραγματική αλλαγή προγράμματος και επαρκής ανάπαυση, όχι απλή αλλαγή επιλογής.',
    'Friday 06:00 remains blocked with Thursday’s 22:15 finish. Actual schedule change and adequate recovery are required; a settings toggle cannot override this.')+'</p>'
  +'<button type="submit" class="fitness-btn fitness-primary">'+icon('check',18)+' '
  +T(en,'Αποθήκευση προσωπικού πλάνου','Save personal plan')+'</button></form>';
}

function exerciseCard(s,en,index) {
 const label=kinds[s.type]?.[en?1:0]||s.type;
 const allowed=['ready','recovery-only'].includes(s.state);
 const name=statuses[s.state]?.[en?1:0]||s.state;
 const reason=reasons[s.reason]?.[en?1:0]||reasons.checked[en?1:0];
 const steps=s.steps.map((x,i)=>{
   const demos=(x.exerciseIds||[]).map(id=>exerciseFor(id)).filter(Boolean);
   const detail=demos.map((e,j)=>{
     const video=e.video&&isVerifiedYouTube(e.video.url)
       ?'<a class="coach-video-link" href="'+esc(e.video.url)+'" target="_blank" rel="noopener noreferrer"'
       +' aria-label="'+esc(T(en,'Βίντεο τεχνικής','Technique video')+' · '+(en?e.title.en:e.title.el))+'">'
       +icon('arrowUpRight',16)+' '+T(en,'Δες βίντεο','Watch video')+' · '+esc(e.video.channel)
       +icon('arrowUpRight',13)+'</a>':'';
     return '<div class="coach-exercise"><div class="coach-exercise-head"><span class="coach-exercise-index">'
       +String(j+1).padStart(2,'0')+'</span><div><strong>'+esc(en?e.title.en:e.title.el)
       +'</strong><p>'+esc(en?e.dose.en:e.dose.el)+'</p></div></div>'
       +'<div class="coach-cues"><p><b>'+T(en,'Τεχνική','Technique')+':</b> '
       +esc(en?e.cue.en:e.cue.el)+'</p><p><b>'+T(en,'Απόφυγε','Avoid')+':</b> '
       +esc(en?e.avoid.en:e.avoid.el)+'</p><p><b>'+T(en,'Ευκολότερα','Easier')+':</b> '
       +esc(en?e.easier.en:e.easier.el)+'</p></div>'
       +'<div class="coach-exercise-footer"><small>'+icon('target',14)+' '
       +esc(en?e.goal.en:e.goal.el)+'</small>'+video+'</div></div>';
   }).join('');
   return '<div class="atlas-drill coach-drill"><span class="coach-drill-num">'+String(i+1).padStart(2,'0')
     +'</span><div class="coach-drill-main"><p>'+esc(en?x.en:x.el)+'</p>'
     +'<details class="coach-drill-expand"><summary>'+icon('book',16)+' '
     +T(en,'Ασκήσεις, ακριβής τεχνική & YouTube','Exercises, technique & YouTube')+' '
     +'<span class="coach-drill-count">'+demos.length+'</span>'+icon('chevronDown',16)+'</summary>'
     +'<div class="coach-drill-details">'+detail+'</div></details></div><b class="coach-drill-duration">'
     +x.minutes+'′</b></div>';
 }).join('');
 const completeButton=s.done
  ?'<button class="fitness-btn atlas-undo" data-act="performanceDone" data-date="'+esc(s.date)+'" data-done="false">'
    +icon('undo',17)+' '+T(en,'Αναίρεση','Undo completion')+'</button>'
  :'<button class="fitness-btn fitness-primary" data-act="performanceDone" data-date="'+esc(s.date)+'" data-done="true" '
    +(allowed?'':'disabled')+'>'+icon('checkCircle',17)+' '+T(en,'Καταγραφή ολοκλήρωσης','Mark complete')+'</button>';
 return '<article class="atlas-workout '+(s.state==='blocked'?'is-blocked':'')+'">'
  +'<div class="atlas-workout-header"><div class="atlas-day-number">'+String(index+1).padStart(2,'0')+'</div>'
  +'<div class="atlas-workout-title"><small>'+esc(dateName(s.date,en))+' / '
  +esc(s.start)+'–'+esc(s.end)+'</small><h3>'+esc(label)+'</h3>'
  +'<span>'+esc(s.intensity)+' · '+T(en,'Προτεινόμενος χρόνος','Requested duration')+'</span></div>'
  +'<strong class="atlas-duration">'+s.minutes+'<small>MIN</small></strong></div>'
  +'<div class="atlas-session-status '+esc(s.state)+'">'+icon(s.state==='blocked'?'alert':'shield',18)
  +'<span><b>'+esc(name)+'</b> — '+esc(reason)+'</span></div>'
  +'<div class="coach-session-hint">'+icon('info',17)+' '
  +T(en,'Άνοιξε «Ασκήσεις, ακριβής τεχνική & YouTube» σε κάθε στάδιο. Τα βίντεο δείχνουν την κίνηση, όχι το ιδανικό φορτίο για τον Δημήτρη.',
    'Expand each interval for exact technique and YouTube demonstrations. Videos explain movements, not personalized load prescriptions.')
  +'</div><div class="atlas-drill-list">'+steps+'</div>'
  +'<div class="atlas-workout-footer"><span>'+icon('zap',17)+' '
  +T(en,s.type==='recovery'?'Χωρίς έντονη άσκηση':'Τεχνική χωρίς εξάντληση',
    s.type==='recovery'?'No intense training':'Technique, no exhaustion')+'</span>'+completeButton+'</div></article>';
}
function weekStrip(program,ctx,en){
 const days=[['MON','ΔΕΥ'],['TUE','ΤΡΙ'],['WED','ΤΕΤ'],['THU','ΠΕΜ'],['FRI','ΠΑΡ'],['SAT','ΣΑΒ'],['SUN','ΚΥΡ']];
 return '<div class="atlas-week-strip" role="group" tabindex="0" aria-label="'+T(en,'Εβδομάδα σε μία ματιά','Week at a glance')+'">'
  +days.map((d,i)=>{
    const today=ctx.fitnessWeek.days[i],slot=program.sessions.find(x=>x.dayIndex===i);
    const team=today?.sportMinutes||0;
    let state=slot?(slot.state==='blocked'?'blocked':slot.type==='recovery'?'recovery':'personal'):team?'team':'rest';
    return '<div class="atlas-week-day '+state+'"><span>'+(en?d[0]:d[1])+'</span><strong>'
      +(slot?slot.minutes+'′':team?Math.round(team/60*10)/10+'h':'—')+'</strong><small>'
      +(slot?T(en,slot.state==='blocked'?'Μπλοκαρισμένο':slot.type==='recovery'?'Ήπιο':'Προσωπικό',
              slot.state==='blocked'?'Blocked':slot.type==='recovery'?'Recovery':'Personal')
        :team?T(en,'Ομάδα','Team'):T(en,'Ανάπαυση','Rest'))+'</small></div>';
  }).join('')+'</div>';
}

export function performanceView(ctx){
 const program=ctx.supplementaryProgram,en=ctx.lang==='en',p=ctx.profile;
 if(p.id!=='son')return '';
 if(!program?.available){
  return '<section class="atlas-intro" aria-labelledby="atlas-title"><span class="atlas-eyebrow">ZENITH / ATHLETE ATLAS</span>'
   +'<h1 id="atlas-title">'+T(en,'Ατομική απόδοση, με πραγματικά δεδομένα.','Train from your real schedule.')+'</h1>'
   +'<p>'+T(en,'Χρειάζεται επιβεβαιωμένο πρόγραμμα ομάδας για αυτή την εβδομάδα. Δεν δημιουργούμε ψευδή ώρα ή φορτίο.',
   'Confirm the team calendar for this specific week. No fabricated time or training loads.')+'</p>'
   +'<button class="fitness-btn fitness-primary" data-act="fitnessCalendarEdit">'+icon('calendar',18)+' '
   +T(en,'Ενημέρωση ημερολογίου','Update calendar')+'</button></section>';
 }
 const week=ctx.fitnessWeek;
 const headings='<section class="atlas-intro" aria-labelledby="atlas-title"><div class="atlas-intro-grid"><div>'
  +'<span class="atlas-eyebrow">'+icon('zap',17)+' ATHLETE ATLAS / ZENITH PRO</span>'
  +'<h1 id="atlas-title">'+T(en,'Η απόδοση χτίζεται με ακρίβεια.','Performance built with precision.')+'</h1>'
  +'<p>'+esc(p.name)+' · '+esc(p.age)+' '+T(en,'ετών','years')+' · '+esc(p.height)+' cm · '+esc(p.weight)+' kg'
  +'. '+T(en,'Συγκεκριμένα μπλοκ δύναμης, κινητικότητας και ελέγχου κίνησης γύρω από την ομάδα — όχι υποσχέσεις για επιδόσεις ή στόχοι βάρους.',
   'Structured strength, mobility and movement work around the team — no performance guarantees or weight targets.')+'</p>'
  +'<div class="atlas-intro-actions">'
  +'<button class="fitness-btn fitness-primary" data-act="performanceCustomize">'+icon('settings',18)+' '
    +T(en,'Ρύθμισε το πλάνο','Customize plan')+'</button>'
  +'<button class="fitness-btn atlas-ghost-button" data-act="performanceCheckIn">'+icon('heart',18)+' '
    +T(en,'Καθημερινό check-in','Daily check-in')+'</button>'
  +'<button class="fitness-btn atlas-ghost-button" data-act="fitnessCalendarEdit">'+icon('calendar',18)+' '
    +T(en,'Πρόγραμμα ομάδας','Team schedule')+'</button></div></div>'
  +'<div class="atlas-scoreboard"><span>'+T(en,'ΑΙΤΟΥΜΕΝΟ ΠΡΟΓΡΑΜΜΑ','REQUESTED PLAN')+'</span>'
  +'<strong>'+program.plannedMinutes+'<small>′</small></strong>'
  +'<div class="atlas-scoreboard-rule"></div><p>'
    +T(en,'3 μπλοκ × 40–60 λεπτά, όχι όλα εγκεκριμένα','Three 40–60 min blocks; not all cleared')+'</p>'
  +'<b>'+T(en,'Ελεγμένα τώρα','Cleared now')+': '+program.clearedMinutes+'′</b></div></div></section>';
 const metrics='<div class="atlas-metrics">'
   +metric(T(en,'ΟΜΑΔΙΚΟ ΜΠΑΣΚΕΤ','TEAM BASKETBALL'),
      Math.floor(program.teamMinutes/60)+'h '+String(program.teamMinutes%60).padStart(2,'0')+'m',
      T(en,'Καταγεγραμμένες ώρες','Recorded calendar time'))
   +metric(T(en,'ΖΗΤΗΘΗΚΑΝ','REQUESTED'),program.plannedMinutes+'′',
      T(en,'3 προσωπικά μπλοκ','3 personal blocks'))
   +metric(T(en,'ΕΛΕΓΧΘΗΚΑΝ','CLEARED'),program.clearedMinutes+'′',
      T(en,'Με ύπνο, check-in & επίβλεψη','After sleep, check-in and supervision'),'primary')
   +metric(T(en,'ΜΗ ΑΣΦΑΛΗ','BLOCKED'),program.blockedMinutes+'′',
      T(en,'Δεν πρέπει να εκτελεστούν','Must not be performed'),'warning')
   +'</div>';
 const caveat='<div class="atlas-safety-note">'+icon('shield',22)+'<div><strong>'
  +T(en,'Πρώτα ο ύπνος, μετά η προπόνηση','Recovery before additional training')+'</strong><p>'
  +T(en,'Η Παρασκευή 06:00 παραμένει μη διαθέσιμη μετά από Πέμπτη 21:00–22:15 μπάσκετ. Η Τετάρτη είναι προαιρετική ήπια αποκατάσταση — όχι επιπλέον σπριντ ή εξαντλητική αντοχή. Η ενδυνάμωση απαιτεί επιβλέποντα προπονητή.',
    'Friday at 06:00 is blocked after Thursday 21:00–22:15 basketball. Wednesday is optional gentle recovery — not extra sprints or conditioning. Strength work needs qualified supervision.')
   +'</p></div></div>';
 const exercises='<section class="atlas-sessions"><div class="atlas-section-heading"><span>TRAIN SMARTER / RECOVER BETTER</span>'
  +'<h2>'+T(en,'Τρία μπλοκ, πλήρης διαφάνεια.','Three blocks. No false clearance.')+'</h2><p>'
  +T(en,'Κάθε προπόνηση δείχνει ακριβή ώρα, ασκήσεις, διάρκειες και γιατί εγκρίνεται ή αποκλείεται.',
    'Every block shows exact times, drill durations and why it is available or withheld.')+'</p></div>'
  +program.sessions.map((s,i)=>exerciseCard(s,en,i)).join('')+'</section>';
 const evidence='<section class="atlas-evidence"><div><span>'+icon('shield',20)+' EVIDENCE & SAFETY</span><h3>'
  +T(en,'Η επιστήμη πίσω από τις αποφάσεις.','The evidence behind each decision.')+'</h3>'
  +'<p>'+T(en,'Το ύψος και το βάρος δεν υποδεικνύουν από μόνα τους κατάλληλα κιλά, μέγιστη ένταση ή προπονητικό φορτίο. Ο προπονητής πρέπει να ελέγχει την πραγματική εξάσκηση και την αποκατάσταση.',
    'Height and weight alone do not determine lifting loads, maximal intensity or safe training volume. Coaches must review real workloads and recovery.')
  +'</p></div><div>'+SUPPLEMENTARY_SOURCES.map(s=>'<a href="'+esc(s.url)
   +'" rel="noopener noreferrer" target="_blank">'+esc(s.name)+' '+icon('arrowUpRight',14)+'</a>').join('')+'</div></section>';
 return headings+metrics+weekStrip(program,ctx,en)+caveat+exercises+evidence;
}
