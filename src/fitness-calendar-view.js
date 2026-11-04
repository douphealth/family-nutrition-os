/**
 * Exact, date-specific calendar presentation; user supplied source evidence.
 */
import {esc,icon} from './ui.js?v=16.0.0';
import {clockLabel} from './fitness-calendar.js';
import {shiftDate} from './fitness-engine.js';
const daysEl=['Δευ','Τρί','Τετ','Πέμ','Παρ','Σάβ','Κυρ'];
const daysEn=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const tr=(en,el,english)=>en?english:el;
const iconNames={school:'book',team:'zap',game:'award'};
const types={school:['Σχολείο','School'],team:['Μπάσκετ','Basketball'],game:['Αγώνας','Game']};
const durationLabel=(min,en)=>en?clockLabel(min):Math.floor(min/60)+'ώ '+String(min%60).padStart(2,'0')+'λ';
const shortDate=date=>date.slice(8,10)+'/'+date.slice(5,7);

export function fitnessCalendarPanel(ctx) {
  const w=ctx.fitnessWeek,en=ctx.lang==='en';
  if(ctx.profile.id!=='son'||w.settings.sport!=='basketball')return '';
  const st=w.calendarStats;
  const supp=ctx.supplementaryProgram;
  const extraPlanned=supp?.available?supp.plannedMinutes:w.extraMinutes;
  const status=w.calendarKnown
    ? tr(en,'Επιβεβαιωμένες ώρες · '+(w.calendar.repeated?'επανάληψη με επιλογή':'συγκεκριμένη εβδομάδα'),
      'Recorded times · '+(w.calendar.repeated?'manually repeated':'dated week'))
    : tr(en,'Η εβδομάδα δεν έχει επιβεβαιωθεί','This week is not verified');
  const sourceNote=w.calendar.source==='screenshot'
    ? tr(en,'Πηγή: οικογενειακό στιγμιότυπο 02–08/11/2026.','Source: family screenshot dated 2–8 Nov 2026.')
    : w.calendar.source==='manual-repeat'
      ? tr(en,'Επανάληψη από παλαιότερη εβδομάδα — χρειάζεται επιβεβαίωση.','Repeated from a previous week; reconfirm times.')
      : w.calendarKnown
        ? tr(en,'Πηγή: χειροκίνητες αλλαγές ή εισαγωγή ημερολογίου.','Source: manual edits or imported calendar.')
        : tr(en,'Δεν υπάρχουν καταχωρισμένες ώρες για αυτή την εβδομάδα.','No events have been entered for this week.');
  return `<section class="fit-cal" aria-labelledby="fit-cal-title">
    <div class="fit-cal-head">
      <div><span class="fit-cal-eyebrow">`+icon('calendar',15)+` REAL-WORLD SCHEDULE · EUROPE/ATHENS</span>
      <h2 id="fit-cal-title">`+tr(en,'Το πραγματικό πρόγραμμα του Δημήτρη','Dimitris’ actual timetable')+`</h2>
      <p>`+esc(status)+' · '+shortDate(w.weekStart)+'–'+shortDate(w.days[6].date)+`</p></div>
      <button type="button" class="fitness-btn fitness-primary" data-act="fitnessCalendarEdit">`+icon('sliders',17)+' '+tr(en,'Διαχείριση ωρών','Edit timetable')+`</button>
    </div>
    <div class="fit-cal-stat-grid">
      <div class="fit-cal-metric"><span>`+tr(en,'Μπάσκετ ομάδας','Team basketball')+`</span><b>`+(w.calendarKnown?durationLabel(st.teamMinutes,en):'—')+`</b>
        <small>`+tr(en,'Ακριβές άθροισμα των καταχωρισμένων ωρών','Sum of entered basketball time')+`</small></div>
      <div class="fit-cal-metric"><span>`+tr(en,'Ημέρες μπάσκετ','Basketball days')+`</span><b>`+(w.calendarKnown?st.teamDays:'—')+`<small>`+(w.calendarKnown?'/7':'')+`</small></b>
        <small>`+tr(en,'Οι αγώνες μετρούν στον φόρτο','Games count toward workload')+`</small></div>
      <div class="fit-cal-metric"><span>`+tr(en,'Σχολείο','School')+`</span><b>`+(w.calendarKnown&&st.schoolDays>0?durationLabel(st.schoolMinutes,en):'—')+`</b>
        <small>`+tr(en,'Σταθερές υποχρεώσεις','Fixed commitments')+`</small></div>
      <div class="fit-cal-metric is-extra"><span>`+tr(en,'ΕΠΙΠΛΕΟΝ ΠΡΟΠΟΝΗΣΗ','ADDITIONAL WORKOUTS')+`</span>
        <b>`+(w.calendarKnown?extraPlanned+'′':'—')+`</b><small>`+tr(en,'Προτεινόμενα · μετά από check-in και επίβλεψη','Proposed; subject to readiness and coaching')+`</small></div>
    </div>
    `+(st.shortestSchoolTurnaround && st.shortestSchoolTurnaround.minutes<600 ?
      `<div class="fit-cal-turnaround">`+icon('clock',18)+`<span><strong>`+
      durationLabel(st.shortestSchoolTurnaround.minutes,en)+`</strong> `+tr(en,
      'μεταξύ λήξης μπάσκετ '+shortDate(st.shortestSchoolTurnaround.from)+' και έναρξης σχολείου '+shortDate(st.shortestSchoolTurnaround.to)+'. Αυτό δεν είναι διάρκεια ύπνου: αφαιρούνται μετακίνηση, φαγητό και προετοιμασία.',
      'between basketball ending '+shortDate(st.shortestSchoolTurnaround.from)+' and school beginning '+shortDate(st.shortestSchoolTurnaround.to)+'. This is not sleep time: travel, meals and wind-down reduce it.')+`</span></div>` : '')+`
        `+(w.calendarMissing?`<div class="fit-cal-warning">`+icon('alert',19)+`<span>`+
      tr(en,'Χωρίς επιβεβαιωμένη εβδομάδα. Δεν δημιουργούνται αυθαίρετες προπονήσεις. Ενημέρωσε τις ώρες ή εισήγαγε ημερολόγιο.',
       'Week not confirmed. No workouts are invented. Enter times or import a calendar.')+`</span></div>`:'')+`
    `+(w.calendarKnown&&w.highYouthLoad?`<div class="fit-cal-warning">`+icon('shield',19)+`<span>`+
      tr(en,'Με αυτό το φορτίο ομάδας, επιπλέον ενδυνάμωση και σπριντ: 0 λεπτά. Ύπνος και αποκατάσταση έχουν προτεραιότητα.',
       'With this team workload, extra strength and sprints: zero minutes. Sleep and recovery take priority.')+`</span></div>`:'')+`
    <div class="fit-cal-days" role="list" tabindex="0" aria-label="Dimitris weekly school and basketball calendar">
      `+w.days.map((d,i)=>`<div class="fit-cal-day `+(d.date===ctx.dateKey?'is-current':'')+`" role="listitem">
        <div class="fit-cal-dayhead"><span>`+(en?daysEn[i]:daysEl[i])+`</span><b>`+d.date.slice(8)+`</b></div>
        <div class="fit-cal-dayevents">`+(d.events.length?d.events.map(e=>`<div class="fit-cal-event is-`+e.type+`">
          <span class="fit-cal-event-icon">`+icon(iconNames[e.type]||'calendar',16)+`</span><div>
          <b>`+types[e.type][en?1:0]+`</b><strong>`+esc(e.start)+'–'+esc(e.end)+`</strong>
          `+(e.venue?`<small>`+esc(e.venue)+`</small>`:'')+`
          `+(e.note==='game-status-unconfirmed'?`<em>`+tr(en,'MATCH DAY: ένδειξη τοποθεσίας, όχι επιβεβαίωση αγώνα','MATCH DAY: location label; game not confirmed')+`</em>`:'')+`
          </div></div>`).join(''):`<div class="fit-cal-rest">`+icon('bed',18)+`<span>`+
          (w.calendarKnown?tr(en,'Ανάπαυση','Rest'):tr(en,'Άγνωστο','Unconfirmed'))+`</span></div>`)+`</div>
        <div class="fit-cal-extra">`+tr(en,'Έξτρα','Extra')+` <b>`+(supp?.sessions.filter(x=>x.date===d.date).reduce((sum,x)=>sum+x.minutes,0)??d.extraMinutes)+`′</b></div>
      </div>`).join('')+`
    </div>
    <p class="fit-cal-note">`+icon('info',15)+' '+esc(sourceNote)+' '+tr(en,
      'Χωρίς υπολογισμό μετακινήσεων. Μελλοντικές εβδομάδες δεν επαναλαμβάνονται χωρίς επιλογή. Το .ics εισάγεται χειροκίνητα, όχι με ζωντανό συγχρονισμό.',
      'Travel not included. Future weeks do not repeat automatically. ICS import is manual, not live synchronization.')+`</p>
  </section>`;
}

export function fitnessCalendarEventRow(event,index,weekStart,lang='el') {
  const en=lang==='en',last=shiftDate(weekStart,6);
  const x=event||{date:weekStart,type:'team',start:'18:00',end:'19:00',venue:''};
  const options=Object.entries(types).map(([key,names])=>`<option value="`+key+`" `+(x.type===key?'selected':'')+`>`+names[en?1:0]+`</option>`).join('');
  return `<div class="fit-cal-edit-row" data-event-id="${esc(x.id||'')}">
    <label>`+tr(en,'Ημέρα','Date')+`<input type="date" name="calDate" min="`+weekStart+`" max="`+last+`" value="`+esc(x.date)+`" required></label>
    <label>`+tr(en,'Τύπος','Type')+`<select name="calType">`+options+`</select></label>
    <label>`+tr(en,'Αρχή','Start')+`<input type="time" name="calStart" value="`+esc(x.start)+`" required></label>
    <label>`+tr(en,'Τέλος','End')+`<input type="time" name="calEnd" value="`+esc(x.end)+`" required></label>
    <label class="fit-cal-venue">`+tr(en,'Χώρος','Venue')+`<input name="calVenue" maxlength="90" value="`+esc(x.venue||'')+`"></label>
    <button type="button" class="fit-cal-remove" data-act="fitnessCalendarRemove" aria-label="`+tr(en,'Αφαίρεση','Remove')+`">`+icon('trash',16)+`</button>
  </div>`;
}

export function fitnessCalendarForm(ctx) {
  const w=ctx.fitnessWeek,en=ctx.lang==='en';
  return `<form id="fitnessCalendarForm" class="fit-cal-editor" data-member="`+esc(ctx.profile.id)+`" data-week="`+w.weekStart+`">
    <p class="fitness-note">`+tr(en,'Διόρθωσε τις πραγματικές ώρες. Οι αλλαγές αποθηκεύονται μόνο σε αυτή τη συσκευή.',
      'Edit actual event times. Changes are saved only on this device.')+`</p>
    <div id="fitnessCalendarRows">`+w.calendar.events.map((e,i)=>fitnessCalendarEventRow(e,i,w.weekStart,ctx.lang)).join('')+`</div>
    <button type="button" class="fitness-btn" data-act="fitnessCalendarAdd">`+icon('plus',16)+' '+tr(en,'Προσθήκη ώρας','Add event')+`</button>
    <label class="fit-cal-check"><input name="repeatWeekly" type="checkbox" `+(w.settings.repeatWeekly?'checked':'')+`>
    <span>`+tr(en,'Ρητή επανάληψη της εβδομάδας στο μέλλον (επιβεβαίωσε τις αλλαγές αγώνων κάθε εβδομάδα)',
      'Explicitly repeat this week in the future (recheck changing game times weekly)')+`</span></label>
    <button type="submit" class="fitness-btn fitness-primary">`+icon('check',17)+' '+tr(en,'Αποθήκευση εβδομάδας','Save week')+`</button></form>
    <div class="fit-cal-import"><div><strong>`+icon('calendar',17)+' '+tr(en,'Εισαγωγή .ics','Import .ics calendar')+`</strong>
    <p>`+tr(en,'Google, Apple ή Outlook · επιλέγεις αρχείο, βλέπεις πλήθος εγγραφών και επιβεβαιώνεις. Χωρίς αυτόματο συγχρονισμό.',
      'Google, Apple or Outlook · choose file, review event count and confirm. No automatic sync.')+`</p></div>
    <label class="fitness-btn fit-cal-file">`+icon('upload',17)+' '+tr(en,'Επιλογή .ics','Choose .ics')+`
      <input type="file" id="fitnessCalendarIcs" accept=".ics,text/calendar" hidden></label>
    <div id="fitnessImportFeedback" role="status" aria-live="polite"></div>
    <button type="button" id="fitnessCalendarConfirmImport" class="fitness-btn fitness-primary" hidden>`+icon('check',17)+' '+tr(en,'Επιβεβαίωση εισαγωγής','Confirm import')+`</button>
    </div>`;
}
