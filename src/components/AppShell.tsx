import { Link, useRouterState } from '@tanstack/react-router';
import { BookOpen, CalendarDays, ChefHat, Dumbbell, ExternalLink, Languages, LineChart, Menu, ShoppingBasket, Sun, Users, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { setState, useStore, useSaveStatus } from '@/lib/store';
import logo from '@/assets/zenith-logo-leaf.png';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { memberProgress } from '@/lib/family-progress';
import { useToday } from '@/lib/useToday';

const NAV = [
  { to: '/', label: 'Σήμερα', hint: ['Γεύματα & νερό της μέρας', 'Today’s meals & water'], icon: Sun, group: 0 },
  { to: '/training', label: 'Προπόνηση', hint: ['Συνεδρία & βίντεο', 'Session & videos'], icon: Dumbbell, group: 0 },
  { to: '/progress', label: 'Πρόοδος', hint: ['Γρήγορη καταγραφή & τάσεις', 'Quick check-in & trends'], icon: LineChart, group: 0 },
  { to: '/meals', label: 'Συνταγές', hint: ['40 συνταγές', '40 recipes'], icon: ChefHat, group: 1 },
  { to: '/plan', label: 'Πρόγραμμα', hint: ['Η εβδομάδα σας', 'Your week'], icon: CalendarDays, group: 1 },
  { to: '/shopping', label: 'Ψώνια', hint: ['Λίστα εβδομάδας', 'Weekly list'], icon: ShoppingBasket, group: 1 },
  { to: '/family', label: 'Οικογένεια', hint: ['Προφίλ & αντίγραφο', 'Profiles & backup'], icon: Users, group: 2 },
  { to: '/guide', label: 'Οδηγός', hint: ['Ασφάλεια & πηγές', 'Safety & sources'], icon: BookOpen, group: 2 },
] as const;
const GROUPS = [['Κάθε μέρα', 'Every day'], ['Μαγείρεμα & οργάνωση', 'Cook & plan'], ['Οικογένεια', 'Family']] as const;

const SIBLING_APPS = [
  { href: 'https://food-scan.gearuptofit.com/', host: 'food-scan.gearuptofit.com', name: 'Food Scan', tint: 'bg-olive/10 text-olive' },
  { href: 'https://daily-table.gearuptofit.com/', host: 'daily-table.gearuptofit.com', name: 'Daily Table', tint: 'bg-terracotta/10 text-terracotta' },
  { href: 'https://alex-679.pages.dev/', host: 'alex-679.pages.dev', name: 'Portfolio', tint: 'bg-aegean/10 text-aegean' },
] as const;

export function AppFooter() {
  const { pick } = useI18n();
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => { setYear(new Date().getFullYear()); }, []);
  return <footer className="mt-14 border-t pt-8">
    <div className="grid gap-4 sm:grid-cols-3">
      {SIBLING_APPS.map(({href, host, name, tint}) => <a key={host} href={href} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-ring">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', tint)} aria-hidden><ExternalLink className="size-[18px]" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-tight">{name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{host}</span>
        </span>
        <span className="text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{pick('Άνοιγμα','Open')}</span>
      </a>)}
    </div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-4 text-xs text-muted-foreground">
      <p className="flex flex-wrap items-center gap-2"><img src={logo} width={1024} height={1024} alt="" className="size-5 object-contain" /><span className="font-semibold text-foreground">Zenith<span className="text-primary">.</span></span><span>{pick('Οικογενειακή διατροφή & προπόνηση','Family nutrition & training')}{year ? ` · © ${year}` : ''}</span></p>
      <p>{pick('Μόνο στη συσκευή σου · USDA · EFSA · WHO · AAP','Only on your device · USDA · EFSA · WHO · AAP')}</p>
    </div>
  </footer>;
}

export function LanguageSwitch() {
  const { language, pick } = useI18n();
  const loading = useSaveStatus() === 'loading';
  return <div className="inline-flex items-center gap-1 rounded-md border bg-card p-1" role="group" aria-label={pick('Γλώσσα','Language')}><Languages className="mx-1 size-4 text-muted-foreground" />{(['el','en'] as const).map(lang => <Button disabled={loading} key={lang} size="sm" variant={language === lang ? 'default' : 'ghost'} aria-pressed={language === lang} onClick={() => setState(s => ({ ...s, language: lang }))}>{lang === 'el' ? 'ΕΛ' : 'EN'}</Button>)}</div>;
}

export function MemberSwitcher({ compact = false }: { compact?: boolean }) {
  const state = useStore(s => s);
  const activeId = state.activeId;
  const today = useToday();
  const { t, pick } = useI18n();
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t('Μέλος οικογένειας')}>
    {state.profiles.map(p => { const pr = memberProgress(state, p.id, today, today); const pct = Math.round(pr.meals / Math.max(1, pr.mealTotal) * 100); const on = p.id === activeId;
      return <button type="button" role="radio" aria-checked={on} key={p.id} onClick={() => setState(s => ({ ...s, activeId: p.id }))} className={cn('group min-h-11 rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-ring', on ? 'border-primary bg-primary/5 shadow-soft' : 'border-border bg-card')}>
        <span className="flex items-center gap-2"><span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold', on ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>{p.name.charAt(0)}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.name}</span>{!compact && <span className="block truncate text-[11px] text-muted-foreground">{t(p.relation)}</span>}</span><span className="tabular text-xs font-semibold text-primary">{pct}%</span></span>
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden><span className="block h-full rounded-full bg-gradient-to-r from-success to-sun transition-all duration-700" style={{ width: `${pct}%` }} /></span>
        <span className="mt-1.5 block text-[11px] text-muted-foreground">{pr.meals}/{pr.mealTotal} {pick('γεύματα σήμερα','meals today')}{pr.sessions > 0 && ` · ${pr.sessions} ${pick('προπόνηση','workout')}`}</span>
      </button>; })}
  </div>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: s => s.location.pathname });
  const { t, pick, language } = useI18n();
  const [more, setMore] = useState(false);
  const saved = useSaveStatus();
  const savedLabel = saved === 'saved' ? pick('Αποθηκεύτηκε στη συσκευή','Saved on this device') : saved === 'saving' || saved === 'loading' ? pick('Αποθήκευση…','Saving…') : saved === 'fallback' ? pick('Εφεδρική αποθήκευση · κράτα αντίγραφο','Backup storage · export a copy') : pick('Δεν αποθηκεύτηκε · κράτα αντίγραφο','Not saved · export a copy');
  const isActive = (to: string) => to === '/' ? path === '/' : path.startsWith(to);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => { setMore(false); }, [path]);
  return <div className="min-h-screen lg:pl-60">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar px-4 py-7 text-sidebar-foreground lg:flex">
      <Link to="/" className="mb-8 flex items-center gap-3 px-3"><img src={logo} width={1024} height={1024} alt="Zenith" className="size-12 object-contain" /><span><span className="block text-2xl font-semibold">Zenith<span className="text-sidebar-primary">.</span></span><span className="text-xs text-sidebar-foreground/65">{pick('Οικογενειακή ευεξία','Family wellbeing')}</span></span></Link>
      {GROUPS.map(([gel, gen], g) => <div key={gen} className={cn(g > 0 && 'mt-5 border-t border-sidebar-border pt-4')}><p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/50">{pick(gel, gen)}</p>
      <nav className="flex flex-col gap-0.5" aria-label={pick(gel, gen)}>{NAV.filter(n => n.group === g).map(({to,label,hint,icon:Icon}) => <Link key={to} to={to} aria-current={isActive(to) ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',isActive(to) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50')}><Icon className={cn('size-[18px] shrink-0',isActive(to)&&'text-sidebar-primary')} /><span className="min-w-0"><span className={cn('block leading-tight', isActive(to) && 'font-semibold')}>{t(label)}</span><span className="block truncate text-[11px] leading-tight text-sidebar-foreground/55">{pick(hint[0], hint[1])}</span></span></Link>)}</nav></div>)}
      <nav className="mt-auto border-t border-sidebar-border pt-4" aria-label={pick('Άλλες εφαρμογές','Other apps')}>{SIBLING_APPS.map(({href, host, name}) => <a key={host} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"><ExternalLink className="size-3.5 shrink-0 text-sidebar-primary" /><span className="min-w-0 truncate">{name}</span></a>)}</nav>
      <p className="px-3 pt-4 text-xs leading-relaxed text-sidebar-foreground/60">{pick('Μόνο στη συσκευή σου. Χωρίς λογαριασμό.','Only on your device. No account required.')}<br />USDA · EFSA · WHO · AAP</p>
    </aside>
    <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-8 lg:pb-12"><div className="mb-6 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b py-4"><Link to="/" className="flex items-center gap-2 text-xl font-semibold lg:hidden"><img src={logo} width={1024} height={1024} alt="" className="size-9 object-contain" />Zenith.</Link><p role="status" className={cn('text-xs', saved === 'error' ? 'text-destructive' : 'text-muted-foreground')}>{savedLabel}</p><LanguageSwitch /></div>{children}<AppFooter /></main>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label={pick('Καθημερινή πλοήγηση','Daily navigation')}><div className="grid grid-cols-5">{NAV.slice(0,4).map(({to,label,icon:Icon}) => <Link key={to} to={to} className={cn('flex min-h-16 flex-col items-center justify-center gap-1 text-[11px]',isActive(to) ? 'font-semibold text-primary' : 'text-muted-foreground')}><span className={cn('grid h-7 w-12 place-items-center rounded-full transition-colors',isActive(to) && 'bg-primary/10')}><Icon className="size-5" /></span>{t(label)}</Link>)}<Button variant="ghost" className="flex h-16 flex-col gap-1 rounded-none px-1 text-[11px]" onClick={() => setMore(x => !x)} aria-expanded={more} aria-label={t('Περισσότερα')}>{more ? <X className="size-5" /> : <Menu className="size-5" />}{t('Περισσότερα')}</Button></div></nav>
    {more && <div className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setMore(false)} aria-hidden />}{more && <div className="fixed inset-x-0 bottom-16 z-40 animate-rise rounded-t-xl border-t bg-card p-4 shadow-lift lg:hidden"><h2 className="mb-3 text-sm font-semibold">{pick('Μαγείρεμα, οργάνωση & οικογένεια','Cook, plan & family')}</h2><div className="grid grid-cols-2 gap-2">{NAV.slice(4).map(({to,label,hint,icon:Icon}) => <Link key={to} to={to} aria-current={isActive(to) ? 'page' : undefined} className={cn('flex min-h-14 items-center gap-3 rounded-lg border p-3 text-left', isActive(to) ? 'border-primary bg-primary/10' : 'bg-card')}><Icon className="size-5 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-sm font-medium leading-tight">{t(label)}</span><span className="block truncate text-[11px] text-muted-foreground">{pick(hint[0], hint[1])}</span></span></Link>)}</div></div>}
  </div>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  const { t } = useI18n();
  return <header className="mb-6 animate-rise"><div className="flex flex-wrap items-end justify-between gap-4"><div>{eyebrow&&<p className="mb-2 text-xs font-medium uppercase text-terracotta">{t(eyebrow)}</p>}<h1 className="text-3xl font-semibold sm:text-4xl">{t(title)}</h1></div>{children}</div></header>;
}