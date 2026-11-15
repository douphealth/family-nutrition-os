import { useState } from 'react';
import { Check, Plus, Save, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cleanCalendarEvents, parseFitnessIcs } from '@/training/fitness-calendar';
import { fitnessLogId, shiftDate } from '@/training/fitness-engine';
import { saveTrainingLog, saveTrainingSettings } from '@/training/store';

export function ReadinessForm({ profile, date, log }: { profile: any; date: string; log: any }) {
  const [sleep, setSleep] = useState(log?.sleepHours ?? '');
  const [energy, setEnergy] = useState(log?.energy ?? '');
  const [soreness, setSoreness] = useState(log?.soreness ?? '');
  const [pain, setPain] = useState(log?.pain ?? false);
  return <form className="space-y-4" onSubmit={e => {
    e.preventDefault();
    saveTrainingLog(fitnessLogId(profile.id, date), { memberId: profile.id, date, sleepHours: Number(sleep), energy: Number(energy), soreness: Number(soreness), pain, checkedAt: new Date().toISOString() });
    toast.success('Ο σημερινός έλεγχος αποθηκεύτηκε');
  }}>
    <label className="block text-sm">Πραγματικός ύπνος (ώρες)<Input type="number" step="0.5" min="0" max="16" required value={sleep} onChange={e => setSleep(e.target.value)} className="mt-1" placeholder="π.χ. 8,5" /></label>
    <div className="grid grid-cols-2 gap-3">
      <label className="text-sm">Ενέργεια<select required className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={energy} onChange={e => setEnergy(e.target.value)}><option value="">Επίλεξε</option>{['Πολύ χαμηλή','Χαμηλή','Μέτρια','Καλή','Πολύ καλή'].map((x,i) => <option key={x} value={i+1}>{i+1} · {x}</option>)}</select></label>
      <label className="text-sm">Μυϊκό πιάσιμο<select required className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={soreness} onChange={e => setSoreness(e.target.value)}><option value="">Επίλεξε</option>{['Καθόλου','Λίγο','Μέτριο','Έντονο','Πολύ έντονο'].map((x,i) => <option key={x} value={i+1}>{i+1} · {x}</option>)}</select></label>
    </div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pain} onChange={e => setPain(e.target.checked)} /> Έχω πόνο ή αδιαθεσία</label>
    <Button type="submit" className="w-full"><Check /> Αποθήκευση ελέγχου</Button>
    <p className="text-xs leading-relaxed text-muted-foreground">Ειλικρινής καταγραφή, όχι βαθμολογία υγείας. Για έφηβο: 8–10 ώρες ύπνου. Οι απαντήσεις δεν αντικαθιστούν αξιολόγηση προπονητή ή γιατρού.</p>
  </form>;
}

const DAYS = ['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
export function CalendarEditor({ profile, start, settings, events }: { profile: any; start: string; settings: any; events: any[] }) {
  const [draft, setDraft] = useState(events.map(e => ({ ...e })));
  const [day, setDay] = useState(0);
  const [type, setType] = useState('team');
  const [from, setFrom] = useState('18:00');
  const [to, setTo] = useState('19:30');
  return <details className="border-y py-5">
    <summary className="font-semibold">Πρόγραμμα ομάδας & σχολείου · επεξεργασία</summary>
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">Εβδομάδα {start}. Κατάγραψε όλες τις υποχρεώσεις και επιβεβαίωσε ότι οι κενές ημέρες είναι πράγματι ελεύθερες. Η παλιά εβδομάδα δεν επαναλαμβάνεται αυτόματα.</p>
      {draft.map((e,i) => <div className="flex items-center justify-between gap-2 border-b py-2 text-sm" key={e.id}><span>{e.date} · {e.type === 'school' ? 'Σχολείο' : e.type === 'game' ? 'Αγώνας' : 'Ομάδα'} {e.start}–{e.end}{e.note ? ' · μη επιβεβαιωμένο' : ''}</span><Button type="button" variant="ghost" size="icon" aria-label={`Διαγραφή ${e.date} ${e.start}`} onClick={() => setDraft(x => x.filter((_,j) => i !== j))}><Trash2 /></Button></div>)}
      <form className="grid gap-3 sm:grid-cols-5" onSubmit={e => { e.preventDefault(); if (to <= from) { toast.error('Η λήξη πρέπει να είναι μετά την αρχή'); return; } setDraft(x => [...x, { id: `manual-${Date.now()}`, date: shiftDate(start, day), type, start: from, end: to, title: type === 'school' ? 'Σχολείο' : 'Μπάσκετ', venue: '', note: '' }]); }}>
        <label className="text-xs">Ημέρα<select className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={day} onChange={e => setDay(Number(e.target.value))}>{DAYS.map((x,i) => <option key={x} value={i}>{x}</option>)}</select></label>
        <label className="text-xs">Υποχρέωση<select className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={type} onChange={e => setType(e.target.value)}><option value="team">Ομάδα</option><option value="game">Αγώνας</option><option value="school">Σχολείο</option></select></label>
        <label className="text-xs">Αρχή<Input required type="time" value={from} onChange={e => setFrom(e.target.value)} className="mt-1" /></label><label className="text-xs">Τέλος<Input required type="time" value={to} onChange={e => setTo(e.target.value)} className="mt-1" /></label><Button type="submit" variant="outline" className="self-end"><Plus /> Προσθήκη</Button>
      </form>
      <div className="flex flex-wrap gap-3"><Button onClick={() => { saveTrainingSettings(profile.id, { calendarWeeks: { ...settings.calendarWeeks, [start]: cleanCalendarEvents(draft, start) }, calendarSource: 'manual', repeatWeekly: false }, profile); toast.success('Το πρόγραμμα της εβδομάδας επιβεβαιώθηκε'); }}><Save /> Επιβεβαίωση εβδομάδας</Button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm"><Upload className="size-4" /> Εισαγωγή ημερολογίου .ics<input type="file" accept=".ics,text/calendar" className="sr-only" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { const imported = parseFitnessIcs(await file.text()); saveTrainingSettings(profile.id, { calendarWeeks: { ...settings.calendarWeeks, ...imported.weeks }, calendarSource: 'ics', repeatWeekly: false }, profile); toast.success(`${imported.imported} υποχρεώσεις εισήχθησαν`); } catch { toast.error('Δεν βρέθηκαν υποστηριζόμενες υποχρεώσεις σχολείου ή μπάσκετ'); } }} /></label>
      </div>
    </div>
  </details>;
}