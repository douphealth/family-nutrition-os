/**
 * Premium guided training experience. Distinguishes recommended, cleared and
 * completed minutes. User input stays on the current device by default.
 */
import {esc,icon} from './ui.js?v=16.0.0';
import {SUPPLEMENTARY_SOURCES,PERFORMANCE_FOCUS} from './performance-program.js';

const labels={
  strength:['Βάσεις Δύναμης','Strength Foundations'],
  movement:['Κίνηση & Σταθερότητα','Movement & Stability'],
  ready:['Ελεγμένο · έτοιμο','Ready after check-in'],
  'check-in':['Απαιτείται check-in','Check-in required'],
  'coach-review':['Επίβλεψη προπονητή','Coach confirmation required'],
  blocked:['Ανάρρωση · όχι άσκηση','Recovery · skip session'],
  disabled:['Προαιρετικό πρόγραμμα εκτός','Optional sessions disabled']
};
const why={
  pain:['Αναφέρθηκε πόνος. Σταμάτα και ενημέρωσε γονέα, προπονητή και επαγγελματία υγείας.','Pain reported. Stop and inform a parent, coach and clinician.'],
  recovery:['Χαμηλός ύπνος ή αυξημένη κόπωση: μην προσθέσεις προπόνηση.','Low sleep or high fatigue: no added training.'],
  fatigue:['Μειωμένη ετοιμότητα: σήμερα δεν προσθέτουμε ένταση.','Reduced readiness: no extra training today.'],
  'missing-check-in':['Δώσε ύπνο, ενέργεια, κόπωση και τυχόν πόνο πριν ξεκινήσεις.','Enter sleep, energy, soreness and pain before starting.'],
  'coach-required':['Η δύναμη εφήβου χρειάζεται κατάλληλη επίβλεψη και έγκριση.','Youth strength work needs qualified supervision and approval.'],
  'over-limit':['Το φορτίο της ομάδας είναι υπερβολικό για έξτρα δουλειά.','Team workload is too high for supplementary training.'],
  disabled:['Απενεργοποιημένο από τις προσωπικές ρυθμίσεις.','Disabled in personal preferences.'],
  checked:['Ακολούθησε τις οδηγίες προπονητή, με χαμηλή κόπωση και καθαρή τεχνική.','Follow coaching, stay low-fatigue, prioritize technique.']
};
const tr=(en,el,english)=>en?english:el;
const dname=(date,lang)=>new Intl.DateTimeFormat(lang==='en'?'en-GB':'el-GR',{weekday:'long',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
const yn=(x)=>x?'checked':'';

export function performanceSettingsForm(ctx) {
  const s=ctx.fitnessWeek.settings,en=ctx.lang==='en';
  const opts=[['balanced','Ισορροπία','Balanced'],
    ['strength','Δύναμη','Strength emphasis'],
    ['movement','Ποιότητα κίνησης','Movement quality'],
    ['durability','Προστασία αρθρώσεων','Durability']];
  return '<form id="performanceSettingsForm" class="pp-settings">'
    +'<p>'+tr(en,'Αυτό το πρόγραμμα συμπληρώνει τη δουλειά του προπονητή. Δεν αντικαθιστά την ομάδα και δεν αυξάνει αυτόματα ένταση.',
      'This program complements coaching and does not automatically increase training intensity.')+'</p>'
    +'<label><span>'+tr(en,'Προσωπικός στόχος','Training priority')+'</span><select name="supplementFocus">'
    +opts.map(x=>'<option value="'+x[0]+'" '+(x[0]===(s.supplementFocus||'balanced')?'selected':'')+'>'+x[en?2:1]+'</option>').join('')
    +'</select></label>'
    +'<label class="pp-check"><input type="checkbox" name="supplementEnabled" '+yn(s.supplementEnabled!==false)+'>'
    +tr(en,'Ενεργοποίηση προαιρετικών προπονήσεων','Enable optional workouts')+'</label>'
    +'<div class="pp-settings-grid"><label><span>'+tr(en,'Δευτέρα · προτεινόμενη ώρα','Monday · proposed time')+'</span>'
    +'<input type="time" name="supplementMondayTime" min="16:00" max="19:00" value="'+esc(s.supplementMondayTime||'17:30')+'"></label>'
    +'<label><span>'+tr(en,'Πέμπτη · προτεινόμενη ώρα','Thursday · proposed time')+'</span>'
    +'<input type="time" name="supplementThursdayTime" min="16:00" max="19:00" value="'+esc(s.supplementThursdayTime||'17:30')+'"></label></div>'
    +'<p class="pp-hint">'+tr(en,'Ο χρόνος ελέγχεται με το πραγματικό σχολείο και το μπάσκετ. Αν δεν χωράει ή αν λείπει το ημερολόγιο, η συνεδρία ακυρώνεται, δεν μεταφέρεται κρυφά.',
      'Times are checked against school and basketball. Conflicting or unverified sessions are withheld, never silently rescheduled.')+'</p>'
    +'<button type="submit" class="fitness-btn fitness-primary">'+icon('check',17)+' '+tr(en,'Αποθήκευση προγράμματος','Save performance plan')+'</button></form>';
}

export function performanceView(ctx) {
  const program=ctx.supplementaryProgram;
  if(!program?.available && ctx.profile.id!=='son')return '';
  const en=ctx.lang==='en';
  if(!program.available){
    return '<section class="pp-stage"><div class="pp-stage-heading"><span>ZENITH / ATHLETE LAB</span><h2>'
      +tr(en,'Ατομική βελτίωση από πραγματικά δεδομένα','Personal development from real data')
      +'</h1><p>'+tr(en,'Συμπλήρωσε το πραγματικό πρόγραμμα ομάδας ώστε να δημιουργηθεί ασφαλές πρόσθετο πλάνο.',
        'Confirm the team calendar first. No extra sessions are generated from unknown schedules.')+'</p></div></section>';
  }
  const year=ctx.fitnessWeek.weekStart;
  const next=program.sessions.find(x=>!x.done)||program.sessions[0];
  const hero='<section class="pp-stage" aria-labelledby="pp-title">'
    +'<div class="pp-stage-heading"><span class="pp-kicker">'+icon('zap',15)+' ATHLETE DEVELOPMENT / '+year+'</span>'
    +'<h1 id="pp-title">'+tr(en,'Γίνε καλύτερος. Όχι απλώς πιο κουρασμένος.','Build the athlete. Not the fatigue.')+'</h2>'
    +'<p>'+tr(en,'Προσωπικό πλάνο για τον Δημήτρη, 15 ετών · 181 cm · 65 kg, βασισμένο στις πραγματικές ώρες ομάδας. Τα σωματομετρικά είναι πλαίσιο, όχι συνταγή κιλών.',
      'Dimitris · 15 years · 181 cm · 65 kg. Team-calendar-aware supplemental program. Measurements provide context, not a weight target.')+'</p>'
    +'<div class="pp-stage-actions"><button class="fitness-btn fitness-primary" data-act="performanceCustomize">'+icon('sliders',17)
    +' '+tr(en,'Προσαρμογή','Customize')+'</button>'
    +'<button class="fitness-btn pp-stage-outline" data-act="fitnessCalendarEdit">'+icon('calendar',17)+' '
    +tr(en,'Ώρες ομάδας','Team calendar')+'</button></div></div>'
    +'<div class="pp-target">'
    +'<span>'+tr(en,'ΠΡΟΣΘΕΤΟ ΠΛΑΝΟ / ΕΒΔΟΜΑΔΑ','OPTIONAL PERSONAL WORK / WEEK')+'</span><strong>'
    +program.plannedMinutes+'<small> min</small></strong><p>'
    +tr(en,'Προτάσεις, όχι εκτελεσμένα λεπτά','Planned, not completed minutes')+'</p></div></section>';
  const kpis='<div class="pp-indicators">'
    +'<div><span>'+tr(en,'Μπάσκετ ομάδας','Team basketball')+'</span><b>'+Math.floor(program.teamMinutes/60)+'h '+String(program.teamMinutes%60).padStart(2,'0')+'m</b><small>'+tr(en,'Επαληθευμένες ώρες','Recorded calendar time')+'</small></div>'
    +'<div><span>'+tr(en,'Πρόσθετο πλάνο','Extra plan')+'</span><b>'+program.plannedMinutes+'′</b><small>'+tr(en,'Υπό όρους','Subject to readiness')+'</small></div>'
    +'<div><span>'+tr(en,'Προς εκτέλεση τώρα','Cleared now')+'</span><b>'+program.clearedMinutes+'′</b><small>'+tr(en,'Όχι χωρίς check-in','No check-in, no clearance')+'</small></div>'
    +'<div><span>'+tr(en,'Ολοκληρωμένα','Completed')+'</span><b>'+program.completedMinutes+'′</b><small>'+tr(en,'Από πραγματικές καταγραφές','From actual session logs')+'</small></div></div>';
  const sessions=program.sessions.map((session,i)=>{
    const isReady=session.state==='ready',status=labels[session.state]||labels.blocked;
    const text=why[session.reason]||why.checked;
    const goals=session.goals.map(goal=>({strength:['Δύναμη','Strength'],power:['Ισχύς / έλεγχος','Power control'],
      speed:['Μηχανική ταχύτητας','Speed mechanics'],health:['Υγεία αρθρώσεων','Joint health']})[goal]||[goal,goal]).map(v=>v[en?1:0]);
    const list=session.steps.map((x,j)=>'<div class="pp-step"><div>'+String(j+1).padStart(2,'0')+'</div><p>'+esc(en?x.en:x.el)
      +'</p><b>'+x.minutes+'′</b></div>').join('');
    const btn=session.done?'<button class="fitness-btn pp-undo" data-act="performanceDone" data-date="'+esc(session.date)
      +'" data-done="false">'+icon('undo',16)+' '+tr(en,'Αναίρεση ολοκλήρωσης','Undo completion')+'</button>'
      :'<button class="fitness-btn fitness-primary" data-act="performanceDone" data-date="'+esc(session.date)
      +'" data-done="true" '+(isReady?'':'disabled')+'>'+icon('checkCircle',17)+' '
      +tr(en,'Ολοκλήρωσα ασφαλώς','Mark completed')+'</button>';
    return '<article class="pp-session '+(i===0?'pp-first':'')+'"><div class="pp-session-head">'
      +'<div class="pp-session-mark">'+icon(session.type==='strength'?'zap':'activity',24)+'</div>'
      +'<div><span class="pp-session-label">'+esc(dname(session.date,ctx.lang))+' · '+esc(session.start)+'–'+esc(session.end)+'</span>'
      +'<h3>'+esc(labels[session.type][en?1:0])+'</h3><div class="pp-goals">'
      +goals.map(x=>'<small>'+esc(x)+'</small>').join('')+'</div></div><div class="pp-session-duration">'
      +'<b>'+session.minutes+'′</b><small>'+session.intensity+'</small></div></div>'
      +'<div class="pp-state '+esc(session.state)+'">'+icon(session.state==='ready'?'checkCircle':'shield',17)
      +'<span><strong>'+esc(status[en?1:0])+'</strong> · '+esc(text[en?1:0])+'</span></div>'
      +'<div class="pp-steps">'+list+'</div>'
      +'<div class="pp-session-bottom"><span>'+tr(en,'Συντονισμός με την ομάδα · χαμηλή κόπωση','Coordination with team · low fatigue')+'</span>'+btn+'</div>'
      +'</article>';
  }).join('');
  const none=program.sessions.length===0?'<div class="pp-empty">'+icon('shield',21)+' '
    +tr(en,'Δεν εντοπίστηκε ασφαλές διαθέσιμο παράθυρο σε αυτή την εβδομάδα. Διόρθωσε το ημερολόγιο ή τις ώρες.',
      'No safe free window is available in this week. Review calendar and preferences.')+'</div>':'';
  const protect='<div class="pp-recovery">'+icon('heart',23)+'<div><strong>'
    +tr(en,'Τετάρτη: πραγματική αποκατάσταση','Wednesday: protected recovery')+'</strong><p>'
    +tr(en,'Καμία επιπλέον έντονη άσκηση. Οι δύο μικροσυνεδρίες δεν προσθέτουν σπριντ, μέγιστα βάρη, αλτικές επαναλήψεις ή εξαντλητική αντοχή. Συνεννόηση με τον προπονητή.',
      'No added intense exercise. The micro-sessions avoid sprints, maximal loads, repeated jumps and exhausting conditioning. Coordinate with the coach.')
    +'</p></div></div>';
  const note='<div class="pp-science"><div><strong>'+icon('shield',18)+' '
    +tr(en,'Πώς προσαρμόζεται','How adaptation works')+'</strong><p>'
    +tr(en,'Ακριβείς ώρες ομάδας + σχολείο + κενά 90′/120′ + ηλικία + στόχοι + ύπνος/πόνος/κόπωση + επίβλεψη. Ούτε ύψος ούτε βάρος καθορίζουν από μόνα τους ασφαλή ένταση ή κιλά.',
      'Exact team and school times, 90/120-minute buffers, age, goals, sleep/pain/fatigue check-in and supervision. Height and weight alone cannot establish safe load.')
    +'</p></div><div class="pp-citations">'
    +SUPPLEMENTARY_SOURCES.map(x=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(x.url)+'">'+esc(x.name)+'</a>').join('')
    +'</div></div>';
  return hero+kpis+'<section class="pp-workouts" aria-label="'+tr(en,'Προσωπικές συνεδρίες','Personal sessions')+'">'
    +'<div class="pp-section-title"><span>THE PERSONAL EDGE</span><h2>'
    +tr(en,'Συγκεκριμένη άσκηση. Συγκεκριμένος χρόνος.','Exact exercises. Exact times.')+'</h2>'
    +'<p>'+tr(en,'Μόνο αν περάσει ο καθημερινός έλεγχος ετοιμότητας και η έγκριση προπονητή.',
      'Only after daily readiness screening and qualified coaching clearance.')+'</p></div>'
    +none+sessions+protect+note+'</section>';
}
