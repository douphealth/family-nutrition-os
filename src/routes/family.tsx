import { useI18n } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GOALS } from "@/engine/data";
import { adultBmiLabel, bmi, canUseAdultBmi, isMinor, targetsFor } from "@/engine/nutrition-engine";
import { nf } from "@/lib/format";
import { pageHead } from "@/lib/head";
import { loadOf, setState, useStore, withPlate, type Profile } from "@/lib/store";

export const Route = createFileRoute("/family")({
  head: () => pageHead("Οικογένεια", "Τα προφίλ της οικογένειας με στόχους ενέργειας, πρωτεΐνης και νερού."),
  component: Family,
});

function Family() {
  const { t: tr, pick, language } = useI18n();
  const s = useStore((x) => x);
  const file = useRef<HTMLInputElement>(null);
  const edit = (id: string, patch: Partial<Profile>) => setState((x) => ({ ...x, profiles: x.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `zenith-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  const importJson = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.profiles)) throw new Error();
      setState(() => data);
      toast.success(tr("Το αντίγραφο επαναφέρθηκε"));
    } catch { toast.error(tr("Το αρχείο δεν είναι έγκυρο αντίγραφο")); }
  };

  return (
    <>
      <PageHeader eyebrow={tr(`${s.profiles.length} μέλη`)} title={tr("Η οικογένεια")}>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={exportJson}><Download /> {tr("Αντίγραφο ασφαλείας")}</Button>
          <Button variant="ghost" className="rounded-full" onClick={() => file.current?.click()}><Upload /> {tr("Επαναφορά")}</Button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </div>
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2">
        {s.profiles.map((raw) => {
          const p = withPlate(raw, loadOf(s, raw.id));
          const t = targetsFor(p, loadOf(s, p.id));
          const minor = isMinor(p);
          return (
            <article key={p.id} className="card-soft overflow-hidden">
              <div className="flex items-center gap-4 p-6" style={{ background: `color-mix(in oklab, ${p.accent} 12%, transparent)` }}>
                <span className="grid size-14 place-items-center rounded-2xl font-display text-2xl font-semibold text-primary-foreground" style={{ background: p.accent }}>{p.name.charAt(0)}</span>
                <div className="min-w-0 flex-1">
                  <Input value={p.name} onChange={(e) => edit(p.id, { name: e.target.value })} className="h-9 border-transparent bg-transparent px-1 font-display text-xl font-semibold shadow-none hover:border-border" aria-label={tr("Όνομα")} />
                  <p className="px-1 text-sm text-muted-foreground">{tr(p.relation)} · {tr(p.role)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 p-6 pb-0">
                <Stat label={tr("Ενέργεια")} value={`${nf(t.energy.lower, 0, language)}–${nf(t.energy.upper, 0, language)}`} unit="kcal" />
                <Stat label={tr("Πρωτεΐνη")} value={`${t.protein.min}–${t.protein.max}`} unit="g" />
                <Stat label={tr("Νερό")} value={nf(t.hydration.ml / 1000, 1, language)} unit={tr("L ροφήματα")} />
              </div>
              <div className="grid grid-cols-3 gap-3 p-6">
                <Field label={tr("Ηλικία")} value={p.age} onChange={(v) => edit(p.id, { age: v })} />
                <Field label={tr("Ύψος (cm)")} value={p.height} onChange={(v) => edit(p.id, { height: v })} />
                <Field label={tr("Βάρος (kg)")} value={p.weight} onChange={(v) => edit(p.id, { weight: v })} />
                <label className="col-span-3 text-sm">
                  <span className="mb-1 block text-muted-foreground">{tr("Στόχος")}</span>
                  <select value={p.goal} onChange={(e) => edit(p.id, { goal: e.target.value })} className="h-10 w-full rounded-xl border bg-card px-3">
                    {GOALS.filter(([g]) => !(minor && g === "gradual_fat_loss")).map(([g, l]) => <option key={g} value={g}>{tr(l)}</option>)}
                  </select>
                </label>
              </div>
              <p className="border-t bg-surface/60 px-6 py-3 text-xs text-muted-foreground">
                {canUseAdultBmi(p) ? `BMI ${nf(bmi(p), 1, language)} · ${tr(adultBmiLabel(p))}` : tr("Ανήλικος: χωρίς περιορισμό θερμίδων και χωρίς κατηγορίες BMI ενηλίκων.")} {tr(t.energy.note)}
              </p>
            </article>
          );
        })}
      </div>
    </>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  const { t, pick, language } = useI18n();
  return (
    <div className="rounded-2xl bg-surface p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-semibold leading-tight tabular">{value}</p>
      <p className="text-[11px] text-muted-foreground">{unit}</p>
    </div>
  );
}
function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const { t, pick, language } = useI18n();
  return (
    <label className="text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <Input type="number" value={value} onChange={(e) => { const n = Number(e.target.value); if (n > 0) onChange(n); }} className="h-10 rounded-xl" />
    </label>
  );
}
