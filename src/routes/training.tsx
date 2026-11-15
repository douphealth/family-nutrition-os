import { useI18n } from "@/lib/i18n";
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Dumbbell, ExternalLink, Moon, ShieldCheck, Timer, Undo2 } from 'lucide-react';
import court from '@/assets/basketball-court.jpg';
import { MemberSwitcher } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarEditor, ReadinessForm } from '@/components/training/TrainingForms';
import { ExerciseGuide, SessionCoach } from '@/components/training/SessionCoach';
import { todayKey, useStore } from '@/lib/store';
import { pageHead } from '@/lib/head';
import { cn } from '@/lib/utils';
import { buildFitnessWeek, defaultFitnessSettings, fitnessLogId, shiftDate, weekStartOf } from '@/training/fitness-engine';
import { buildSupplementaryProgram } from '@/training/performance-program';
import { EMPTY_TRAINING, saveTrainingLog, saveTrainingSettings } from '@/training/store';
import { REASONS, SESSION_STATE, SESSION_TITLE, TRAINING_EVIDENCE } from '@/training/evidence';
import { MemberTraining } from '@/components/training/MemberTraining';

export const Route = createFileRoute('/training')({
  head: () => pageHead('Προπόνηση οικογένειας · Family training', 'Age-aware training for every family member with guided exercises, readiness checks and evidence links.'),
  component: Training,
});
const DAYS = ['Δευ','Τρί','Τετ','Πέμ','Παρ','Σάβ','Κυρ'];

function Training() {
  const { pick } = useI18n();
  const profiles = useStore(s => s.profiles);
  const activeId = useStore(s => s.activeId);
  const active = profiles.find(p => p.id === activeId) ?? profiles[0];
  if (!active) return null;
  return <div className="space-y-6"><div><p className="text-xs font-medium uppercase text-training">Zenith · Movement studio</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{pick('Η δική σου προπόνηση','Your training')}</h1></div><MemberSwitcher /><div key={active.id}>{active.id === 'son' && active.athlete ? <BasketballTraining /> : <MemberTraining profile={active} />}</div></div>;
}

function BasketballTraining() {
  const { t, pick, language } = useI18n();
  const profiles = useStore(s => s.profiles);
  const activeId = useStore(s => s.activeId);
  const profile = profiles.find(p => p.id === 'son');
  const stored = useStore(s => s.trainingSettings?.['son'] ?? EMPTY_TRAINING);
  const logMap = useStore(s => s.trainingLogs ?? EMPTY_TRAINING);
  const logs = useMemo(() => Object.values(logMap), [logMap]);
  const today = todayKey();
  const [start, setStart] = useState(() => weekStartOf(today));
  const [selected, setSelected] = useState(0);
  const [coach, setCoach] = useState(false);
  const settings = useMemo(() => ({ ...defaultFitnessSettings(profile), ...stored }), [profile, stored]);
  const week = useMemo(() => buildFitnessWeek(profile, settings, logs, start), [profile, settings, logs, start]);
  const program = useMemo(() => buildSupplementaryProgram(profile, week, logs), [profile, week, logs]);
  if (!profile) return <p>{t("Το πρόγραμμα χρειάζεται το προφίλ του αθλητή της οικογένειας.")}</p>;
  const session = program.sessions[selected];
  const canExecute = Boolean(session && session.date === today && ['ready','recovery-only'].includes(session.state));
  const changeWeek = (date: string) => { setStart(date); setSelected(0); setCoach(false); };
  const completed = (done: boolean) => { if (!session) return; saveTrainingLog(session.id, { id: session.id, memberId: profile.id, date: session.date, done, completedAt: done ? new Date().toISOString() : null }); };
  return <div className="training-page space-y-6">
    <header className="relative min-h-60 overflow-hidden border-b animate-rise">
      <img src={court} alt={t("Φωτεινό γήπεδο μπάσκετ με μπάλα και πετσέτα")} width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-background/25" />
      <div className="relative max-w-md py-8 pr-5 sm:py-10"><p className="mb-3 text-sm font-semibold uppercase text-training">Zenith · Athlete studio</p><h1 className="text-3xl font-bold leading-tight sm:text-4xl">{t("Μπάσκετ.")}<br />{t("Πιο δυνατά,")}<br />{t("με σωστό ρυθμό.")}</h1><p className="mt-4 max-w-64 text-sm font-medium">{profile.name} {t("· Ατομικό πρόγραμμα")}<br />{t("Συμπληρώνει την ομάδα. Δεν την ανταγωνίζεται.")}</p></div>
    </header>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">{t("Η εβδομάδα σου")}</h2><p className="mt-1 text-sm text-muted-foreground">{start} — {shiftDate(start,6)} · {week.calendarKnown ? t('Καταγεγραμμένες υποχρεώσεις') : t('Χρειάζεται επιβεβαίωση ομάδας')}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="icon" aria-label={t("Προηγούμενη εβδομάδα")} onClick={() => changeWeek(shiftDate(start,-7))}><ArrowLeft /></Button><Button variant="outline" onClick={() => changeWeek(weekStartOf(today))}>{t("Σήμερα")}</Button><Button variant="outline" size="icon" aria-label={t("Επόμενη εβδομάδα")} onClick={() => changeWeek(shiftDate(start,7))}><ArrowRight /></Button></div></div>
    <div className="grid grid-cols-2 gap-4 border-y py-5 sm:grid-cols-4">
      {[[t('Ομάδα'), week.calendarKnown ? `${week.calendarStats.teamMinutes}′` : '—'],[t('Ατομικά παράθυρα'),`${program.plannedMinutes}′`],[t('Συνθήκες ελέγχθηκαν'),`${program.clearedMinutes}′`],[t('Ολοκληρωμένα'),`${program.completedMinutes}′`]].map(([label,value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-semibold tabular">{value}</p></div>)}
    </div>
    {week.calendarStats.tentativeMinutes > 0 && <p className="text-sm text-muted-foreground">+ {week.calendarStats.tentativeMinutes}{t("′ μη επιβεβαιωμένων υποχρεώσεων ομάδας. Δεν μετρούν ως επιβεβαιωμένος φόρτος.")}</p>}
    {!week.calendarKnown && <section className="border-l-4 border-training bg-training-surface p-5"><h3 className="font-semibold">{t("Πρώτα το πραγματικό πρόγραμμα της ομάδας")}</h3><p className="mt-2 text-sm">{t("Δεν μεταφέραμε την παλιά εβδομάδα στο σήμερα. Επιβεβαίωσε τις τωρινές υποχρεώσεις παρακάτω για να προσαρμοστούν οι ατομικές συνεδρίες.")}</p><Button variant="outline" className="mt-3" onClick={() => changeWeek('2026-11-02')}>{t("Αρχικό πρόγραμμα · 2–8 Νοεμβρίου")}<ChevronRight /></Button></section>}
    {start < weekStartOf(today) && <p className="border-l-4 border-warning bg-accent p-4 text-sm">{t("Ιστορική εβδομάδα · προεπισκόπηση, όχι σημερινή άδεια προπόνησης. Δεν καταγράφουμε αναδρομικά ετοιμότητα.")}</p>}
    {week.highYouthLoad && <p className="flex items-start gap-3 bg-training-surface p-4 text-sm"><ShieldCheck className="size-5 shrink-0 text-training" />{t("Υψηλός φόρτος ομάδας: κανένα έξτρα σπριντ, άλματα ή εξαντλητική αντοχή. Οι πλήρεις συνεδρίες χρειάζονται έλεγχο από τον προπονητή της ομάδας.")}</p>}
    {week.calendarKnown && <div className="grid grid-cols-7 gap-1 border-b pb-5 sm:gap-2">{week.days.map((day: any,i: number) => <div key={day.date} className={cn('min-w-0 rounded-lg px-1 py-3 text-center', day.date === today ? 'bg-training text-training-foreground' : 'bg-muted/50')}><p className="text-xs font-medium">{DAYS[i]}</p><p className="mt-1 text-lg font-semibold">{Number(day.date.slice(-2))}</p><p className="mt-1 text-[10px] sm:text-xs">{day.mode === 'team' ? t('Ομάδα') : day.mode === 'game' ? t('Αγώνας') : t('Ανάπαυση')}</p>{program.sessions.some((s: any) => s.dayIndex === i) && <Dumbbell className="mx-auto mt-2 size-4" />}</div>)}</div>}
    <CalendarEditor key={`${start}-${JSON.stringify(week.calendar.events)}`} profile={profile} start={start} settings={settings} events={week.calendar.events} />
    {program.available && <>
      <div className="grid gap-3 md:grid-cols-3">{program.sessions.map((s: any,i: number) => <Button key={s.id} variant="outline" onClick={() => setSelected(i)} aria-pressed={selected === i} className={cn('flex items-start justify-start gap-3 rounded-lg p-4 text-left', selected === i && 'border-training bg-training-surface')}><span className="font-mono text-2xl text-training">0{i+1}</span><span className="min-w-0"><span className="block text-xs text-muted-foreground">{DAYS[s.dayIndex]} · {s.start}–{s.end}</span><span className="mt-1 block font-semibold">{t(SESSION_TITLE[s.type])}</span><span className={cn('mt-2 block text-xs', s.state === 'blocked' ? 'text-destructive' : 'text-training')}>{s.done ? t('Ολοκληρωμένη') : SESSION_STATE[s.state]}</span></span></Button>)}</div>
      {session && <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-training">{session.date} · {session.minutes}{t("′ παράθυρο ·")}{session.intensity}</p><h2 className="mt-2 text-2xl font-semibold">{t(SESSION_TITLE[session.type])}</h2></div><Button onClick={() => setCoach(true)}><PlayIcon /> {canExecute ? t('Έναρξη συνεδρίας') : t('Προεπισκόπηση')}</Button></div>
          <p className="mt-4 border-l-4 border-training bg-training-surface p-4 text-sm">{t(REASONS[session.reason] ?? session.reason)}</p>
          <p className="my-4 text-sm text-muted-foreground">{t("Τα λεπτά περιλαμβάνουν προθέρμανση και ανάπαυση, όχι συνεχή άσκηση. Ακολούθησε τη δόση κάθε βήματος. Τα βίντεο δείχνουν τεχνική, όχι ένταση ή θεραπεία.")}</p>
          <ol>{session.steps.map((step: any,i: number) => <li key={i} className="border-b py-4"><details open={i === 0}><summary className="flex list-none items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-training-surface font-mono text-sm text-training">{i+1}</span><span className="min-w-0 flex-1 text-sm leading-relaxed">{pick(step.el, step.en)}</span><span className="shrink-0 text-sm font-medium text-training">{step.minutes}′</span></summary><div className="mt-3 pl-0 sm:pl-11">{step.exerciseIds.map((id: string) => <ExerciseGuide id={id} key={id} />)}</div></details></li>)}</ol>
          {session.done && <Button className="mt-4" variant="outline" onClick={() => completed(false)}><Undo2 /> {t("Αναίρεση ολοκλήρωσης")}</Button>}
        </section>
        <aside className="space-y-6 border-t pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div><h3 className="mb-3 flex items-center gap-2 font-semibold"><Moon className="size-4 text-training" /> {t("Πριν ξεκινήσεις")}</h3>{session.date === today ? <ReadinessForm key={session.date} profile={profile} date={today} log={logMap[fitnessLogId(profile.id,today)]} /> : <p className="text-sm text-muted-foreground">{t("Ο έλεγχος ανοίγει μόνο την ημέρα της συνεδρίας. Η ιστορική ή μελλοντική προβολή δεν δίνει άδεια εκτέλεσης.")}</p>}</div>
          <div className="border-t pt-5"><h3 className="font-semibold">{t("Επίβλεψη δύναμης")}</h3><label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={settings.coachSupervised} onChange={e => saveTrainingSettings(profile.id,{ coachSupervised: e.target.checked },profile)} className="mt-1" />{t("Παρίσταται καταρτισμένος προπονητής και ελέγχει τεχνική και δόση.")}</label></div>
          <details className="border-t pt-5"><summary className="font-semibold">{t("Ώρα & διάρκεια")}</summary><form className="mt-4 space-y-3" key={session.id} onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); const key = ['mon','wed','fri'][selected]; saveTrainingSettings(profile.id,{ [`supplement${key}Time`]:data.get('time'), [`supplement${key}Minutes`]:Number(data.get('minutes')) },profile); }}><label className="block text-sm">{t("Έναρξη")}<Input type="time" name="time" required defaultValue={session.start} className="mt-1" /></label><label className="block text-sm">{t("Παράθυρο (40–60′)")}<Input type="number" name="minutes" min="40" max="60" required defaultValue={session.minutes} className="mt-1" /></label><Button type="submit" variant="outline"><Check /> {t("Αποθήκευση")}</Button></form></details>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("Οι έλεγχοι 9 ωρών μεταξύ υποχρεώσεων, τα περιθώρια σχολείου/ομάδας και τα όρια φόρτου είναι συντηρητικοί κανόνες του αρχικού προγράμματος — όχι κλινικά επικυρωμένο μοντέλο πρόβλεψης τραυματισμού.")}</p>
        </aside>
      </div>}
    </>}
    <section className="border-t pt-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="size-5 text-training" /> {t("Τεκμηρίωση, όχι υποσχέσεις")}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("Επαναφέραμε το αρχικό πρόγραμμα από την έκδοση 18.1.2. Δεν αποτελεί εξατομικευμένη συνταγή ή εγγύηση αποτελέσματος. Η πρόοδος και η επιβάρυνση αποφασίζονται μαζί με τον προπονητή της ομάδας.")}</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{TRAINING_EVIDENCE.map(source => <div key={source.url} className="border-b py-4"><a className="inline-flex items-start gap-2 font-medium text-training underline-offset-4 hover:underline" href={source.url} target="_blank" rel="noopener noreferrer">{t(source.name)}<ExternalLink className="mt-1 size-3 shrink-0" /></a><p className="mt-2 text-sm">{t(source.claim)}</p><p className="mt-2 text-xs text-muted-foreground">{t(source.checked)}</p></div>)}</div><p className="mt-4 text-xs text-muted-foreground">{t("14 σύνδεσμοι YouTube: τίτλος, κανάλι και διαθεσιμότητα επανελέγχθηκαν 15/11/2026. Δεν έγινε πλήρης ανεξάρτητος έλεγχος κάθε βίντεο. Η διαθεσιμότητα μπορεί να αλλάξει. Χωρίς ενσωμάτωση βίντεο ή αυτόματη αναπαραγωγή.")}</p></section>
    {coach && session && <SessionCoach session={session} allowed={canExecute} onClose={() => setCoach(false)} onComplete={() => completed(true)} />}
  </div>;
}
function PlayIcon() {
  const { t, pick, language } = useI18n(); return <Timer className="size-4" />; }