import { useState } from 'react';
import { Check, Droplet, Dumbbell, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SLOTS, SLOT_LABEL } from '@/engine/data';
import { addDays } from '@/engine/dates';
import { ACTIVITY_KINDS, activityLog, memberProgress, type ActivityKind } from '@/lib/family-progress';
import { useI18n } from '@/lib/i18n';
import { getLog, planFor, recipeById, setState, updateLog, useStore } from '@/lib/store';
import { useActive } from '@/lib/useActive';
import { useToday } from '@/lib/useToday';
import { cn } from '@/lib/utils';
import { MemberSwitcher } from '@/components/AppShell';

const KIND: Record<ActivityKind, [string, string]> = { team: ['Ομαδική προπόνηση', 'Team practice'], walk: ['Περπάτημα', 'Walk'], strength: ['Δύναμη', 'Strength'], mobility: ['Κινητικότητα', 'Mobility'], sport: ['Άλλο άθλημα', 'Other sport'] };

/** One-tap daily check-in: meals, water and reported activity for the selected member. */
export function QuickCheckIn() {
  const { pick, t } = useI18n();
  const { profile } = useActive();
  const today = useToday();
  const [date, setDate] = useState<string | null>(null);
  const day = date ?? today;
  const log = useStore(s => getLog(s, profile.id, day));
  const state = useStore(s => s);
  const plan = planFor(day);
  const [kind, setKind] = useState<ActivityKind>(profile.athlete ? 'team' : 'walk');
  const [minutes, setMinutes] = useState('');
  const pr = memberProgress(state, profile.id, day, day);
  const activities = Object.values(state.trainingLogs ?? {}).filter((l: any) => l.memberId === profile.id && l.date === day && String(l.id).startsWith('activity-log:'));
  const toggle = (slot: string) => updateLog(profile.id, day, l => { const meals = { ...l.meals }; if (meals[slot]?.status === 'done') delete meals[slot]; else meals[slot] = { status: 'done', portion: 1 }; return { ...l, meals }; });
  const water = (d: number) => updateLog(profile.id, day, l => ({ ...l, waterMl: Math.max(0, l.waterMl + d) }));
  const addActivity = () => { const entry = activityLog(profile.id, day, kind, Number(minutes), Date.now()); if (!entry) return; setState(s => ({ ...s, trainingLogs: { ...s.trainingLogs, [entry.id]: entry } })); setMinutes(''); };
  const removeActivity = (id: string) => setState(s => { const next = { ...s.trainingLogs }; delete next[id]; return { ...s, trainingLogs: next }; });
  const valid = activityLog(profile.id, day, kind, Number(minutes), 0) !== null;
  return <section className="card-soft mb-8 p-5 sm:p-6" aria-labelledby="checkin-title">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-terracotta">{pick('Γρήγορη καταγραφή · 10 δευτερόλεπτα', 'Quick check-in · 10 seconds')}</p><h2 id="checkin-title" className="mt-1 text-2xl font-semibold">{pick(`Τι έκανε ${profile.name};`, `What did ${profile.name} do?`)}</h2></div>
      <div className="inline-flex rounded-full border p-1" role="group" aria-label={pick('Ημέρα', 'Day')}>{([[today, pick("Σήμερα", "Today")], [addDays(today, -1), pick("Χθες", "Yesterday")]] as [string, string][]).map(([d, label]) => <button key={d} type="button" aria-pressed={day === d} onClick={() => setDate(d)} className={cn('rounded-full px-4 py-1.5 text-sm', day === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{label}</button>)}</div></div>
    <div className="mt-4"><MemberSwitcher /></div>
    <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div><h3 className="mb-2 text-sm font-semibold">{pick('Γεύματα · πάτα όσα φαγώθηκαν', 'Meals · tap the ones eaten')} <span className="font-normal text-muted-foreground">{pr.meals}/{pr.mealTotal}</span></h3>
        <div className="grid grid-cols-2 gap-2">{SLOTS.map(slot => { const done = log.meals[slot]?.status === 'done'; const r = recipeById(plan?.[slot]); return <button key={slot} type="button" aria-pressed={done} onClick={() => toggle(slot)} className={cn('flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left transition-all', done ? 'border-success bg-success/10' : 'bg-card hover:bg-muted')}><span className={cn('grid size-7 shrink-0 place-items-center rounded-full border-2', done ? 'border-success bg-success text-primary-foreground' : 'border-border')}>{done && <Check className="size-4" />}</span><span className="min-w-0"><span className="block text-sm font-medium">{t(SLOT_LABEL[slot])}</span>{r && <span className="block truncate text-xs text-muted-foreground">{t(r.name)}</span>}</span></button>; })}</div>
        <div className="mt-3 flex items-center gap-3 rounded-lg border p-3"><Droplet className="size-5 text-aegean" /><span className="flex-1 text-sm">{pick('Νερό', 'Water')} <b className="tabular">{log.waterMl} ml</b></span><Button size="icon" variant="outline" aria-label={pick('Λιγότερο νερό', 'Less water')} onClick={() => water(-250)}><Minus /></Button><Button size="icon" variant="outline" aria-label={pick('Ένα ποτήρι νερό', 'One glass of water')} onClick={() => water(250)}><Plus /></Button></div>
      </div>
      <div><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Dumbbell className="size-4 text-training" />{pick('Άσκηση που έγινε', 'Exercise completed')}</h3>
        <div className="flex flex-wrap gap-1.5">{ACTIVITY_KINDS.map(k => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={cn('rounded-full border px-3 py-1.5 text-xs', kind === k ? 'border-training bg-training-surface font-semibold text-training' : 'bg-card text-muted-foreground')}>{pick(...KIND[k])}</button>)}</div>
        <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); addActivity(); }}><Input inputMode="numeric" aria-label={pick('Λεπτά που έγιναν', 'Minutes completed')} placeholder={pick('λεπτά', 'minutes')} value={minutes} onChange={e => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 3))} className="h-11 w-28" /><Button type="submit" className="h-11 flex-1" disabled={!valid}><Plus />{pick('Καταγραφή', 'Log it')}</Button></form>
        <p className="mt-2 text-xs text-muted-foreground">{pick('Γράψε τα λεπτά που έγιναν πραγματικά (1–240), όχι τα προγραμματισμένα.', 'Enter the minutes actually done (1–240), not the planned ones.')}</p>
        <ul className="mt-3 divide-y">{activities.map((a: any) => <li key={a.id} className="flex items-center justify-between py-2 text-sm"><span>{pick(...KIND[a.kind as ActivityKind] ?? ['Άσκηση', 'Exercise'])} · <b className="tabular">{a.completedMinutes}′</b></span><Button size="icon" variant="ghost" className="size-8" aria-label={pick('Διαγραφή', 'Delete')} onClick={() => removeActivity(a.id)}><Trash2 className="size-4" /></Button></li>)}</ul>
        <p className="mt-2 text-sm"><b className="tabular">{pr.sessions}</b> {pick('ολοκληρωμένες συνεδρίες', 'completed sessions')} · <b className="tabular">{pr.completedMinutes}′</b></p>
      </div>
    </div>
  </section>;
}
