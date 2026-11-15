import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { GLOSSARY, METHOD, SAFETY, SOURCES } from "@/engine/data";
import { greekDate } from "@/lib/format";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/guide")({
  head: () => pageHead("Οδηγός & πηγές", "Η μέθοδος, κάθε πηγή με την ημερομηνία ελέγχου, οι κανόνες ασφαλείας και γλωσσάρι."),
  component: Guide,
});

function Guide() {
  return (
    <>
      <PageHeader eyebrow="Γιατί να εμπιστευτείς τους αριθμούς" title="Οδηγός & πηγές" />
      <section className="mb-6 rounded-[1.4rem] bg-sidebar p-6 text-sidebar-foreground sm:p-8">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="size-5 text-sidebar-primary" /> Κανόνες ασφαλείας</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{SAFETY.map((s: string) => <li key={s} className="rounded-xl bg-sidebar-accent p-3">{s}</li>)}</ul>
      </section>
      <h2 className="mb-3 text-2xl font-semibold">Η μέθοδος</h2>
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {METHOD.map((m: any) => (
          <article key={m.title} className="card-soft p-5"><h3 className="font-semibold">{m.title}</h3><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.body}</p></article>
        ))}
      </div>
      <h2 className="mb-3 text-2xl font-semibold">Πηγές</h2>
      <div className="mb-8 card-soft divide-y">
        {SOURCES.map((s: any) => (
          <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="flex gap-4 p-4 hover:bg-muted/50">
            <div className="flex-1"><p className="font-medium">{s.label}</p><p className="mt-0.5 text-sm text-muted-foreground">{s.used}</p></div>
            <div className="shrink-0 text-right text-xs text-muted-foreground"><ExternalLink className="ml-auto mb-1 size-4" />ελέγχθηκε<br />{greekDate(s.verified, { day: "numeric", month: "short", year: "numeric" })}</div>
          </a>
        ))}
      </div>
      <h2 className="mb-3 text-2xl font-semibold">Γλωσσάρι</h2>
      <dl className="grid gap-3 md:grid-cols-2">
        {GLOSSARY.map(([t, d]: [string, string]) => (
          <div key={t} className="rounded-2xl bg-surface p-4"><dt className="font-semibold">{t}</dt><dd className="mt-1 text-sm text-muted-foreground">{d}</dd></div>
        ))}
      </dl>
    </>
  );
}
