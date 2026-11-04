/**
 * ZENITH PRO · date-specific, local-only family activity calendar.
 * The seven-day Dimitris timetable is transcribed from the family-provided
 * calendar screenshot for 2–8 November 2026. It is NOT a recurring fixture.
 * No Google account, location tracking or external request is involved.
 */
export const DIMITRIS_CALENDAR_WEEK = '2026-11-02';
export const CALENDAR_EVENT_TYPES = ['school', 'team', 'game'];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const safe = v => String(v ?? '').trim().slice(0, 90);
const basketballVenue = 'ΣΤ. ΚΑΛΑΪΤΖΗΣ';
const weekOf = date => {
  const d = new Date(date + 'T12:00:00Z');
  if (!datePattern.test(date) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== date) return null;
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
};
const addDays = (date, increment) => {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + increment);
  return d.toISOString().slice(0, 10);
};
export const timeMinutes = value => timePattern.test(String(value)) ? (Number(value.slice(0,2))*60+Number(value.slice(3))) : null;
export function eventDuration(event) {
  const a=timeMinutes(event?.start),b=timeMinutes(event?.end);
  return a===null||b===null||b<=a?0:b-a;
}
const make = (date,type,start,end,venue='',note='') => ({
  id:type+'-'+date+'-'+start.replace(':',''),date,type,start,end,
  title:type==='school'?'ΣΧΟΛΕΙΟ':'ΜΠΑΣΚΕΤ',venue,note
});
export const DIMITRIS_SCREENSHOT_EVENTS = Object.freeze([
  make('2026-11-02','school','08:00','15:30','ΠΑΛΛΗΝΗ'),
  make('2026-11-02','team','20:30','22:15',basketballVenue),
  make('2026-11-03','school','08:00','15:30','ΠΑΛΛΗΝΗ'),
  // The calendar's LOCATION field says MATCH DAY. This does not prove a game.
  make('2026-11-03','team','20:30','23:55','MATCH DAY','game-status-unconfirmed'),
  make('2026-11-04','school','08:00','15:30','ΠΑΛΛΗΝΗ'),
  make('2026-11-05','school','08:00','15:30','ΠΑΛΛΗΝΗ'),
  make('2026-11-05','team','21:00','22:15',basketballVenue),
  make('2026-11-06','school','08:00','15:30','ΠΑΛΛΗΝΗ'),
  make('2026-11-06','team','20:15','22:15',basketballVenue),
  make('2026-11-07','team','12:00','13:30','BASKETAKI ARENA'),
  make('2026-11-08','team','11:00','13:30',basketballVenue)
]);

export function cleanCalendarEvents(events, start) {
  if (!Array.isArray(events) || !weekOf(start) || weekOf(start)!==start) return [];
  const seen=new Set(),out=[];
  for(const raw of events.slice(0,120)){
    const date=String(raw?.date||''),type=raw?.type;
    const startTime=String(raw?.start||''),endTime=String(raw?.end||'');
    if(!CALENDAR_EVENT_TYPES.includes(type)||weekOf(date)!==start) continue;
    if(!timePattern.test(startTime)||!timePattern.test(endTime)||timeMinutes(endTime)<=timeMinutes(startTime)) continue;
    if(timeMinutes(endTime)-timeMinutes(startTime)>12*60) continue;
    const id=safe(raw?.id)||type+'-'+date+'-'+startTime.replace(':','');
    const dedupe=[date,type,startTime,endTime].join('|');
    if(seen.has(dedupe))continue;
    seen.add(dedupe);
    out.push({
      id,date,type,start:startTime,end:endTime,
      title:safe(raw?.title)|| (type==='school'?'ΣΧΟΛΕΙΟ':'ΜΠΑΣΚΕΤ'),
      venue:safe(raw?.venue),note:safe(raw?.note)
    });
  }
  return out.sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start)||a.type.localeCompare(b.type));
}

export function cleanCalendarWeeks(weeks) {
  if(!weeks||typeof weeks!=='object'||Array.isArray(weeks))return {};
  const result={};
  for(const key of Object.keys(weeks).sort().slice(-32)){
    if(weekOf(key)!==key)continue;
    result[key]=cleanCalendarEvents(weeks[key],key);
  }
  return result;
}
export function defaultDimitrisCalendar() {
  return {[DIMITRIS_CALENDAR_WEEK]: cleanCalendarEvents(DIMITRIS_SCREENSHOT_EVENTS,DIMITRIS_CALENDAR_WEEK)};
}

/**
 * A dated week is authoritative only for itself. Repetition must be explicitly
 * enabled by the family; otherwise future weeks remain unverified (and extra
 * workouts are NOT invented).
 */
export function resolveCalendarWeek(settings, start) {
  const weeks=cleanCalendarWeeks(settings?.calendarWeeks);
  if(Object.hasOwn(weeks,start)) return {events:weeks[start],known:true,source:start===DIMITRIS_CALENDAR_WEEK && settings?.calendarSource!=='ics'?'screenshot':'saved',repeated:false};
  if(settings?.repeatWeekly===true){
    const base=weekOf(String(settings?.repeatFromWeek||''))===settings.repeatFromWeek?
      settings.repeatFromWeek:Object.keys(weeks).sort().at(-1);
    if(base && weeks[base]){
      const events=weeks[base].map(x=>{
        const offset=Math.round((Date.parse(x.date+'T12:00:00Z')-Date.parse(base+'T12:00:00Z'))/86400000);
        const date=addDays(start,offset);
        return {...x,id:x.type+'-'+date+'-'+x.start.replace(':',''),date,note:x.note==='game-status-unconfirmed'?x.note:'repeated-unverified'};
      });
      return {events,known:true,source:'manual-repeat',repeated:true};
    }
  }
  return {events:[],known:false,source:'unconfirmed',repeated:false};
}
export function summarizeCalendarEvents(events) {
  let teamMinutes=0,schoolMinutes=0,lateNights=0;
  const sportDates=new Set(),schoolDates=new Set();
  for(const ev of events){
    const min=eventDuration(ev);
    if(ev.type==='school'){schoolMinutes+=min;schoolDates.add(ev.date);}
    else if(ev.type==='team'||ev.type==='game'){
      teamMinutes+=min;sportDates.add(ev.date);
      if(timeMinutes(ev.end)>=22*60)lateNights++;
    }
  }
  const school=events.filter(e=>e.type==='school');
  const practices=events.filter(e=>e.type==='team'||e.type==='game');
  const turnarounds=[];
  for(const event of practices){
    const d=new Date(event.date+'T12:00:00Z');
    d.setUTCDate(d.getUTCDate()+1);
    const nextDate=d.toISOString().slice(0,10);
    for(const next of school.filter(x=>x.date===nextDate)){
      const gap=1440-timeMinutes(event.end)+timeMinutes(next.start);
      turnarounds.push({from:event.date,to:next.date,minutes:gap});
    }
  }
  turnarounds.sort((a,b)=>a.minutes-b.minutes);
  return {teamMinutes,schoolMinutes,teamDays:sportDates.size,schoolDays:schoolDates.size,
    lateNights,shortestSchoolTurnaround:turnarounds[0]||null};
}
export const clockLabel = mins => Math.floor(mins/60)+'h '+String(mins%60).padStart(2,'0')+'m';

function localDateTime(raw,parameters='') {
  if(/VALUE=DATE/i.test(parameters)||! /^\d{8}T\d{6}Z?$/.test(raw))return null;
  let date=raw.slice(0,4)+'-'+raw.slice(4,6)+'-'+raw.slice(6,8),time=raw.slice(9,11)+':'+raw.slice(11,13);
  if(raw.endsWith('Z')){
    const instant=new Date(Date.UTC(Number(raw.slice(0,4)),Number(raw.slice(4,6))-1,Number(raw.slice(6,8)),Number(raw.slice(9,11)),Number(raw.slice(11,13)),Number(raw.slice(13,15))));
    if(!Number.isFinite(instant.getTime()))return null;
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Athens',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(instant);
    const d=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    date=d.year+'-'+d.month+'-'+d.day;time=d.hour+':'+d.minute;
  }else if(/TZID=/i.test(parameters)&&!/TZID="?Europe\/Athens"?/i.test(parameters)){
    // Do not silently interpret an unknown local timezone as Greek clock time.
    return null;
  }
  if(!weekOf(date)||timeMinutes(time)===null)return null;
  return {date,time};
}
function parseProperty(line){
  const idx=line.indexOf(':');if(idx<0)return null;
  const field=line.slice(0,idx),name=field.split(';')[0].toUpperCase();
  return {name,params:field.slice(name.length),value:line.slice(idx+1)};
}
function classifyEvent(summary){
  const txt=summary.toLocaleLowerCase('el');
  if(/σχολε|school|classes|μαθηματα/.test(txt))return 'school';
  if(/μπασκετ|basket|basketball|καλαθοσφαιρ/.test(txt)){
    return /αγων|match|game|ματς/.test(txt)?'game':'team';
  }
  return null;
}
/**
 * Parse an exported .ics calendar entirely in-browser.
 * Supports single timed VEVENTs and conservative WEEKLY RRULE occurrences,
 * limited to 26 weeks from the supplied start. Ambiguous/all-day events,
 * unrelated personal events and unsupported TZIDs are ignored, never stored.
 * This is an IMPORT, not unattended calendar synchronization.
 */
export function parseFitnessIcs(text) {
  if(typeof text!=='string'||text.length>1024*1024)throw new Error('Calendar file too large (limit 1 MiB)');
  const lines=text.replace(/\r\n/g,'\n').replace(/\n[ \t]/g,'').split('\n');
  const result={weeks:{},imported:0,skipped:0,recurring:0};
  let item=null;
  const add=(ev)=>{
    const start=weekOf(ev.date);
    if(!start||result.imported>=500)return;
    result.weeks[start]||=[];
    result.weeks[start].push(ev);
    result.imported++;
  };
  for(const line of lines){
    if(line==='BEGIN:VEVENT'){item=[];continue;}
    if(line==='END:VEVENT'){
      if(!item)continue;
      const props=item.map(parseProperty).filter(Boolean),pick=n=>props.find(x=>x.name===n);
      const summary=pick('SUMMARY')?.value||'',kind=classifyEvent(summary);
      const from=pick('DTSTART'),to=pick('DTEND');
      const st=from?localDateTime(from.value,from.params):null,en=to?localDateTime(to.value,to.params):null;
      if(!kind||!st||!en||st.date!==en.date||timeMinutes(en.time)<=timeMinutes(st.time)||timeMinutes(en.time)-timeMinutes(st.time)>12*60){
        result.skipped++;item=null;continue;
      }
      const base={id:'ics-'+safe(pick('UID')?.value||kind),date:st.date,type:kind,start:st.time,end:en.time,title:safe(summary),venue:safe(pick('LOCATION')?.value||'')};
      const rule=pick('RRULE')?.value;
      if(rule){
        const fields=Object.fromEntries(rule.split(';').map(x=>x.split('=')));
        if(fields.FREQ!=='WEEKLY'){result.skipped++;item=null;continue;}
        const byDays=(fields.BYDAY||days[(new Date(st.date+'T12:00:00Z').getUTCDay()+6)%7]).split(',').filter(x=>days.includes(x));
        const count=Math.min(182,Math.max(1,Number(fields.COUNT)||182));
        const interval=Math.min(8,Math.max(1,Number(fields.INTERVAL)||1));
        const until=fields.UNTIL?localDateTime(fields.UNTIL.replace(/^(\d{8})$/,'$1T235959Z'),fields.UNTIL.endsWith('Z')?'':''):null;
        const exceptions=new Set(props.filter(x=>x.name==='EXDATE').flatMap(x=>x.value.split(',')).map(x=>localDateTime(x,from.params)?.date).filter(Boolean));
        let generated=0;
        for(let offset=0;offset<182&&generated<count;offset++){
          const date=addDays(st.date,offset),day=days[(new Date(date+'T12:00:00Z').getUTCDay()+6)%7];
          if(until&&date>until.date)break;
          if(Math.floor(offset/7)%interval!==0||!byDays.includes(day)||exceptions.has(date))continue;
          add({...base,id:base.id+'-'+date,date});generated++;
        }
        result.recurring++;
      }else add(base);
      item=null;continue;
    }
    if(item) item.push(line);
  }
  if(result.imported===0)throw new Error('No supported school or basketball events found');
  result.weeks=cleanCalendarWeeks(result.weeks);
  result.imported=Object.values(result.weeks).reduce((a,x)=>a+x.length,0);
  return result;
}
