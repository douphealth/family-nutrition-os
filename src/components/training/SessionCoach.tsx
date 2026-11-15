import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exerciseFor, isSafeYouTubeWatchUrl } from '@/training/exercise-library';
import { SESSION_TITLE } from '@/training/evidence';

export function ExerciseGuide({ id }: { id: string }) {
  const { t, pick, language } = useI18n();
  const e = exerciseFor(id);
  if (!e) return null;
  return <div className="border-t py-4 first:border-0">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h4 className="font-semibold">{pick(e.title.el, e.title.en)}</h4><p className="mt-1 text-xs text-muted-foreground">{e.title.en}</p></div>
      {e.video && isSafeYouTubeWatchUrl(e.video.url) && <Button asChild variant="outline" size="sm" className="shrink-0"><a href={e.video.url} target="_blank" rel="noopener noreferrer"><Youtube /> {t("Βίντεο τεχνικής")}</a></Button>}
    </div>
    <p className="mt-2 text-sm">{pick(e.cue.el, e.cue.en)}</p>
    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><p><span className="font-medium text-terracotta">{t("Απόφυγε:")}</span>{pick(e.avoid.el, e.avoid.en)}</p><p><span className="font-medium text-training">{t("Πιο εύκολα:")}</span>{pick(e.easier.el, e.easier.en)}</p></div>
    <p className="mt-2 text-xs text-muted-foreground">{pick(e.equipment.el, e.equipment.en)}{e.video ? t(` · ${e.video.channel} · Έλεγχος τίτλου/διαθεσιμότητας 15/11/2026`) : ''}</p>
  </div>;
}

export function SessionCoach({ session, allowed, onClose, onComplete }: { session: any; allowed: boolean; onClose: () => void; onComplete: () => void }) {
  const { t, pick, language } = useI18n();
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const step = session.steps[index];
  const limit = step.minutes * 60;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds(x => Math.min(x + 1, limit)), 1000);
    return () => window.clearInterval(timer);
  }, [running, limit]);
  useEffect(() => { if (seconds >= limit) setRunning(false); }, [seconds, limit]);
  const move = (n: number) => { setIndex(n); setSeconds(0); setRunning(false); };
  const remaining = limit - seconds;
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-background training-page" role="dialog" aria-modal="true" aria-labelledby="coach-title" onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
      <div className="flex items-center justify-between gap-3 border-b pb-4"><div><p className="text-xs text-training">{session.date} {session.start && `· ${session.start}–${session.end}`}</p><h2 id="coach-title" className="text-xl font-semibold">{session.type === 'mobility' ? pick('Κίνηση & κινητικότητα','Movement & mobility') : t(SESSION_TITLE[session.type])}</h2></div><Button variant="ghost" size="icon" aria-label={t("Κλείσιμο συνεδρίας")} onClick={onClose} autoFocus><X /></Button></div>
      {!allowed && <p className="mt-4 rounded-lg bg-accent p-4 text-sm text-accent-foreground">{t("Προεπισκόπηση μόνο. Δεν έχεις έγκριση εκτέλεσης για αυτή την ημέρα.")}</p>}
      <div className="mt-6 flex gap-1" aria-label={t(`Βήμα ${index + 1} από ${session.steps.length}`)}>{session.steps.map((_: unknown, i: number) => <div key={i} className={`h-1 flex-1 ${i <= index ? 'bg-training' : 'bg-muted'}`} />)}</div>
      <p className="mt-6 text-sm font-medium text-training">{t("ΒΗΜΑ")}{index + 1} / {session.steps.length} {t("· ΠΑΡΑΘΥΡΟ")}{step.minutes}′</p>
      <h3 className="mt-3 text-xl font-semibold leading-relaxed">{pick(step.el, step.en)}</h3>
      <p className="mt-3 text-sm text-muted-foreground">{t("Ο χρόνος περιλαμβάνει διαλείμματα. Οι επαναλήψεις είναι αυτές του βήματος — δεν συνεχίζεις μέχρι να τελειώσει ο χρόνος.")}</p>
      <div className="my-6 flex flex-wrap items-center gap-3 border-y py-5"><span className="mr-auto font-mono text-4xl tabular">{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span><Button disabled={!allowed} onClick={() => setRunning(x => !x)} variant="outline">{running ? <Pause /> : <Play />}{running ? t('Παύση') : t('Χρονόμετρο')}</Button><Button variant="ghost" size="icon" aria-label={t("Μηδενισμός χρόνου")} onClick={() => { setSeconds(0); setRunning(false); }}><RotateCcw /></Button></div>
      {step.exerciseIds.map((id: string) => <ExerciseGuide key={id} id={id} />)}
      <div className="mt-6 flex flex-wrap justify-between gap-3 border-t pt-5"><Button variant="outline" disabled={index === 0} onClick={() => move(index - 1)}><ChevronLeft /> {t("Πίσω")}</Button>{index < session.steps.length - 1 ? <Button onClick={() => move(index + 1)}>{t("Επόμενο βήμα")}<ChevronRight /></Button> : <Button disabled={!allowed} onClick={() => { onComplete(); onClose(); }}><Check /> {t("Ολοκλήρωσα τη συνεδρία")}</Button>}</div>
      <p className="mt-6 text-sm text-muted-foreground">{t("Πόνος, ζάλη ή αδιαθεσία → διακοπή. Πρώτα ο γονέας/προπονητής, όχι το χρονόμετρο.")}</p>
    </div>
  </div>;
}