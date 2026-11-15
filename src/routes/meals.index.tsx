import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { RECIPES, SLOTS, SLOT_LABEL } from "@/engine/data";
import { kcalFromMacros, nutritionBadges } from "@/engine/nutrition-engine";
import { nf } from "@/lib/format";
import { pageHead } from "@/lib/head";
import { SLOT_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/meals/")({
  head: () => pageHead("Συνταγές", "28 ελληνικές συνταγές με θρεπτικά στοιχεία από USDA για κάθε μερίδα."),
  component: Meals,
});

const TONE: Record<string, string> = { blue: "bg-aegean/10 text-aegean", accent: "bg-olive/10 text-olive", rose: "bg-terracotta/10 text-terracotta", gold: "bg-sun/20 text-foreground", warn: "bg-destructive/10 text-destructive" };

function Meals() {
  const [slot, setSlot] = useState<string>("all");
  const [q, setQ] = useState("");
  const list = RECIPES.filter((r: any) => (slot === "all" || r.slot === slot) && r.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow={`${RECIPES.length} συνταγές`} title="Τι θα μαγειρέψουμε;" />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Αναζήτηση συνταγής…" className="h-11 rounded-full bg-card pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", ...SLOTS].map((s) => (
            <button key={s} onClick={() => setSlot(s)} className={cn("rounded-full border px-4 py-2 text-sm transition-colors", slot === s ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
              {s === "all" ? "Όλες" : SLOT_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r: any) => (
          <Link key={r.id} to="/meals/$id" params={{ id: r.id }} className="card-soft group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <div className="relative h-40 overflow-hidden">
              <img src={SLOT_IMAGE[r.slot]} alt="" loading="lazy" width={816} height={816} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-medium backdrop-blur">{SLOT_LABEL[r.slot]}</span>
            </div>
            <div className="p-5">
              <h2 className="font-display text-lg font-semibold leading-snug">{r.name}</h2>
              <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground tabular">
                <span className="flex items-center gap-1"><Clock className="size-3.5" />{r.time}′</span>
                <span>{nf(kcalFromMacros(r.base))} kcal</span>
                <span>{nf(r.base.p)} g πρωτ.</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {nutritionBadges(r).map((b) => <span key={b.id} className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", TONE[b.tone])}>{b.label}</span>)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
