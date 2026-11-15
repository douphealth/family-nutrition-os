import { useI18n } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { TrendingDown, TrendingUp, Minus as Flat, Trash2 } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MemberSwitcher, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays } from "@/engine/dates";
import { isMinor, weightTrend } from "@/engine/nutrition-engine";
import { greekDate, nf } from "@/lib/format";
import { pageHead } from "@/lib/head";
import { setState, todayKey, useStore, type DayLog } from "@/lib/store";
import { useActive } from "@/lib/useActive";
import { cn } from "@/lib/utils";
import { FamilyProgress } from '@/components/FamilyProgress';

export const Route = createFileRoute("/progress")({
  head: () => pageHead("Πρόοδος οικογένειας · Family progress", "Completed meals and training for each family member, with recorded minutes and personal weight trends."),
  component: Progress,
});

const NO_MS: { date: string; weight: number }[] = [];
const NO_LOGS: Record<string, DayLog> = {};

function Progress() {
  const { t, pick, language } = useI18n();
  const { profile } = useActive();
  const ms = useStore((s) => s.measurements[s.activeId] ?? NO_MS);
  const logs = useStore((s) => s.logs[s.activeId] ?? NO_LOGS);
  const [w, setW] = useState("");
  const [date, setDate] = useState(todayKey());
  const tr = weightTrend(ms);
  const today = todayKey();
  const cal = Array.from({ length: 28 }, (_, i) => addDays(today, i - 27));
  const minor = isMinor(profile);

  const add = () => {
    const n = Number(w.replace(",", "."));
    if (!(n > 20 && n < 300)) return;
    setState((s) => ({ ...s, measurements: { ...s.measurements, [profile.id]: [...(s.measurements[profile.id] ?? []).filter((m) => m.date !== date), { date, weight: n }] } }));
    setW("");
  };
  const remove = (d: string) => setState((s) => ({ ...s, measurements: { ...s.measurements, [profile.id]: (s.measurements[profile.id] ?? []).filter((m) => m.date !== d) } }));
  const TrendIcon = tr.direction === "down" ? TrendingDown : tr.direction === "up" ? TrendingUp : Flat;

  return (
    <>
      <PageHeader eyebrow={t("Τάση, όχι μία μέρα")} title={t("Πρόοδος")} />
      <FamilyProgress />
      <div className="mb-6"><MemberSwitcher /></div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="card-soft p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{t("Βάρος")}</h2>
              <p className="text-sm text-muted-foreground">{t("Μία ζύγιση είναι θόρυβος· η κλίση είναι το σήμα.")}</p>
            </div>
            {tr.slopePerWeek != null && (
              <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-2">
                <TrendIcon className="size-5" style={{ color: profile.accent }} />
                <div><p className="font-display text-xl font-semibold tabular">{tr.slopePerWeek > 0 ? "+" : ""}{nf(tr.slopePerWeek, 2, language)} kg</p><p className="text-xs text-muted-foreground">{t("ανά εβδομάδα")}</p></div>
              </div>
            )}
          </div>
          <div className="mt-4 h-64">
            {tr.count >= 2 ? (
              <ResponsiveContainer>
                <LineChart data={tr.points.map((p: any) => ({ ...p, label: greekDate(p.date, { day: "numeric", month: "short" }, language) }))}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} formatter={(v: number) => [`${nf(v, 1, language)} kg`, t("Βάρος")]} />
                  <Line type="monotone" dataKey="weight" stroke={profile.accent} strokeWidth={3} dot={{ r: 4, fill: profile.accent }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-2xl border-2 border-dashed text-center text-sm text-muted-foreground">
                <p>{t("Πρόσθεσε τουλάχιστον δύο ζυγίσεις")}<br />{t("για να εμφανιστεί η τάση.")}</p>
              </div>
            )}
          </div>
          {minor && <p className="mt-3 rounded-xl bg-accent p-3 text-sm text-accent-foreground">{t("Στους εφήβους το βάρος αυξάνεται φυσιολογικά με την ανάπτυξη — δεν υπάρχει στόχος απώλειας.")}</p>}
        </section>

        <section className="card-soft p-6">
          <h2 className="text-lg font-semibold">{t("Νέα ζύγιση")}</h2>
          <div className="mt-3 flex gap-2">
            <Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl" />
            <Input inputMode="decimal" placeholder="kg" value={w} onChange={(e) => setW(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="h-11 w-24 rounded-xl" />
          </div>
          <Button className="mt-3 w-full rounded-full" size="lg" onClick={add}>{t("Αποθήκευση")}</Button>
          <ul className="mt-4 max-h-56 divide-y overflow-auto">
            {[...tr.points].reverse().map((p: any) => (
              <li key={p.date} className="flex items-center justify-between py-2 text-sm">
                <span className="capitalize">{greekDate(p.date, { weekday: "short", day: "numeric", month: "short" }, language)}</span>
                <span className="flex items-center gap-2 font-semibold tabular">{nf(p.weight, 1, language)} kg
                  <Button variant="ghost" size="icon" className="size-7" aria-label={t("Διαγραφή")} onClick={() => remove(p.date)}><Trash2 className="size-3.5" /></Button></span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card-soft mt-6 p-6">
        <h2 className="text-lg font-semibold">{t("Ημερολόγιο καταγραφής · 28 ημέρες")}</h2>
        <p className="text-sm text-muted-foreground">{t("Πόσα από τα 4 γεύματα καταγράφηκαν κάθε μέρα.")}</p>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {cal.map((d) => {
            const n = Object.values(logs[d]?.meals ?? {}).filter((m) => m.status === "done").length;
            return (
              <div key={d} title={`${greekDate(d, undefined, language)} · ${n}/4`} className={cn("grid aspect-square place-items-center rounded-xl text-xs tabular", d === today && "ring-2 ring-primary")}
                style={{ background: n ? `color-mix(in oklab, ${profile.accent} ${20 + n * 20}%, transparent)` : "var(--muted)" }}>
                <span className={cn(n >= 3 ? "text-primary-foreground" : "text-muted-foreground")}>{Number(d.slice(8))}</span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
