import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SLOT_LABEL } from '@/engine/data';
import { addDays } from '@/engine/dates';
import { familyRoutines } from '@/lib/family-progress';
import { greekDate, nf } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { useToday } from '@/lib/useToday';

export function FamilyRoutines() {
  const state = useStore(s => s);
  const { pick, t, language } = useI18n();
  const today = useToday();
  const [days, setDays] = useState<7 | 28>(7);
  const summary = familyRoutines(state, addDays(today, -1), days);
  const percent = summary.mealTotal ? Math.round(100 * summary.meals / summary.mealTotal) : 0;
  const difference = summary.meals - summary.previousMeals;
  return <section className="mb-8 border-b pb-8" aria-labelledby="family-routines-title">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div><h2 id="family-routines-title" className="text-2xl font-semibold">{pick('Οι οικογενειακές συνήθειες', 'Family routines')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{greekDate(summary.start, undefined, language)} — {greekDate(summary.end, undefined, language)}</p></div>
      <div className="flex gap-1 rounded-md bg-muted p-1" role="group" aria-label={pick('Περίοδος συνηθειών', 'Routine period')}>
        {([7, 28] as const).map(n => <Button key={n} size="sm" variant={days === n ? 'default' : 'ghost'} aria-pressed={days === n} onClick={() => setDays(n)}>{n} {pick('ημέρες', 'days')}</Button>)}
      </div>
    </div>
    <p className="mb-5 flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 shrink-0" />{pick('Ιδιωτική σύνοψη στη συσκευή · χωρίς αποστολή δεδομένων. Οι ημέρες χωρίς καταγραφή δεν αποδεικνύουν ότι χάθηκε ένα γεύμα ή μια προπόνηση.', 'Private on-device summary · no data sent. Unlogged days do not prove a meal or workout was missed.')}</p>
    <div className="grid gap-5 sm:grid-cols-3">
      <div><p className="text-sm text-muted-foreground">{pick('Γεύματα σημειωμένα ως φαγωμένα', 'Meals marked as eaten')}</p><p className="mt-2 text-3xl font-semibold tabular" data-testid="routine-meals">{summary.meals}/{summary.mealTotal}</p><p className="mt-2 text-sm text-muted-foreground">{percent}% · {difference > 0 ? '+' : ''}{difference} {pick('έναντι προηγούμενης περιόδου', 'vs previous period')}</p></div>
      <div><p className="text-sm text-muted-foreground">{pick('Ολοκληρωμένες συνεδρίες', 'Completed sessions')}</p><p className="mt-2 text-3xl font-semibold tabular" data-testid="routine-sessions">{summary.sessions}</p><p className="mt-2 text-sm text-muted-foreground">{pick('Προηγούμενη περίοδος', 'Previous period')}: {summary.previousSessions}</p></div>
      <div><p className="text-sm text-muted-foreground">{pick('Καταγεγραμμένα λεπτά', 'Recorded minutes')}</p><p className="mt-2 text-3xl font-semibold tabular" data-testid="routine-minutes">{nf(summary.completedMinutes, 0, language)}′</p><p className="mt-2 text-sm text-muted-foreground">{pick('Συνεδρίες χωρίς καταγεγραμμένα λεπτά', 'Sessions without recorded minutes')}: {summary.unknownMinutes}</p></div>
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{summary.slots.map(slot => <div key={slot.slot}><div className="flex justify-between gap-2 text-sm"><span>{t(SLOT_LABEL[slot.slot])}</span><b className="tabular">{slot.completed}/{slot.total}</b></div><progress className="family-meter mt-2 h-1.5 w-full" value={slot.completed} max={slot.total || 1} aria-label={t(SLOT_LABEL[slot.slot])} /></div>)}</div>
    <details className="mt-6 border-t pt-4"><summary className="cursor-pointer text-sm font-semibold">{pick('Ανά ημέρα', 'Daily breakdown')}</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">{pick('Ημερομηνία', 'Date')}</th><th>{pick('Γεύματα', 'Meals')}</th><th>{pick('Συνεδρίες', 'Sessions')}</th></tr></thead><tbody>{summary.daily.map(day => <tr key={day.date} className="border-b"><td className="py-2">{greekDate(day.date, { day: 'numeric', month: 'short' }, language)}</td><td className="tabular">{day.meals}/{day.mealTotal}</td><td className="tabular">{day.sessions}</td></tr>)}</tbody></table></div></details>
  </section>;
}