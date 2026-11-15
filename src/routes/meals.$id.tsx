import { useI18n } from "@/lib/i18n";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ChefHat, Clock, Lightbulb, X } from "lucide-react";
import { useState } from "react";
import { PlateList } from "@/components/PlateList";
import { Button } from "@/components/ui/button";
import { SLOT_LABEL } from "@/engine/data";
import { kcalFromMacros, mealMacros, nutritionBadges, saltGrams } from "@/engine/nutrition-engine";
import { nf } from "@/lib/format";
import { SLOT_IMAGE } from "@/lib/images";
import { loadOf, recipeById, useStore, withPlate } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/meals/$id")({
  loader: ({ params }) => {
    const r = recipeById(params.id);
    if (!r) throw notFound();
    return { name: r.name as string, slot: r.slot as string };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Συνταγή"} · Zenith` },
      { name: "description", content: `${loaderData?.name}: υλικά, βήματα και η μερίδα κάθε μέλους της οικογένειας.` },
      { property: "og:title", content: `${loaderData?.name ?? "Συνταγή"} · Zenith` },
      { property: "og:description", content: "Υλικά, βήματα και η μερίδα κάθε μέλους της οικογένειας." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Recipe,
});

function Recipe() {
  const { t, pick, language } = useI18n();
  const { id } = Route.useParams();
  const r = recipeById(id);
  const s = useStore((x) => x);
  const profiles = s.profiles.map((p) => withPlate(p, loadOf(s, p.id)));
  const [who, setWho] = useState(s.activeId);
  const [cook, setCook] = useState<number | null>(null);
  const me = profiles.find((p) => p.id === who) ?? profiles[0]!;
  const m = mealMacros(r, me, loadOf(s, me.id));

  return (
    <div className="space-y-6">
      <Link to="/meals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> {t("Όλες οι συνταγές")}</Link>
      <section className="card-soft grid overflow-hidden md:grid-cols-2">
        <img src={SLOT_IMAGE[r.slot]} alt="" width={816} height={816} className="h-64 w-full object-cover md:h-full" />
        <div className="p-6 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-terracotta">{t(SLOT_LABEL[r.slot])}</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{t(r.name)}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground"><Clock className="size-4" /> {r.time} {t("λεπτά")}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{nutritionBadges(r).map((b) => <span key={b.id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{t(b.label)}</span>)}</div>
          {r.tip && <p className="mt-5 flex gap-2 rounded-2xl bg-accent p-4 text-sm text-accent-foreground"><Lightbulb className="size-4 shrink-0" />{t(r.tip)}</p>}
          <Button size="lg" className="mt-6 rounded-full" onClick={() => setCook(0)}><ChefHat /> {t("Ξεκίνα μαγείρεμα")}</Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card-soft p-6">
          <h2 className="text-lg font-semibold">{t("Το πιάτο του καθενός")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profiles.map((p) => (
              <button key={p.id} onClick={() => setWho(p.id)} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm", who === p.id ? "bg-card shadow-lift" : "bg-muted/60 text-muted-foreground")}>
                <span className="size-2.5 rounded-full" style={{ background: p.accent }} />{p.name}
              </button>
            ))}
          </div>
          <div className="mt-3"><PlateList recipe={r} profile={me} load={loadOf(s, me.id)} /></div>
        </section>
        <section className="card-soft p-6">
          <h2 className="text-lg font-semibold">{t("Θρεπτικά για")}{me.name}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[[t("Ενέργεια"), `${nf(m.kcal, 0, language)} kcal`], [t("Πρωτεΐνη"), `${nf(m.p, 1, language)} g`], [t("Υδατάνθρακες"), `${nf(m.c, 1, language)} g`], [t("Λίπος"), `${nf(m.f, 1, language)} g`], [t("Ίνες"), `${nf(m.fib, 1, language)} g`], [t("Σίδηρος"), `${nf(m.fe, 1, language)} mg`], [t("Ασβέστιο"), `${nf(m.ca, 0, language)} mg`], [t("Αλάτι"), `${nf(saltGrams(m.na), 1, language)} g`]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-surface p-3">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="font-display text-lg font-semibold tabular">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t("Μερίδα αναφοράς:")}{nf(kcalFromMacros(r.base), 0, language)} {t("kcal. Τιμές από USDA FoodData Central, ενέργεια με τους συντελεστές της ΕΕ (4/4/9, ίνες 2).")}</p>
        </section>
      </div>

      <section className="card-soft p-6">
        <h2 className="text-lg font-semibold">{t("Βήματα")}</h2>
        <ol className="mt-4 space-y-3">
          {r.steps.map((st: string, i: number) => (
            <li key={i} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">{i + 1}</span><p className="pt-1">{t(st)}</p></li>
          ))}
        </ol>
      </section>

      {cook !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background p-6 sm:p-12" role="dialog" aria-label={t("Λειτουργία μαγειρέματος")}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t(r.name)} {t("· Βήμα")}{cook + 1} {t("από")}{r.steps.length}</p>
            <Button variant="ghost" size="icon" aria-label={t("Κλείσιμο")} onClick={() => setCook(null)}><X /></Button>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${((cook + 1) / r.steps.length) * 100}%` }} /></div>
          <p className="mx-auto my-auto max-w-3xl text-center font-display text-3xl leading-snug sm:text-5xl">{t(r.steps[cook])}</p>
          <div className="mx-auto flex w-full max-w-md gap-3">
            <Button size="lg" variant="outline" className="h-14 flex-1 rounded-full" disabled={cook === 0} onClick={() => setCook(cook - 1)}>{t("Πίσω")}</Button>
            {cook < r.steps.length - 1
              ? <Button size="lg" className="h-14 flex-[2] rounded-full text-base" onClick={() => setCook(cook + 1)}>{t("Επόμενο βήμα")}</Button>
              : <Button size="lg" className="h-14 flex-[2] rounded-full text-base" onClick={() => setCook(null)}>{t("Καλή όρεξη!")}</Button>}
          </div>
        </div>
      )}
    </div>
  );
}
