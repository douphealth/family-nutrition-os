import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { MemberSwitcher, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { SLOTS, SLOT_LABEL } from "@/engine/data";
import { addDays, mondayOf } from "@/engine/dates";
import { dayMacros, targetsFor } from "@/engine/nutrition-engine";
import { greekDate, nf } from "@/lib/format";
import { pageHead } from "@/lib/head";
import { SLOT_IMAGE } from "@/lib/images";
import { planFor, recipeById, todayKey } from "@/lib/store";
import { useActive } from "@/lib/useActive";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plan")({
  head: () => pageHead("Πρόγραμμα", "Η εβδομάδα σε μια ματιά: 28 ημέρες εναλλαγής με την ενέργεια κάθε ημέρας."),
  component: Plan,
});

function Plan() {
  const { profile, load } = useActive();
  const [offset, setOffset] = useState(0);
  const today = todayKey();
  const monday = addDays(mondayOf(today), offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const t = targetsFor(profile, load);
  const plan0 = planFor(monday);

  return (
    <>
      <PageHeader eyebrow={`Εβδομάδα ${plan0.week} από 4`} title="Το πρόγραμμα της εβδομάδας">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full" aria-label="Προηγούμενη" onClick={() => setOffset(offset - 1)}><ChevronLeft /></Button>
          <Button variant={offset === 0 ? "default" : "outline"} className="rounded-full" onClick={() => setOffset(0)}>Αυτή η εβδομάδα</Button>
          <Button variant="outline" size="icon" className="rounded-full" aria-label="Επόμενη" onClick={() => setOffset(offset + 1)}><ChevronRight /></Button>
        </div>
      </PageHeader>
      <div className="mb-6"><MemberSwitcher /></div>
      <p className="mb-4 text-sm text-muted-foreground">Θερμίδες για {profile.name} · στόχος {nf(t.energy.lower)}–{nf(t.energy.upper)} kcal</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {days.map((d) => {
          const p = planFor(d);
          const kcal = dayMacros(p, profile, load, {}, recipeById).planned.kcal;
          const inRange = kcal >= t.energy.lower * 0.9 && kcal <= t.energy.upper * 1.1;
          const isToday = d === today;
          return (
            <article key={d} className={cn("card-soft p-4", isToday && "ring-2 ring-primary")}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-display text-lg font-semibold capitalize">{greekDate(d, { weekday: "long" })}</h2>
                <span className="text-xs text-muted-foreground">{greekDate(d, { day: "numeric", month: "short" })}{isToday && " · σήμερα"}</span>
              </div>
              <ul className="space-y-2">
                {SLOTS.map((s) => {
                  const r = recipeById(p[s]);
                  return (
                    <li key={s}>
                      <Link to="/meals/$id" params={{ id: r.id }} className="group flex items-center gap-3 rounded-xl p-1 hover:bg-muted">
                        <img src={SLOT_IMAGE[s]} alt="" loading="lazy" width={816} height={816} className="size-10 rounded-lg object-cover" />
                        <span className="min-w-0">
                          <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">{SLOT_LABEL[s]}</span>
                          <span className="block truncate text-sm font-medium group-hover:underline">{r.name}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Σύνολο</span>
                <span className={cn("rounded-full px-2.5 py-0.5 font-semibold tabular", inRange ? "bg-success/10 text-success" : "bg-warning/15 text-foreground")}>{nf(kcal)} kcal</span>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
