import { useI18n } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { AISLES } from "@/engine/data";
import { addDays, mondayOf } from "@/engine/dates";
import { buildShoppingList } from "@/engine/nutrition-engine";
import { nf } from "@/lib/format";
import { pageHead } from "@/lib/head";
import { loadOf, planFor, recipeById, setState, todayKey, useStore, withPlate } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shopping")({
  head: () => pageHead("Ψώνια", "Λίστα για όλη την εβδομάδα, στρογγυλεμένη στις συσκευασίες και ομαδοποιημένη ανά διάδρομο."),
  component: Shopping,
});

const fmtQty = (qty: number, unit: string) =>
  unit === "g" && qty >= 1000 ? `${nf(qty / 1000, 2)} kg` : unit === "ml" && qty >= 1000 ? `${nf(qty / 1000, 2)} L` : `${nf(qty)} ${unit === "τεμ" ? "τεμ." : unit}`;

function Shopping() {
  const { t, pick, language } = useI18n();
  const s = useStore((x) => x);
  const [next, setNext] = useState(false);
  const monday = addDays(mondayOf(todayKey()), next ? 7 : 0);
  const items = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => ({ plan: planFor(addDays(monday, i)) }));
    const profiles = s.profiles.map((p) => withPlate(p, loadOf(s, p.id)));
    return buildShoppingList({ days, profiles, recipeById, loadFor: (p: any) => loadOf(s, p.id) });
  }, [monday, s.profiles, s.loads]);
  const key = (id: string) => `${monday}:${id}`;
  const checked = items.filter((i) => s.shopChecked[key(i.id)]).length;
  const toggle = (id: string) => setState((x) => ({ ...x, shopChecked: { ...x.shopChecked, [key(id)]: !x.shopChecked[key(id)] } }));
  const copy = async () => {
    const text = AISLES.map((a: any) => {
      const list = items.filter((i) => i.aisle === a.id && !s.shopChecked[key(i.id)]);
      return list.length ? `${t(a.label)}\n${list.map((i) => `• ${t(i.name)} — ${t(fmtQty(i.qty, i.unit))}`).join("\n")}` : "";
    }).filter(Boolean).join("\n\n");
    await navigator.clipboard.writeText(text);
    toast.success(t("Η λίστα αντιγράφηκε — στείλ' τη με μήνυμα"));
  };

  return (
    <>
      <PageHeader eyebrow={t(`${checked} από ${items.length} στο καλάθι`)} title={t("Λίστα για ψώνια")}>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-full bg-muted p-1">
            {[false, true].map((n) => (
              <button key={String(n)} onClick={() => setNext(n)} className={cn("rounded-full px-4 py-1.5 text-sm", next === n ? "bg-card font-medium shadow-lift" : "text-muted-foreground")}>{n ? t("Επόμενη εβδομάδα") : t("Αυτή η εβδομάδα")}</button>
            ))}
          </div>
          <Button variant="outline" className="rounded-full" onClick={copy}><Copy /> {t("Αντιγραφή")}</Button>
          <Button variant="ghost" className="rounded-full" onClick={() => setState((x) => ({ ...x, shopChecked: Object.fromEntries(Object.entries(x.shopChecked).filter(([k]) => !k.startsWith(monday))) }))}><RotateCcw /> {t("Καθαρισμός")}</Button>
        </div>
      </PageHeader>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${items.length ? (checked / items.length) * 100 : 0}%` }} /></div>
      <p className="mb-5 text-sm text-muted-foreground">{t("Για 7 ημέρες και")}{s.profiles.length} {t("άτομα, με τη μερίδα του καθενός. Οι ποσότητες στρογγυλεύονται προς τα πάνω στη συσκευασία που αγοράζεις.")}</p>
      <div className="columns-1 gap-5 md:columns-2 xl:columns-3">
        {AISLES.map((a: any) => {
          const list = items.filter((i) => i.aisle === a.id);
          if (!list.length) return null;
          return (
            <section key={a.id} className="card-soft mb-5 break-inside-avoid p-5">
              <h2 className="mb-2 flex justify-between font-semibold"><span>{t(a.label)}</span><span className="text-sm font-normal text-muted-foreground">{list.length}</span></h2>
              <ul>
                {list.map((i) => {
                  const on = !!s.shopChecked[key(i.id)];
                  return (
                    <li key={i.id}>
                      <button onClick={() => toggle(i.id)} className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-muted/60">
                        <span className={cn("grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors", on ? "border-success bg-success text-primary-foreground" : "border-border")}>{on && <Check className="size-3.5" />}</span>
                        <span className={cn("flex-1 text-[15px]", on && "text-muted-foreground line-through")}>{t(i.name)}</span>
                        <span className={cn("tabular text-sm font-semibold", on && "text-muted-foreground")}>{t(fmtQty(i.qty, i.unit))}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
