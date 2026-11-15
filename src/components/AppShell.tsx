import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, CalendarDays, ChefHat, LineChart, ShoppingBasket, Sun, Users } from "lucide-react";
import type { ReactNode } from "react";
import { setState, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Σήμερα", icon: Sun },
  { to: "/plan", label: "Πρόγραμμα", icon: CalendarDays },
  { to: "/meals", label: "Συνταγές", icon: ChefHat },
  { to: "/shopping", label: "Ψώνια", icon: ShoppingBasket },
  { to: "/progress", label: "Πρόοδος", icon: LineChart },
  { to: "/family", label: "Οικογένεια", icon: Users },
  { to: "/guide", label: "Οδηγός", icon: BookOpen },
] as const;

export function MemberSwitcher({ compact = false }: { compact?: boolean }) {
  const profiles = useStore((s) => s.profiles);
  const activeId = useStore((s) => s.activeId);
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Μέλος οικογένειας">
      {profiles.map((p) => {
        const on = p.id === activeId;
        return (
          <button
            key={p.id}
            role="radio"
            aria-checked={on}
            onClick={() => setState((s) => ({ ...s, activeId: p.id }))}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition-all",
              on ? "border-foreground/20 bg-card shadow-lift" : "border-transparent bg-muted/70 text-muted-foreground hover:bg-muted",
            )}
          >
            <span
              className="grid size-8 place-items-center rounded-full font-display text-sm font-semibold text-primary-foreground"
              style={{ background: p.accent }}
            >
              {p.name.charAt(0)}
            </span>
            <span className={cn("font-medium", on && "text-foreground")}>{p.name}</span>
            {!compact && <span className="hidden text-xs text-muted-foreground lg:inline">{p.relation}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar p-5 text-sidebar-foreground lg:flex">
        <Link to="/" className="mb-10 flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-sidebar-primary font-display text-lg font-bold text-sidebar-primary-foreground">Ζ</span>
          <span>
            <span className="block font-display text-lg font-semibold leading-tight">Zenith</span>
            <span className="block text-xs text-sidebar-foreground/60">Οικογενειακή διατροφή</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
                isActive(to) ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className={cn("size-[18px]", isActive(to) && "text-sidebar-primary")} />
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto px-2 text-xs leading-relaxed text-sidebar-foreground/50">
          Τα δεδομένα μένουν μόνο σε αυτή τη συσκευή. Αριθμοί από USDA FoodData Central & EFSA.
        </p>
      </aside>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-8 lg:pb-12 lg:pt-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl justify-between px-2 py-1.5">
          {NAV.slice(0, 5).map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={cn("flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px]", isActive(to) ? "text-primary" : "text-muted-foreground")}>
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
          <Link to="/family" className={cn("flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px]", isActive("/family") || isActive("/guide") ? "text-primary" : "text-muted-foreground")}>
            <Users className="size-5" />
            Άλλα
          </Link>
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow && <p className="text-sm font-medium uppercase tracking-[0.14em] text-terracotta">{eyebrow}</p>}
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{title}</h1>
        </div>
        {children}
      </div>
    </header>
  );
}
