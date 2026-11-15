import { Link, useRouterState } from '@tanstack/react-router';
import { BookOpen, CalendarDays, ChefHat, Dumbbell, Languages, LineChart, Menu, ShoppingBasket, Sun, Users, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { setState, useStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Σήμερα', icon: Sun },
  { to: '/plan', label: 'Πρόγραμμα', icon: CalendarDays },
  { to: '/meals', label: 'Συνταγές', icon: ChefHat },
  { to: '/training', label: 'Προπόνηση', icon: Dumbbell },
  { to: '/shopping', label: 'Ψώνια', icon: ShoppingBasket },
  { to: '/progress', label: 'Πρόοδος', icon: LineChart },
  { to: '/family', label: 'Οικογένεια', icon: Users },
  { to: '/guide', label: 'Οδηγός', icon: BookOpen },
] as const;

export function LanguageSwitch() {
  const { language, pick } = useI18n();
  return <div className="inline-flex items-center gap-1 rounded-md border bg-card p-1" role="group" aria-label={pick('Γλώσσα','Language')}><Languages className="mx-1 size-4 text-muted-foreground" />{(['el','en'] as const).map(lang => <Button key={lang} size="sm" variant={language === lang ? 'default' : 'ghost'} aria-pressed={language === lang} onClick={() => setState(s => ({ ...s, language: lang }))}>{lang === 'el' ? 'ΕΛ' : 'EN'}</Button>)}</div>;
}

export function MemberSwitcher({ compact = false }: { compact?: boolean }) {
  const profiles = useStore(s => s.profiles);
  const activeId = useStore(s => s.activeId);
  const { t, pick } = useI18n();
  return <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="radiogroup" aria-label={t('Μέλος οικογένειας')}>
    {profiles.map(p => <Button variant="outline" role="radio" aria-checked={p.id === activeId} key={p.id} onClick={() => setState(s => ({ ...s, activeId: p.id }))} className={cn('h-auto min-h-11 justify-start gap-2 rounded-lg px-2 py-2 sm:pr-4',p.id === activeId ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/60')}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{p.name.charAt(0)}</span><span className="min-w-0 text-left"><span className="block truncate text-sm">{p.name}</span>{!compact && <span className="block text-[10px] font-normal text-muted-foreground">{t(p.relation)}</span>}</span></Button>)}
  </div>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: s => s.location.pathname });
  const { t, pick, language } = useI18n();
  const [more, setMore] = useState(false);
  const isActive = (to: string) => to === '/' ? path === '/' : path.startsWith(to);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => { setMore(false); }, [path]);
  return <div className="min-h-screen lg:pl-60">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar px-4 py-7 text-sidebar-foreground lg:flex">
      <Link to="/" className="mb-8 px-3"><span className="block text-2xl font-semibold">Zenith<span className="text-sidebar-primary">.</span></span><span className="text-xs text-sidebar-foreground/65">{pick('Οικογενειακή ευεξία','Family wellbeing')}</span></Link>
      <p className="mb-2 px-3 text-[10px] uppercase text-sidebar-foreground/50">{pick('Κάθε μέρα','Every day')}</p>
      <nav className="flex flex-col gap-1" aria-label={pick('Κύρια πλοήγηση','Main navigation')}>{NAV.map(({to,label,icon:Icon},i) => <Link key={to} to={to} aria-current={isActive(to) ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors',isActive(to) ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50',i===5 && 'mt-5 border-t pt-5')}><Icon className={cn('size-[18px]',isActive(to)&&'text-sidebar-primary')} />{t(label)}</Link>)}</nav>
      <p className="mt-auto px-3 pt-8 text-xs leading-relaxed text-sidebar-foreground/60">{pick('Μόνο στη συσκευή σου. Χωρίς λογαριασμό.','Only on your device. No account required.')}<br />USDA · EFSA · WHO · AAP</p>
    </aside>
    <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-8 lg:pb-12"><div className="mb-6 flex min-h-20 items-center justify-between gap-3 border-b py-4"><Link to="/" className="text-xl font-semibold lg:hidden">Zenith.</Link><p className="hidden text-sm text-muted-foreground lg:block">{pick('Το δικό σου πλάνο. Η δική σου μέρα.','Your plan. Your day.')}</p><LanguageSwitch /></div>{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label={pick('Καθημερινή πλοήγηση','Daily navigation')}><div className="grid grid-cols-5">{[NAV[0],NAV[1],NAV[2],NAV[3]].map(({to,label,icon:Icon}) => <Link key={to} to={to} className={cn('flex min-h-16 flex-col items-center justify-center gap-1 text-[11px]',isActive(to) ? 'font-semibold text-primary' : 'text-muted-foreground')}><Icon className="size-5" />{t(label)}</Link>)}<Button variant="ghost" className="flex h-16 flex-col gap-1 rounded-none px-1 text-[11px]" onClick={() => setMore(x => !x)} aria-expanded={more} aria-label={t('Περισσότερα')}>{more ? <X className="size-5" /> : <Menu className="size-5" />}{t('Περισσότερα')}</Button></div></nav>
    {more && <div className="fixed inset-x-0 bottom-16 z-40 border-y bg-card p-4 shadow-lift lg:hidden"><h2 className="mb-3 text-sm font-semibold">{pick('Οικογένεια & οργάνωση','Family & organization')}</h2><div className="grid grid-cols-2 gap-2">{NAV.slice(4).map(({to,label,icon:Icon}) => <Button asChild variant="outline" key={to} className="h-12 justify-start"><Link to={to}><Icon />{t(label)}</Link></Button>)}</div></div>}
  </div>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  const { t } = useI18n();
  return <header className="mb-6 animate-rise"><div className="flex flex-wrap items-end justify-between gap-4"><div>{eyebrow&&<p className="mb-2 text-xs font-medium uppercase text-terracotta">{t(eyebrow)}</p>}<h1 className="text-3xl font-semibold sm:text-4xl">{t(title)}</h1></div>{children}</div></header>;
}