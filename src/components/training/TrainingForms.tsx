import { useI18n } from "@/lib/i18n";
import { useState } from 'react';
import { Check, Plus, Save, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cleanCalendarEvents, parseFitnessIcs } from '@/training/fitness-calendar';
import { fitnessLogId, shiftDate } from '@/training/fitness-engine';
import { saveTrainingLog, saveTrainingSettings } from '@/training/store';

export function ReadinessForm({ profile, date, log }: { profile: any; date: string; log: any }) {
  const { t, pick, language } = useI18n();
  const [sleep, setSleep] = useState(log?.sleepHours ?? '');
  const [energy, setEnergy] = useState(log?.energy ?? '');
  const [soreness, setSoreness] = useState(log?.soreness ?? '');
  const [pain, setPain] = useState(log?.pain ?? false);
  return <form className="space-y-4" onSubmit={e => {
    e.preventDefault();
    saveTrainingLog(fitnessLogId(profile.id, date), { memberId: profile.id, date, sleepHours: Number(sleep), energy: Number(energy), soreness: Number(soreness), pain, checkedAt: new Date().toISOString() });
    toast.success(t('Ο σημερινός έλεγχος αποθηκεύτηκε'));
  }}>
    <label className="block text-sm">{t("Πραγματικός ύπνος (ώρες)")}<Input type="number" step="0.5" min="0" max="16" required value={sleep} onChange={e => setSleep(e.target.value)} className="mt-1" placeholder={t("π.χ. 8,5")} /></label>
    <div className="grid grid-cols-2 gap-3">
      <label className="text-sm">{t("Ενέργεια")}<select required className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={energy} onChange={e => setEnergy(e.target.value)}><option value="">{t("Επίλεξε")}</option>{[t('Πολύ χαμηλή'),t('Χαμηλή'),t('Μέτρια'),t('Καλή'),t('Πολύ καλή')].map((x,i) => <option key={x} value={i+1}>{i+1} · {x}</option>)}</select></label>
      <label className="text-sm">{t("Μυϊκό πιάσιμο")}<select required className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={soreness} onChange={e => setSoreness(e.target.value)}><option value="">{t("Επίλεξε")}</option>{[t('Καθόλου'),t('Λίγο'),t('Μέτριο'),t('Έντονο'),t('Πολύ έντονο')].map((x,i) => <option key={x} value={i+1}>{i+1} · {x}</option>)}</select></label>
    </div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pain} onChange={e => setPain(e.target.checked)} /> {t("Έχω πόνο ή αδιαθεσία")}</label>
    <Button type="submit" className="w-full"><Check /> {t("Αποθήκευση ελέγχου")}</Button>
    <p className="text-xs leading-relaxed text-muted-foreground">{pick('Ειλικρινής καταγραφή, όχι βαθμολογία υγείας. Οι απαντήσεις δεν αντικαθιστούν επαγγελματική αξιολόγηση.','Honest reporting, not a health score. Answers do not replace professional assessment.')} {profile.age < 18 ? pick('Έφηβοι: 8–10 ώρες ύπνου.','Teens: 8–10 hours of sleep.') : pick('Ενήλικες: τουλάχιστον 7 ώρες ύπνου.','Adults: at least 7 hours of sleep.')}</p>
  </form>;
}

const DAYS = ['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
export function CalendarEditor({ profile, start, settings, events }: { profile: any; start: string; settings: any; events: any[] }) {
  const { t, pick, language } = useI18n();
  const [draft, setDraft] = useState(events.map(e => ({ ...e })));
  const [day, setDay] = useState(0);
  const [type, setType] = useState('team');
  const [from, setFrom] = useState('18:00');
  const [to, setTo] = useState('19:30');
  return <details className="border-y py-5">
    <summary className="font-semibold">{t("Πρόγραμμα ομάδας & σχολείου · επεξεργασία")}</summary>
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">{t("Εβδομάδα")}{start}{t(". Κατάγραψε όλες τις υποχρεώσεις και επιβεβαίωσε ότι οι κενές ημέρες είναι πράγματι ελεύθερες. Η παλιά εβδομάδα δεν επαναλαμβάνεται αυτόματα.")}</p>
      {draft.map((e,i) => <div className="flex items-center justify-between gap-2 border-b py-2 text-sm" key={e.id}><span>{e.date} · {e.type === 'school' ? t('Σχολείο') : e.type === 'game' ? t('Αγώνας') : t('Ομάδα')} {e.start}–{e.end}{e.note ? t(' · μη επιβεβαιωμένο') : ''}</span><Button type="button" variant="ghost" size="icon" aria-label={t(`Διαγραφή ${e.date} ${e.start}`)} onClick={() => setDraft(x => x.filter((_,j) => i !== j))}><Trash2 /></Button></div>)}
      <form className="grid gap-3 sm:grid-cols-5" onSubmit={e => { e.preventDefault(); if (to <= from) { toast.error(t('Η λήξη πρέπει να είναι μετά την αρχή')); return; } setDraft(x => [...x, { id: `manual-${Date.now()}`, date: shiftDate(start, day), type, start: from, end: to, title: type === 'school' ? t('Σχολείο') : t('Μπάσκετ'), venue: '', note: '' }]); }}>
        <label className="text-xs">{t("Ημέρα")}<select className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={day} onChange={e => setDay(Number(e.target.value))}>{DAYS.map((x,i) => <option key={x} value={i}>{x}</option>)}</select></label>
        <label className="text-xs">{t("Υποχρέωση")}<select className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={type} onChange={e => setType(e.target.value)}><option value="team">{t("Ομάδα")}</option><option value="game">{t("Αγώνας")}</option><option value="school">{t("Σχολείο")}</option></select></label>
        <label className="text-xs">{t("Αρχή")}<Input required type="time" value={from} onChange={e => setFrom(e.target.value)} className="mt-1" /></label><label className="text-xs">{t("Τέλος")}<Input required type="time" value={to} onChange={e => setTo(e.target.value)} className="mt-1" /></label><Button type="submit" variant="outline" className="self-end"><Plus /> {t("Προσθήκη")}</Button>
      </form>
      <div className="flex flex-wrap gap-3"><Button onClick={() => { saveTrainingSettings(profile.id, { calendarWeeks: { ...settings.calendarWeeks, [start]: cleanCalendarEvents(draft, start) }, calendarSource: 'manual', repeatWeekly: false }, profile); toast.success(t('Το πρόγραμμα της εβδομάδας επιβεβαιώθηκε')); }}><Save /> {t("Επιβεβαίωση εβδομάδας")}</Button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm"><Upload className="size-4" /> {t("Εισαγωγή ημερολογίου .ics")}<input type="file" accept=".ics,text/calendar" className="sr-only" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { const imported = parseFitnessIcs(await file.text()); saveTrainingSettings(profile.id, { calendarWeeks: { ...settings.calendarWeeks, ...imported.weeks }, calendarSource: 'ics', repeatWeekly: false }, profile); toast.success(t(`${imported.imported} υποχρεώσεις εισήχθησαν`)); } catch { toast.error(t('Δεν βρέθηκαν υποστηριζόμενες υποχρεώσεις σχολείου ή μπάσκετ')); } }} /></label>
      </div>
    </div>
  </details>;
}