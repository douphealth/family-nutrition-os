import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Check, Dumbbell, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays } from '@/engine/dates';
import { memberProgress } from '@/lib/family-progress';
import { useI18n } from '@/lib/i18n';
import { setState, useStore } from '@/lib/store';
import { useToday } from '@/lib/useToday';
import { greekDate } from '@/lib/format';

export function FamilyProgress() {
  const state = useStore(s => s);
  const { pick, t, language } = useI18n();
  const today = useToday();
  const [week, setWeek] = useState(false);
  const start = week ? addDays(today, -6) : today;
  return <section className="mb-8 border-b pb-8" aria-labelledby="family-progress-title">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase text-terracotta">Zenith · {pick('Μαζί, κάθε μέρα', 'Together, every day')}</p><h2 id="family-progress-title" className="text-2xl font-semibold">{pick('Η πρόοδος της οικογένειας', 'Family progress')}</h2><p className="mt-2 text-sm text-muted-foreground">{greekDate(start, undefined, language)}{week && ` — ${greekDate(today, undefined, language)}`}</p></div><div className="flex gap-1 rounded-md bg-muted p-1" role="group" aria-label={pick('Περίοδος προόδου','Progress period')}><Button size="sm" variant={week ? 'ghost' : 'default'} aria-pressed={!week} onClick={() => setWeek(false)}>{t('Σήμερα')}</Button><Button size="sm" variant={week ? 'default' : 'ghost'} aria-pressed={week} onClick={() => setWeek(true)}>{pick('Τελευταίες 7 ημέρες','Last 7 days')}</Button></div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{state.profiles.map(p => {
      const progress = memberProgress(state, p.id, start, today);
      return <article key={p.id} className="card-soft p-5" aria-label={p.name}>
        <div className="mb-5 flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{p.name.charAt(0)}</span><div className="min-w-0"><h3 className="truncate font-sans text-lg font-semibold">{p.name}</h3><p className="text-xs text-muted-foreground">{t(p.relation)}</p></div>{progress.completeDays > 0 && <Check className="ml-auto size-5 text-success" />}</div>
        <div className="flex items-center justify-between gap-2 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Utensils className="size-4" />{pick('Γεύματα','Meals')}</span><b className="tabular" data-testid={`meals-${p.id}`}>{progress.meals}/{progress.mealTotal}</b></div>
        <progress className="family-meter my-3 h-1.5 w-full" value={progress.meals} max={progress.mealTotal} aria-label={pick('Ολοκληρωμένα γεύματα','Completed meals')} />
        <div className="flex items-center justify-between gap-2 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Dumbbell className="size-4" />{pick('Συνεδρίες','Sessions')}</span><b data-testid={`sessions-${p.id}`}>{progress.sessions}</b></div>
        <p className="mt-2 text-xs text-muted-foreground">{progress.completedMinutes}′ {pick('καταγεγραμμένα','recorded')}{progress.unknownMinutes > 0 && ` · ${progress.unknownMinutes} ${pick('χωρίς λεπτά','without minutes')}`}</p>
        <p className="mt-3 text-xs text-muted-foreground">{progress.completeDays} {pick('ημέρες με όλα τα γεύματα','days with every meal')}</p>
        <div className="mt-4 flex gap-2 border-t pt-3"><Button asChild variant="ghost" size="sm" className="flex-1" onClick={() => setState(s => ({ ...s, activeId: p.id }))}><Link to="/">{pick('Γεύματα','Meals')}<ArrowUpRight /></Link></Button><Button asChild variant="ghost" size="sm" className="flex-1" onClick={() => setState(s => ({ ...s, activeId: p.id }))}><Link to="/training">{t('Προπόνηση')}<ArrowUpRight /></Link></Button></div>
      </article>;
    })}</div>
  </section>;
}