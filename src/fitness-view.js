import { esc, icon, GREEK_DAYS_SHORT } from './ui.js?v=16.0.0';
import { FITNESS_DAYS, FITNESS_GOALS, FITNESS_MODES } from './fitness-engine.js';

const NAMES = {free:['Διαθέσιμος','Available'],team:['Ομάδα','Team practice'],game:['Αγώνας','Game'],light:['Ήπια','Easy day'],rest:['Ρεπό','Rest']};
const KIND = {rest:['Ανάπαυση','Rest'],game:['Αγώνας','Game day'],team:['Ομαδική προπόνηση','Team practice'],strength:['Ενδυνάμωση','Strength'],skills:['Τεχνική','Skills'],mobility:['Κινητικότητα','Mobility'],recovery:['Αποκατάσταση','Recovery'],stop:['Διακοπή','Stop training'],easy:['Ήπια αντοχή','Easy endurance']};
const GOALS = {wellbeing:['Ευεξία','Wellbeing'],court:['Μπάσκετ','Basketball'],strength:['Δύναμη','Strength'],endurance:['Αντοχή','Endurance'],mobility:['Ευκινησία','Mobility']};
const title = (el,en,english)=>english?en:el;
const daysEn=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const dateLabel = date => date.slice(8,10)+'/'+date.slice(5,7);
const selected = (value,current)=>value===current?' selected':'';
const checked = value=>value?' checked':'';
const opt = (v,label,current)=>'<option value="'+esc(v)+'"'+selected(v,current)+'>'+esc(label)+'</option>';
const button = (act,label,extra='')=>'<button type="button" class="fitness-btn '+extra+'" data-act="'+act+'">'+label+'</button>';

export function fitnessSettingsForm(ctx) {
  const f=ctx.fitnessWeek.settings, en=ctx.lang==='en';
  const label=(name,titleText,html)=>'<label class="fitness-label"><span>'+esc(titleText)+'</span>'+html+'</label>';
  const select=(name,items,current)=>'<select name="'+name+'">'+items.map(x=>opt(x[0],x[1],current)).join('')+'</select>';
  const schedules=FITNESS_DAYS.map((_,i)=>label('day'+i,en?daysEn[i]:GREEK_DAYS_SHORT[i],select('day'+i,Object.entries(NAMES).map(([k,v])=>[k,v[en?1:0]]),f.schedule[i]))).join('');
  const goals=FITNESS_GOALS.map(x=>[x,GOALS[x][en?1:0]]);
  const sports=[['basketball',en?'Basketball':'Μπάσκετ'],['football',en?'Football':'Ποδόσφαιρο'],['running',en?'Running':'Τρέξιμο'],['general',en?'General':'Γενική άσκηση'],['other',en?'Other':'Άλλο']];
  const experience=[['beginner',en?'Beginner':'Αρχάριος'],['intermediate',en?'Experienced':'Με εμπειρία']];
  const equipment=[['none',en?'Bodyweight':'Χωρίς όργανα'],['bands',en?'Bands':'Λάστιχα'],['gym',en?'Gym':'Γυμναστήριο']];
  const number=(name,value,max)=>'<input type="number" name="'+name+'" min="'+(name==='minutes'?10:0)+'" max="'+max+'" step="'+(name==='minutes'?5:1)+'" value="'+value+'" required>';
  return '<form id="fitnessSettingsForm" class="fitness-form fitness-settings-form" data-member="'+esc(ctx.profile.id)+'">'
    +'<p class="fitness-note">'+title('Καταχώρισε τις πραγματικές προπονήσεις και τον αγώνα. Η προεπιλογή δεν είναι πραγματικό ιστορικό.','Enter actual practices and match days. The starter schedule is not verified.',en)+'</p>'
    +'<div class="fitness-form-grid">'
    +label('goal',title('Στόχος','Goal',en),select('goal',goals,f.goal))
    +label('sport',title('Άθλημα','Sport',en),select('sport',sports,f.sport))
    +label('experience',title('Εμπειρία','Experience',en),select('experience',experience,f.experience))
    +label('equipment',title('Εξοπλισμός','Equipment',en),select('equipment',equipment,f.equipment))
    +label('minutes',title('Πρόσθετα λεπτά','Optional minutes',en),number('minutes',f.minutes,ctx.fitnessWeek.youth?40:60))
    +label('strengthSessions',title('Προαιρετική ενδυνάμωση / εβδομάδα','Optional strength / week',en),number('strengthSessions',f.strengthSessions,ctx.fitnessWeek.youth?2:3))
    +'</div><label class="fitness-checkbox"><input type="checkbox" name="coachSupervised"'+checked(f.coachSupervised)+'><span>'+title('Η ενδυνάμωση επιβλέπεται από ειδικευμένο προπονητή','Strength supervised by a qualified coach',en)+'</span></label>'
    +'<fieldset class="fitness-day-fields"><legend>'+title('Η πραγματική εβδομάδα','Your real training week',en)+'</legend>'+schedules+'</fieldset>'
    +'<button type="submit" class="fitness-btn fitness-primary">'+icon('check',17)+' '+title('Αποθήκευση προγράμματος','Save schedule',en)+'</button></form>';
}

export function fitnessView(ctx) {
  const p=ctx.profile,w=ctx.fitnessWeek,en=ctx.lang==='en';
  const focus=w.days.find(x=>x.date===ctx.fitnessSelectedDate)||w.days.find(x=>x.date===ctx.dateKey)||w.days[0];
  const today=w.days.find(x=>x.date===ctx.dateKey);
  const done=w.days.filter(x=>x.done).length;
  const mood=today?.readiness.level||'unknown';
  const moodText={unknown:['Δεν υπάρχει check-in','No check-in'],stop:['Διακοπή','Stop'],recover:['Αποκατάσταση','Recover'],caution:['Προσοχή','Caution'],normal:['Κανονική','Normal']}[mood][en?1:0];
  const warnings={
    'one-rest':['Μόνο ένα ρεπό· ελέγξτε την εβδομαδιαία αποφόρτιση με τον προπονητή.','Only one rest day; review recovery with your coach.'],
    'no-rest':['Δεν υπάρχει ρεπό. Προγραμματίστε ημέρα χωρίς οργανωμένη άθληση.','No rest day. Schedule time off organized sport.'],
    'high-team-load':['6+ ημέρες ομάδας/αγώνα. Δεν προστίθεται ενδυνάμωση.','6+ team/game days. Extra strength is withheld.'],
    'supervision':['Η έξτρα δύναμη εφήβων απαιτεί επίβλεψη.','Youth resistance training requires qualified supervision.'],
    'avoid-stacking':['Απόφυγε πρόσθετα σπριντ ή βαριά βάρη μετά την ομάδα.','Avoid stacking hard sprints or weights on team training.']
  };
  const shell='<div class="page fitness-page"><section class="fitness-hero"><div><span class="fitness-tag">'+icon('zap',16)+' ZENITH / PERFORMANCE STUDIO</span>'
    +'<h1>'+title('Ο δικός σου ρυθμός','Your training, your pace',en)+'</h1><p>'+title('Δυναμικό πρόγραμμα που σέβεται την ομάδα, την ανάπαυση και τους στόχους σου.','An adaptive week built around your team, recovery and goals.',en)+'</p>'
    +'<div class="fitness-profile">'+icon('users',20)+' <span><strong>'+esc(p.name)+'</strong><small>'+esc(p.age)+' '+title('ετών','years',en)+' · '+esc(p.height)+' cm · '+esc(p.weight)+' kg</small></span></div>'
    +'<div class="fitness-hero-actions">'+button('fitnessEdit',icon('sliders',18)+' '+title('Προσαρμογή','Customize',en),'fitness-primary')+button('nav',icon('utensils',18)+' '+title('Διατροφή','Nutrition',en),'fitness-outline').replace('data-act="nav"','data-act="nav" data-view="today"')+'</div>'
    +'</div><div class="fitness-hero-score"><div class="fitness-score-ring" style="--p:'+Math.round(done/7*100)+'"><b>'+done+'<small>/7</small></b></div><strong>'+title('Η εβδομάδα σου','Your week',en)+'</strong><small>'+title('Καταγεγραμμένες ημέρες','Logged days',en)+'</small></div></section>';
  const warningsHtml=(w.settings.source==='starter-preset'?'<div class="fitness-alert">'+icon('info',18)+title('Προκαθορισμένη εβδομάδα — επιβεβαίωσε ημέρες προπόνησης και αγώνα.','Starter preset: confirm your actual team and game days.',en)+'</div>':'')
    +(w.youth?'<div class="fitness-alert">'+icon('shield',18)+title('Για ανήλικους απαιτείται γονική και προπονητική επίβλεψη. 8–10 ώρες ύπνου για ηλικίες 13–17.','Minors need parental and coach oversight. Ages 13–17 need 8–10 hours of sleep.',en)+'</div>':'')
    +w.warnings.map(k=>'<div class="fitness-alert fitness-warning">'+icon('alert',18)+esc(warnings[k][en?1:0])+'</div>').join('');
  const metrics='<div class="fitness-metrics">'
    +[[w.sportDays,title('Ομάδα & αγώνες','Team & games',en),'users'],[w.restDays,title('Ρεπό','Rest days',en),'bed'],[w.strengthDays.length,title('Έξτρα δύναμη','Extra strength',en),'zap'],[done,title('Ολοκλήρωση','Completed',en),'checkCircle']]
    .map(([num,label,ic])=>'<div class="fitness-metric"><span>'+icon(ic,17)+esc(label)+'</span><b>'+num+'</b><small>'+title('ανά εβδομάδα','per week',en)+'</small></div>').join('')+'</div>';
  const calendar='<section class="fitness-panel fitness-calendar"><div class="fitness-panel-head"><div><span>'+title('Εβδομαδιαίο πρόγραμμα','Weekly training',en)+'</span><h2>'+dateLabel(w.weekStart)+' — '+dateLabel(w.days[6].date)+'</h2></div><div class="fitness-arrows">'
    +'<button data-act="fitnessWeek" data-offset="-1" aria-label="Previous week">'+icon('chevronLeft',18)+'</button><button data-act="fitnessWeek" data-offset="0" aria-label="Current week">'+icon('calendar',18)+'</button><button data-act="fitnessWeek" data-offset="1" aria-label="Next week">'+icon('chevronRight',18)+'</button></div></div>'
    +'<div class="fitness-days">'+w.days.map((d,i)=>'<button data-act="fitnessSelectDay" data-date="'+esc(d.date)+'" class="fitness-day '+(d.date===ctx.dateKey?'is-today ':'')+(d.date===focus.date?'is-active':'')+'" aria-pressed="'+(d.date===focus.date)+'">'
      +'<span>'+(en?daysEn[i]:GREEK_DAYS_SHORT[i])+'</span><b>'+d.date.slice(8)+'</b>'+icon(d.kind==='rest'?'bed':d.kind==='game'?'award':d.kind==='stop'?'alert':'zap',19)
      +'<small>'+esc((KIND[d.kind]||KIND.mobility)[en?1:0])+'</small><i class="'+(d.done?'is-done':'')+'"></i></button>').join('')+'</div>'
    +'<p class="fitness-note">'+title('Η προπόνηση της ομάδας υπολογίζεται ήδη ως επιβάρυνση.','Team practices already count toward training load.',en)+'</p></section>';
  const readiness='<section class="fitness-panel fitness-readiness"><div class="fitness-panel-head"><div><span>'+title('Ετοιμότητα','Readiness',en)+'</span><h2>'+title('Πώς είσαι σήμερα;','How do you feel today?',en)+'</h2></div><span class="fitness-mood">'+esc(moodText)+'</span></div>'
    +(today?'<form class="fitness-form" id="fitnessReadinessForm" data-date="'+esc(ctx.dateKey)+'">'
      +'<label><span>'+title('Ώρες ύπνου','Sleep hours',en)+'</span><input name="sleepHours" type="number" min="0" max="16" step=".5" placeholder="8.5" value="'+(today.sleepHours??'')+'" required></label>'
      +'<div class="fitness-form-grid"><label><span>'+title('Ενέργεια','Energy',en)+' 1–5</span><select name="energy" required><option value="" disabled'+(today.energy==null?' selected':'')+'>'+title('Επίλεξε','Choose',en)+'</option>'+[1,2,3,4,5].map(v=>opt(v,v,today.energy)).join('')+'</select></label>'
      +'<label><span>'+title('Μυϊκή κόπωση','Soreness',en)+' 1–5</span><select name="soreness" required><option value="" disabled'+(today.soreness==null?' selected':'')+'>'+title('Επίλεξε','Choose',en)+'</option>'+[1,2,3,4,5].map(v=>opt(v,v,today.soreness)).join('')+'</select></label></div>'
      +'<label class="fitness-checkbox"><input name="pain" type="checkbox"'+checked(today.pain)+'><span>'+title('Πόνος ή τραυματισμός','Pain or injury',en)+'</span></label>'
      +'<button class="fitness-btn fitness-primary" type="submit">'+icon('check',17)+' '+title('Αποθήκευση ελέγχου','Save check-in',en)+'</button></form>'
      :'<p class="fitness-note">'+title('Άνοιξε την τρέχουσα εβδομάδα για έλεγχο.','Open this week to check in.',en)+'</p>')+'</section>';
  const session='<section class="fitness-panel fitness-session"><div class="fitness-panel-head"><div><span>'+title('Συνεδρία','Session',en)+' · '+dateLabel(focus.date)+'</span><h2>'+esc((KIND[focus.kind]||KIND.mobility)[en?1:0])+'</h2></div><span>'+focus.duration+' '+title('λεπτά','min',en)+'</span></div>'
    +'<div class="fitness-steps">'+focus.steps.map((x,i)=>'<div><b>'+String(i+1).padStart(2,'0')+'</b><p>'+esc(en?x.en:x.el)+'</p></div>').join('')+'</div>'
    +'<div class="fitness-session-actions">'+button('fitnessDone',icon(focus.done?'undo':'checkCircle',17)+' '+title(focus.done?'Αναίρεση ολοκλήρωσης':'Ολοκληρώθηκε',focus.done?'Undo completion':'Mark complete',en),'fitness-primary').replace('data-act="fitnessDone"','data-act="fitnessDone" data-date="'+esc(focus.date)+'" data-done="'+(!focus.done)+'"')+'</div></section>';
  const evidence='<div class="fitness-evidence">'+icon('shield',18)+'<p>'+title('Εκπαιδευτικό εργαλείο, όχι ιατρική διάγνωση. Αν υπάρχει πόνος, σταμάτα και ενημέρωσε γονέα/προπονητή και ειδικό υγείας.','Educational tool, not medical advice. Stop activity with pain and tell a parent, coach and qualified clinician.',en)+'</p>'
    +'<a href="https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/Resistance-Training-for-Children-and-Adolescents" target="_blank" rel="noopener noreferrer">AAP</a><a href="https://www.cdc.gov/sleep/about/index.html" target="_blank" rel="noopener noreferrer">CDC</a></div>';
  return shell+warningsHtml+metrics+'<div class="fitness-layout">'+calendar+readiness+session+'</div>'+evidence+'</div>';
}

export function fitnessTodayCard(ctx) {
  const d=ctx.fitnessWeek?.days.find(x=>x.date===ctx.dateKey);
  if(!d)return '';
  const en=ctx.lang==='en';
  return '<section class="fitness-teaser">'+icon('zap',23)+'<div><span>PERFORMANCE STUDIO</span><strong>'+esc((KIND[d.kind]||KIND.mobility)[en?1:0])+'</strong><small>'+title('Προπόνηση με βάση το πραγματικό πρόγραμμα','Training based on your real schedule',en)+'</small></div>'
    +'<button type="button" class="fitness-btn fitness-primary" data-act="nav" data-view="fitness">'+title('Άνοιγμα','Open',en)+' '+icon('arrowRight',17)+'</button></section>';
}
