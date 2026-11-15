import { useI18n } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Droplets, Minus, Plus, SkipForward, Sparkles, Undo2 } from "lucide-react";
import hero from "@/assets/hero-table.jpg";
import { MemberSwitcher } from "@/components/AppShell";
import { PlateList } from "@/components/PlateList";
import { Bar, Ring } from "@/components/Ring";
import { Button } from "@/components/ui/button";
import { SLOTS, SLOT_LABEL, SLOT_TIME, TRAINING_LOADS } from "@/engine/data";
import { contextualGuidance, dayMacros, referenceValues, saltGrams, targetsFor } from "@/engine/nutrition-engine";
import { greekDate, nf } from "@/lib/format";
import { SLOT_IMAGE } from "@/lib/images";
import { getLog, planFor, recipeById, setState, todayKey, updateLog, useStore } from "@/lib/store";
import { useActive } from "@/lib/useActive";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Σήμερα · Zenith οικογενειακή διατροφή" },
      { name: "description", content: "Το επόμενο γεύμα, η μερίδα σου σε γραμμάρια, νερό και η πορεία της ημέρας." },
      { property: "og:title", content: "Σήμερα · Zenith οικογενειακή διατροφή" },
      { property: "og:description", content: "Το επόμενο γεύμα, η μερίδα σου σε γραμμάρια, νερό και η πορεία της ημέρας." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Today,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Καλημέρα" : h < 18 ? "Καλό απόγευμα" : "Καλησπέρα";
}

function Today() {
  const { t: tr, pick, language } = useI18n();
  const { profile, load } = useActive();
  const date = todayKey();
  const plan = planFor(date);
  const log = useStore((s) => getLog(s, s.activeId, date));
  const t = targetsFor(profile, load);
  const refs = referenceValues(profile);
  const day = dayMacros(plan, profile, load, log, recipeById);
  const nextSlot = SLOTS.find((s) => !log.meals[s]) ?? null;
  const nextRecipe = nextSlot ? recipeById(plan[nextSlot]) : null;
  const tips = contextualGuidance({ profile, trainingLoad: load, today: { waterMl: log.waterMl }, plannedMeal: null });
  const eaten = day.confirmed;
  const done = Object.values(log.meals).filter((m) => m.status === "done").length;

  const mark = (slot: string, status: "done" | "skipped" | null) =>
    updateLog(profile.id, date, (l) => {
      const meals = { ...l.meals };
      if (status) meals[slot] = { status, portion: 1 };
      else delete meals[slot];
      return { ...l, meals };
    });
  const water = (d: number) => updateLog(profile.id, date, (l) => ({ ...l, waterMl: Math.max(0, l.waterMl + d) }));

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] shadow-lift animate-rise">
        <img src={hero} alt={tr("Ελληνικό οικογενειακό τραπέζι")} width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative flex min-h-[260px] flex-col justify-end gap-2 p-6 text-primary-foreground sm:p-10">
          <p className="text-sm capitalize opacity-80">{greekDate(date, undefined, language)} {tr("· Ημέρα")}{plan.day} {tr("από 28")}</p>
          <h1 className="max-w-lg text-4xl font-semibold sm:text-5xl">{tr(greeting())}, {profile.name}</h1>
          <p className="max-w-md text-base opacity-85">
            {done === 4 ? tr("Όλα τα γεύματα της ημέρας είναι καταγεγραμμένα. Μπράβο!") : tr(`${done} από 4 γεύματα σήμερα · ${tr(profile.role)}`)}
          </p>
        </div>
      </section>

      <MemberSwitcher />

      <div className="flex flex-wrap items-center justify-between gap-3 border-y py-4"><p className="text-sm text-muted-foreground">{pick('Για εσένα σήμερα','For you today')} · {tr(profile.role)}</p><Button asChild variant="outline"><Link to="/training">{pick('Η δική μου προπόνηση','My training')} →</Link></Button></div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Next meal */}
        <section className="card-soft overflow-hidden animate-rise">
          {nextSlot && nextRecipe ? (
            <>
              <div className="flex flex-col sm:flex-row">
                <img src={SLOT_IMAGE[nextSlot]} alt="" loading="lazy" width={816} height={816} className="h-44 w-full object-cover sm:h-auto sm:w-48" />
                <div className="flex-1 p-6">
                  <p className="flex items-center gap-2 text-sm font-medium text-terracotta">
                    <Clock className="size-4" /> {tr("Επόμενο ·")}{tr(SLOT_LABEL[nextSlot])} {SLOT_TIME[nextSlot]}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">{tr(nextRecipe.name)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{tr("Το πιάτο του/της")}{profile.name} {tr("— ζύγισε ή μέτρησε:")}</p>
                  <div className="mt-3"><PlateList recipe={nextRecipe} profile={profile} load={load} /></div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t bg-surface/60 p-4">
                <Button size="lg" className="rounded-full" onClick={() => mark(nextSlot, "done")}><Check /> {tr("Το έφαγα")}</Button>
                <Button size="lg" variant="outline" className="rounded-full" onClick={() => mark(nextSlot, "skipped")}><SkipForward /> {tr("Παράλειψη")}</Button>
                <Button size="lg" variant="ghost" className="ml-auto rounded-full" asChild>
                  <Link to="/meals/$id" params={{ id: nextRecipe.id }}>{tr("Συνταγή & μαγείρεμα →")}</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="grid place-items-center gap-2 p-12 text-center">
              <Sparkles className="size-8 text-sun" />
              <h2 className="text-2xl font-semibold">{tr("Η μέρα ολοκληρώθηκε")}</h2>
              <p className="text-muted-foreground">{tr("Τα τέσσερα γεύματα έχουν καταγραφεί. Τα λέμε αύριο!")}</p>
            </div>
          )}
        </section>

        {/* Energy */}
        <section className="card-soft p-6 animate-rise">
          <h2 className="text-lg font-semibold">{tr("Η ενέργεια της ημέρας")}</h2>
          <div className="mt-4 flex items-center gap-6">
            <Ring value={eaten.kcal} max={t.energy.upper} color={profile.accent}>
              <div>
                <div className="font-display text-3xl font-semibold tabular">{nf(eaten.kcal, 0, language)}</div>
                <div className="text-xs text-muted-foreground">kcal</div>
              </div>
            </Ring>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">{tr("Εύρος στόχου")}</p>
              <p className="font-display text-xl font-semibold tabular">{nf(t.energy.lower, 0, language)}–{nf(t.energy.upper, 0, language)}</p>
              <p className="text-muted-foreground">{tr("Πρόγραμμα ημέρας:")}<b className="text-foreground tabular">{nf(day.planned.kcal, 0, language)} kcal</b></p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <Metric label={tr("Πρωτεΐνη")} value={eaten.p} unit="g" goal={t.protein.min} goalText={`${t.protein.min}–${t.protein.max} g`} color="var(--aegean)" />
            <Metric label={tr("Ίνες")} value={eaten.fib} unit="g" goal={refs.fibre.g} goalText={tr(`στόχος ${refs.fibre.g} g`)} color="var(--olive)" />
            <Metric label={tr("Σίδηρος")} value={eaten.fe} unit="mg" goal={refs.iron.mg} goalText={tr(`στόχος ${refs.iron.mg} mg`)} color="var(--terracotta)" />
            <Metric label={tr("Ασβέστιο")} value={eaten.ca} unit="mg" goal={refs.calcium.mg} goalText={tr(`στόχος ${refs.calcium.mg} mg`)} color="var(--sun)" />
            <Metric label={tr("Αλάτι")} value={saltGrams(eaten.na)} unit="g" goal={refs.sodium.saltG} goalText={tr(`κάτω από ${refs.sodium.saltG} g`)} color={eaten.na > refs.sodium.maxMg ? "var(--destructive)" : "var(--muted-foreground)"} decimals={1} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Day timeline */}
        <section className="card-soft p-6">
          <h2 className="text-lg font-semibold">{tr("Τα γεύματα της ημέρας")}</h2>
          <ol className="mt-4 space-y-2">
            {SLOTS.map((slot) => {
              const r = recipeById(plan[slot]);
              const st = log.meals[slot]?.status;
              const kcal = day.detail.find((d: any) => d.slot === slot)?.planned.kcal ?? 0;
              return (
                <li key={slot} className={cn("flex items-center gap-4 rounded-2xl border p-3 transition-colors", st === "done" ? "border-success/30 bg-success/5" : st === "skipped" ? "opacity-60" : "bg-card")}>
                  <img src={SLOT_IMAGE[slot]} alt="" loading="lazy" width={816} height={816} className="size-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{tr(SLOT_LABEL[slot])} · {SLOT_TIME[slot]}</p>
                    <Link to="/meals/$id" params={{ id: r.id }} className={cn("block truncate font-medium hover:underline", st === "skipped" && "line-through")}>{tr(r.name)}</Link>
                    <p className="text-xs text-muted-foreground tabular">{nf(kcal, 0, language)} {tr("kcal για")}{profile.name}</p>
                  </div>
                  {st ? (
                    <Button variant="ghost" size="icon" aria-label={tr("Αναίρεση")} onClick={() => mark(slot, null)}><Undo2 /></Button>
                  ) : (
                    <Button variant="outline" size="icon" className="rounded-full" aria-label={tr(`Έφαγα ${tr(SLOT_LABEL[slot])}`)} onClick={() => mark(slot, "done")}><Check /></Button>
                  )}
                  {st === "done" && <span className="grid size-9 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-4" /></span>}
                </li>
              );
            })}
          </ol>
        </section>

        <div className="space-y-6">
          {/* Water */}
          <section className="card-soft p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><Droplets className="size-5 text-aegean" /> {tr("Νερό")}</h2>
              <span className="text-sm text-muted-foreground tabular">{nf(log.waterMl, 0, language)} / {nf(t.hydration.ml, 0, language)} ml</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {Array.from({ length: t.hydration.glasses }).map((_, i) => (
                <button key={i} onClick={() => water(i < log.waterMl / 250 ? -250 : 250)} aria-label={tr(`Ποτήρι ${i + 1}`)}
                  className={cn("h-10 w-7 rounded-b-lg rounded-t-sm border-2 transition-all", i < Math.round(log.waterMl / 250) ? "border-aegean bg-aegean/70" : "border-border bg-muted/50 hover:border-aegean/50")} />
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => water(-250)}><Minus /> 250 ml</Button>
              <Button className="rounded-full" onClick={() => water(250)}><Plus /> {tr("Ένα ποτήρι")}</Button>
            </div>
          </section>

          {profile.athlete && (
            <section className="card-soft p-6">
              <h2 className="text-lg font-semibold">{tr("Προπόνηση σήμερα")}</h2>
              <Button asChild variant="outline" className="my-3"><Link to="/training">{tr("Ατομικό πρόγραμμα μπάσκετ →")}</Link></Button>
              <p className="text-sm text-muted-foreground">{tr("Αλλάζει τους υδατάνθρακες και το νερό του")}{profile.name}.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TRAINING_LOADS.map(([id, label]) => (
                  <button key={id} onClick={() => setState((s) => ({ ...s, loads: { ...s.loads, [profile.id]: id } }))}
                    className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", load === id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>{label}</button>
                ))}
              </div>
            </section>
          )}

          {tips.length > 0 && (
            <section className="rounded-[1.4rem] bg-accent p-6 text-accent-foreground">
              <h2 className="flex items-center gap-2 font-semibold"><Sparkles className="size-4" /> {tr("Συμβουλές για σήμερα")}</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">{tips.map((tip) => <li key={tip}>{tr(tip)}</li>)}</ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, unit, goal, goalText, color, decimals = 0 }: { label: string; value: number; unit: string; goal: number; goalText: string; color: string; decimals?: number }) {
  const { t, pick, language } = useI18n();
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular"><b className="text-foreground">{nf(value, decimals, language)} {unit}</b> · {goalText}</span>
      </div>
      <Bar value={value} max={goal} color={color} />
    </div>
  );
}
