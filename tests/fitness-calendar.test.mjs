import assert from 'node:assert/strict';
import {
  DIMITRIS_CALENDAR_WEEK,DIMITRIS_SCREENSHOT_EVENTS,defaultDimitrisCalendar,
  cleanCalendarEvents,resolveCalendarWeek,summarizeCalendarEvents,
  eventDuration,timeMinutes,parseFitnessIcs
} from '../src/fitness-calendar.js';
import {defaultFitnessSettings,normalizeFitnessSettings,buildFitnessWeek} from '../src/fitness-engine.js';

const athlete={id:'son',name:'Δημήτρης',age:15,sex:'m',height:181,weight:65,role:'Basketball · απόδοση'};
let checks=0;
function test(label,fn){fn();checks++;console.log('  ok  '+label);}
test('exact screenshot dates and clock times are preserved',()=>{
 assert.equal(DIMITRIS_CALENDAR_WEEK,'2026-11-02');
 assert.equal(DIMITRIS_SCREENSHOT_EVENTS.length,11);
 assert.deepEqual(DIMITRIS_SCREENSHOT_EVENTS.filter(x=>x.type==='team').map(x=>[x.date,x.start,x.end]),[
  ['2026-11-02','20:30','22:15'],
  ['2026-11-03','20:30','23:55'],
  ['2026-11-05','21:00','22:15'],
  ['2026-11-06','20:15','22:15'],
  ['2026-11-07','12:00','13:30'],
  ['2026-11-08','11:00','13:30']
 ]);
});
test('real weekly basketball = 745 minutes, school = 2250 minutes',()=>{
 const totals=summarizeCalendarEvents(DIMITRIS_SCREENSHOT_EVENTS);
 assert.equal(totals.teamMinutes,745);
 assert.equal(totals.schoolMinutes,2250);
 assert.equal(totals.teamDays,6);
 assert.equal(totals.schoolDays,5);
 assert.equal(totals.lateNights,4);
});
test('shortest next-day school gap = 8 hours 5 minutes, NOT sleep duration',()=>{
 const gap=summarizeCalendarEvents(DIMITRIS_SCREENSHOT_EVENTS).shortestSchoolTurnaround;
 assert.deepEqual(gap,{from:'2026-11-03',to:'2026-11-04',minutes:485});
});
test('Tuesday MATCH DAY is location metadata, not a verified game',()=>{
 const tue=DIMITRIS_SCREENSHOT_EVENTS.find(x=>x.date==='2026-11-03'&&x.type==='team');
 assert.equal(tue.venue,'MATCH DAY');
 assert.equal(tue.note,'game-status-unconfirmed');
 assert.equal(DIMITRIS_SCREENSHOT_EVENTS.some(x=>x.type==='game'),false);
});
test('date-bound screenshot is applied to Dimitris only',()=>{
 const week=buildFitnessWeek(athlete,defaultFitnessSettings(athlete),[],'2026-11-04');
 assert.equal(week.calendarKnown,true);
 assert.equal(week.scheduledBasketballMinutes,745);
 assert.equal(week.extraMinutes,0);
 assert.equal(week.days[2].kind,'rest');
 assert.equal(week.days[1].sportMinutes,205);
 assert.equal(week.days[1].extraMinutes,0);
 assert.equal(week.warnings.includes('match-unconfirmed'),true);
 assert.equal(week.warnings.includes('late-finishes'),true);
});
test('future weeks are not fabricated or silently repeated',()=>{
 const settings=defaultFitnessSettings(athlete);
 const w=buildFitnessWeek(athlete,settings,[],'2026-11-11');
 assert.equal(w.calendarMissing,true);
 assert.equal(w.extraMinutes,0);
 assert.equal(w.scheduledBasketballMinutes,null);
 assert.ok(w.days.every(x=>x.kind==='unconfirmed'));
});
test('explicit user-enabled repeat shifts events one week',()=>{
 const settings={...defaultFitnessSettings(athlete),repeatWeekly:true,repeatFromWeek:'2026-11-02'};
 const r=resolveCalendarWeek(settings,'2026-11-09');
 assert.equal(r.known,true);assert.equal(r.repeated,true);
 assert.equal(r.events.find(x=>x.type==='team')?.date,'2026-11-09');
 assert.equal(summarizeCalendarEvents(r.events).teamMinutes,745);
});
test('edited times recalculate real workload immediately',()=>{
 const weeks=defaultDimitrisCalendar();
 const edited=weeks['2026-11-02'].map(x=>x.date==='2026-11-03'&&x.type==='team'?{...x,end:'22:00'}:x);
 const settings=normalizeFitnessSettings({...defaultFitnessSettings(athlete),calendarWeeks:{'2026-11-02':edited}},athlete);
 const plan=buildFitnessWeek(athlete,settings,[],'2026-11-04');
 assert.equal(plan.scheduledBasketballMinutes,630);
 assert.equal(plan.extraMinutes,0);
});
test('invalid, duplicate and outside-week events cannot enter the model',()=>{
 const sample=DIMITRIS_SCREENSHOT_EVENTS[0];
 const input=[sample,{...sample},{...sample,date:'2026-12-02'}, {...sample,start:'99:99'}, {...sample,start:'15:30',end:'08:00'}];
 const cleaned=cleanCalendarEvents(input,'2026-11-02');
 assert.equal(cleaned.length,1);
 assert.equal(eventDuration({start:'23:55',end:'08:00'}),0);
 assert.equal(timeMinutes('23:55'),1435);
});
test('ICS imports events locally including correct Athens UTC conversion',()=>{
 const text=[
 'BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
 'UID:test-1','DTSTART;TZID=Europe/Athens:20261102T203000',
 'DTEND;TZID=Europe/Athens:20261102T221500','SUMMARY:ΜΠΑΣΚΕΤ','END:VEVENT',
 'BEGIN:VEVENT','DTSTART:20261104T180000Z','DTEND:20261104T193000Z',
 'SUMMARY:BASKETBALL practice','END:VEVENT','END:VCALENDAR'
 ].join('\r\n');
 const imported=parseFitnessIcs(text);
 assert.equal(imported.imported,2);
 const events=Object.values(imported.weeks).flat();
 assert.ok(events.some(x=>x.date==='2026-11-04'&&x.start==='20:00'&&x.end==='21:30'));
});
test('ICS weekly recurrence expands only bounded repeated occurrences',()=>{
 const text=[
 'BEGIN:VCALENDAR','BEGIN:VEVENT','UID:repeat-demo',
 'DTSTART;TZID=Europe/Athens:20261102T200000',
 'DTEND;TZID=Europe/Athens:20261102T210000',
 'SUMMARY:Basketball','RRULE:FREQ=WEEKLY;COUNT=2;BYDAY=MO',
 'END:VEVENT','END:VCALENDAR'
 ].join('\n');
 const imported=parseFitnessIcs(text);
 assert.equal(imported.imported,2);
 assert.ok(imported.weeks['2026-11-02']);
 assert.ok(imported.weeks['2026-11-09']);
});
test('unrelated personal events and unknown timezones are rejected, not guessed',()=>{
 const invalid=[
 'BEGIN:VCALENDAR','BEGIN:VEVENT','DTSTART;TZID=America/New_York:20261102T200000',
 'DTEND;TZID=America/New_York:20261102T210000','SUMMARY:Basketball',
 'END:VEVENT','END:VCALENDAR'].join('\n');
 assert.throws(()=>parseFitnessIcs(invalid));
 assert.throws(()=>parseFitnessIcs('x'.repeat(1024*1024+1)));
});
console.log('fitness calendar: PASS ('+checks+' checks)');
