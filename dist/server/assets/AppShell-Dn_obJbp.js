import { F as SLOTS, H as Button, O as addDays, U as cn, c as todayKey, d as useStore, s as setState, t as useI18n, u as useSaveStatus } from "./i18n-Bg74tMYw.js";
import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { BookOpen, CalendarDays, ChefHat, Dumbbell, ExternalLink, Languages, LineChart, Menu, ShoppingBasket, Sun, Users, X } from "lucide-react";
//#region src/assets/zenith-logo-leaf.png
var zenith_logo_leaf_default = "/family-nutrition-os/assets/zenith-logo-leaf-PEmT_Il3.png";
//#endregion
//#region src/lib/family-progress.ts
function memberProgress(state, memberId, start, end) {
	let meals = 0, completeDays = 0, days = 0;
	for (let date = start; date <= end; date = addDays(date, 1)) {
		days += 1;
		const count = SLOTS.filter((slot) => state.logs[memberId]?.[date]?.meals[slot]?.status === "done").length;
		meals += count;
		if (count === SLOTS.length) completeDays += 1;
	}
	const sessions = Object.values(state.trainingLogs ?? {}).filter((log) => log.memberId === memberId && log.done === true && log.date >= start && log.date <= end && /^(member-session:|supplement-log:|activity-log:)/.test(String(log.id)));
	return {
		meals,
		mealTotal: days * SLOTS.length,
		completeDays,
		sessions: sessions.length,
		completedMinutes: sessions.reduce((sum, log) => sum + Math.max(0, Number(log.completedMinutes) || 0), 0),
		unknownMinutes: sessions.filter((log) => !Number.isFinite(log.completedMinutes)).length
	};
}
/** Local-only aggregates: no identifiers or personal details leave the device. */
function familyRoutines(state, end, days) {
	const start = addDays(end, 1 - days);
	const previousEnd = addDays(start, -1);
	const previousStart = addDays(start, -days);
	const daily = Array.from({ length: days }, (_, i) => {
		const date = addDays(start, i);
		const members = state.profiles.map((p) => memberProgress(state, p.id, date, date));
		return {
			date,
			meals: members.reduce((sum, p) => sum + p.meals, 0),
			mealTotal: members.reduce((sum, p) => sum + p.mealTotal, 0),
			sessions: members.reduce((sum, p) => sum + p.sessions, 0)
		};
	});
	const current = state.profiles.map((p) => memberProgress(state, p.id, start, end));
	const previous = state.profiles.map((p) => memberProgress(state, p.id, previousStart, previousEnd));
	return {
		start,
		end,
		daily,
		meals: current.reduce((sum, p) => sum + p.meals, 0),
		mealTotal: current.reduce((sum, p) => sum + p.mealTotal, 0),
		previousMeals: previous.reduce((sum, p) => sum + p.meals, 0),
		sessions: current.reduce((sum, p) => sum + p.sessions, 0),
		previousSessions: previous.reduce((sum, p) => sum + p.sessions, 0),
		completedMinutes: current.reduce((sum, p) => sum + p.completedMinutes, 0),
		unknownMinutes: current.reduce((sum, p) => sum + p.unknownMinutes, 0),
		slots: SLOTS.map((slot) => ({
			slot,
			completed: daily.reduce((sum, day) => sum + state.profiles.filter((p) => state.logs[p.id]?.[day.date]?.meals[slot]?.status === "done").length, 0),
			total: days * state.profiles.length
		}))
	};
}
var ACTIVITY_KINDS = [
	"team",
	"walk",
	"strength",
	"mobility",
	"sport"
];
/** A member-reported completed activity; minutes are what the member actually did, never a plan. */
function activityLog(memberId, date, kind, minutes, stamp) {
	const m = Math.round(Number(minutes));
	if (!Number.isFinite(m) || m < 1 || m > 240 || !ACTIVITY_KINDS.includes(kind)) return null;
	return {
		id: `activity-log:${memberId}:${date}:${stamp}`,
		memberId,
		date,
		kind,
		done: true,
		completedMinutes: m
	};
}
//#endregion
//#region src/lib/useToday.ts
/** Date-sensitive pages render after hydration; never publish a stale prerendered day. */
function useToday() {
	const [date, setDate] = useState(todayKey);
	useEffect(() => {
		const timer = window.setInterval(() => setDate(todayKey()), 6e4);
		return () => window.clearInterval(timer);
	}, []);
	return date;
}
//#endregion
//#region src/components/AppShell.tsx
var NAV = [
	{
		to: "/",
		label: "Σήμερα",
		hint: ["Γεύματα & νερό της μέρας", "Today’s meals & water"],
		icon: Sun,
		group: 0
	},
	{
		to: "/training",
		label: "Προπόνηση",
		hint: ["Συνεδρία & βίντεο", "Session & videos"],
		icon: Dumbbell,
		group: 0
	},
	{
		to: "/progress",
		label: "Πρόοδος",
		hint: ["Γρήγορη καταγραφή & τάσεις", "Quick check-in & trends"],
		icon: LineChart,
		group: 0
	},
	{
		to: "/meals",
		label: "Συνταγές",
		hint: ["40 συνταγές", "40 recipes"],
		icon: ChefHat,
		group: 1
	},
	{
		to: "/plan",
		label: "Πρόγραμμα",
		hint: ["Η εβδομάδα σας", "Your week"],
		icon: CalendarDays,
		group: 1
	},
	{
		to: "/shopping",
		label: "Ψώνια",
		hint: ["Λίστα εβδομάδας", "Weekly list"],
		icon: ShoppingBasket,
		group: 1
	},
	{
		to: "/family",
		label: "Οικογένεια",
		hint: ["Προφίλ & αντίγραφο", "Profiles & backup"],
		icon: Users,
		group: 2
	},
	{
		to: "/guide",
		label: "Οδηγός",
		hint: ["Ασφάλεια & πηγές", "Safety & sources"],
		icon: BookOpen,
		group: 2
	}
];
var GROUPS = [
	["Κάθε μέρα", "Every day"],
	["Μαγείρεμα & οργάνωση", "Cook & plan"],
	["Οικογένεια", "Family"]
];
var SIBLING_APPS = [
	{
		href: "https://food-scan.gearuptofit.com/",
		host: "food-scan.gearuptofit.com",
		name: "Food Scan",
		tint: "bg-olive/10 text-olive"
	},
	{
		href: "https://daily-table.gearuptofit.com/",
		host: "daily-table.gearuptofit.com",
		name: "Daily Table",
		tint: "bg-terracotta/10 text-terracotta"
	},
	{
		href: "https://alex-679.pages.dev/",
		host: "alex-679.pages.dev",
		name: "Portfolio",
		tint: "bg-aegean/10 text-aegean"
	}
];
function AppFooter() {
	const { pick } = useI18n();
	const [year, setYear] = useState(null);
	useEffect(() => {
		setYear((/* @__PURE__ */ new Date()).getFullYear());
	}, []);
	return /* @__PURE__ */ jsxs("footer", {
		className: "mt-14 border-t pt-8",
		children: [/* @__PURE__ */ jsx("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: SIBLING_APPS.map(({ href, host, name, tint }) => /* @__PURE__ */ jsxs("a", {
				href,
				target: "_blank",
				rel: "noopener noreferrer",
				className: "group flex items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-ring",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: cn("grid size-10 shrink-0 place-items-center rounded-full", tint),
						"aria-hidden": true,
						children: /* @__PURE__ */ jsx(ExternalLink, { className: "size-[18px]" })
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ jsx("span", {
							className: "block text-sm font-semibold leading-tight",
							children: name
						}), /* @__PURE__ */ jsx("span", {
							className: "block truncate text-[11px] text-muted-foreground",
							children: host
						})]
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
						children: pick("Άνοιγμα", "Open")
					})
				]
			}, host))
		}), /* @__PURE__ */ jsxs("div", {
			className: "mt-6 flex flex-wrap items-center justify-between gap-3 pb-4 text-xs text-muted-foreground",
			children: [/* @__PURE__ */ jsxs("p", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ jsx("img", {
						src: zenith_logo_leaf_default,
						width: 1024,
						height: 1024,
						alt: "",
						className: "size-5 object-contain"
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "font-semibold text-foreground",
						children: ["Zenith", /* @__PURE__ */ jsx("span", {
							className: "text-primary",
							children: "."
						})]
					}),
					/* @__PURE__ */ jsxs("span", { children: [pick("Οικογενειακή διατροφή & προπόνηση", "Family nutrition & training"), year ? ` · © ${year}` : ""] })
				]
			}), /* @__PURE__ */ jsx("p", { children: pick("Μόνο στη συσκευή σου · USDA · EFSA · WHO · AAP", "Only on your device · USDA · EFSA · WHO · AAP") })]
		})]
	});
}
function LanguageSwitch() {
	const { language, pick } = useI18n();
	const loading = useSaveStatus() === "loading";
	return /* @__PURE__ */ jsxs("div", {
		className: "inline-flex items-center gap-1 rounded-md border bg-card p-1",
		role: "group",
		"aria-label": pick("Γλώσσα", "Language"),
		children: [/* @__PURE__ */ jsx(Languages, { className: "mx-1 size-4 text-muted-foreground" }), ["el", "en"].map((lang) => /* @__PURE__ */ jsx(Button, {
			disabled: loading,
			size: "sm",
			variant: language === lang ? "default" : "ghost",
			"aria-pressed": language === lang,
			onClick: () => setState((s) => ({
				...s,
				language: lang
			})),
			children: lang === "el" ? "ΕΛ" : "EN"
		}, lang))]
	});
}
function MemberSwitcher({ compact = false }) {
	const state = useStore((s) => s);
	const activeId = state.activeId;
	const today = useToday();
	const { t, pick } = useI18n();
	return /* @__PURE__ */ jsx("div", {
		className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
		role: "radiogroup",
		"aria-label": t("Μέλος οικογένειας"),
		children: state.profiles.map((p) => {
			const pr = memberProgress(state, p.id, today, today);
			const pct = Math.round(pr.meals / Math.max(1, pr.mealTotal) * 100);
			const on = p.id === activeId;
			return /* @__PURE__ */ jsxs("button", {
				type: "button",
				role: "radio",
				"aria-checked": on,
				onClick: () => setState((s) => ({
					...s,
					activeId: p.id
				})),
				className: cn("group min-h-11 rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-ring", on ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card"),
				children: [
					/* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold", on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"),
								children: p.name.charAt(0)
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ jsx("span", {
									className: "block truncate text-sm font-semibold",
									children: p.name
								}), !compact && /* @__PURE__ */ jsx("span", {
									className: "block truncate text-[11px] text-muted-foreground",
									children: t(p.relation)
								})]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "tabular text-xs font-semibold text-primary",
								children: [pct, "%"]
							})
						]
					}),
					/* @__PURE__ */ jsx("span", {
						className: "mt-2 block h-1.5 overflow-hidden rounded-full bg-muted",
						"aria-hidden": true,
						children: /* @__PURE__ */ jsx("span", {
							className: "block h-full rounded-full bg-gradient-to-r from-success to-sun transition-all duration-700",
							style: { width: `${pct}%` }
						})
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "mt-1.5 block text-[11px] text-muted-foreground",
						children: [
							pr.meals,
							"/",
							pr.mealTotal,
							" ",
							pick("γεύματα σήμερα", "meals today"),
							pr.sessions > 0 && ` · ${pr.sessions} ${pick("προπόνηση", "workout")}`
						]
					})
				]
			}, p.id);
		})
	});
}
function AppShell({ children }) {
	const path = useRouterState({ select: (s) => s.location.pathname });
	const { t, pick, language } = useI18n();
	const [more, setMore] = useState(false);
	const saved = useSaveStatus();
	const savedLabel = saved === "saved" ? pick("Αποθηκεύτηκε στη συσκευή", "Saved on this device") : saved === "saving" || saved === "loading" ? pick("Αποθήκευση…", "Saving…") : saved === "fallback" ? pick("Εφεδρική αποθήκευση · κράτα αντίγραφο", "Backup storage · export a copy") : pick("Δεν αποθηκεύτηκε · κράτα αντίγραφο", "Not saved · export a copy");
	const isActive = (to) => to === "/" ? path === "/" : path.startsWith(to);
	useEffect(() => {
		document.documentElement.lang = language;
	}, [language]);
	useEffect(() => {
		setMore(false);
	}, [path]);
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen lg:pl-60",
		children: [
			/* @__PURE__ */ jsxs("aside", {
				className: "fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar px-4 py-7 text-sidebar-foreground lg:flex",
				children: [
					/* @__PURE__ */ jsxs(Link, {
						to: "/",
						className: "mb-8 flex items-center gap-3 px-3",
						children: [/* @__PURE__ */ jsx("img", {
							src: zenith_logo_leaf_default,
							width: 1024,
							height: 1024,
							alt: "Zenith",
							className: "size-12 object-contain"
						}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsxs("span", {
							className: "block text-2xl font-semibold",
							children: ["Zenith", /* @__PURE__ */ jsx("span", {
								className: "text-sidebar-primary",
								children: "."
							})]
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs text-sidebar-foreground/65",
							children: pick("Οικογενειακή ευεξία", "Family wellbeing")
						})] })]
					}),
					GROUPS.map(([gel, gen], g) => /* @__PURE__ */ jsxs("div", {
						className: cn(g > 0 && "mt-5 border-t border-sidebar-border pt-4"),
						children: [/* @__PURE__ */ jsx("p", {
							className: "mb-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/50",
							children: pick(gel, gen)
						}), /* @__PURE__ */ jsx("nav", {
							className: "flex flex-col gap-0.5",
							"aria-label": pick(gel, gen),
							children: NAV.filter((n) => n.group === g).map(({ to, label, hint, icon: Icon }) => /* @__PURE__ */ jsxs(Link, {
								to,
								"aria-current": isActive(to) ? "page" : void 0,
								className: cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", isActive(to) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50"),
								children: [/* @__PURE__ */ jsx(Icon, { className: cn("size-[18px] shrink-0", isActive(to) && "text-sidebar-primary") }), /* @__PURE__ */ jsxs("span", {
									className: "min-w-0",
									children: [/* @__PURE__ */ jsx("span", {
										className: cn("block leading-tight", isActive(to) && "font-semibold"),
										children: t(label)
									}), /* @__PURE__ */ jsx("span", {
										className: "block truncate text-[11px] leading-tight text-sidebar-foreground/55",
										children: pick(hint[0], hint[1])
									})]
								})]
							}, to))
						})]
					}, gen)),
					/* @__PURE__ */ jsx("nav", {
						className: "mt-auto border-t border-sidebar-border pt-4",
						"aria-label": pick("Άλλες εφαρμογές", "Other apps"),
						children: SIBLING_APPS.map(({ href, host, name }) => /* @__PURE__ */ jsxs("a", {
							href,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
							children: [/* @__PURE__ */ jsx(ExternalLink, { className: "size-3.5 shrink-0 text-sidebar-primary" }), /* @__PURE__ */ jsx("span", {
								className: "min-w-0 truncate",
								children: name
							})]
						}, host))
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "px-3 pt-4 text-xs leading-relaxed text-sidebar-foreground/60",
						children: [
							pick("Μόνο στη συσκευή σου. Χωρίς λογαριασμό.", "Only on your device. No account required."),
							/* @__PURE__ */ jsx("br", {}),
							"USDA · EFSA · WHO · AAP"
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("main", {
				className: "mx-auto max-w-7xl px-4 pb-24 sm:px-8 lg:pb-12",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "mb-6 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b py-4",
						children: [
							/* @__PURE__ */ jsxs(Link, {
								to: "/",
								className: "flex items-center gap-2 text-xl font-semibold lg:hidden",
								children: [/* @__PURE__ */ jsx("img", {
									src: zenith_logo_leaf_default,
									width: 1024,
									height: 1024,
									alt: "",
									className: "size-9 object-contain"
								}), "Zenith."]
							}),
							/* @__PURE__ */ jsx("p", {
								role: "status",
								className: cn("text-xs", saved === "error" ? "text-destructive" : "text-muted-foreground"),
								children: savedLabel
							}),
							/* @__PURE__ */ jsx(LanguageSwitch, {})
						]
					}),
					children,
					/* @__PURE__ */ jsx(AppFooter, {})
				]
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden",
				"aria-label": pick("Καθημερινή πλοήγηση", "Daily navigation"),
				children: /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-5",
					children: [NAV.slice(0, 4).map(({ to, label, icon: Icon }) => /* @__PURE__ */ jsxs(Link, {
						to,
						className: cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[11px]", isActive(to) ? "font-semibold text-primary" : "text-muted-foreground"),
						children: [/* @__PURE__ */ jsx("span", {
							className: cn("grid h-7 w-12 place-items-center rounded-full transition-colors", isActive(to) && "bg-primary/10"),
							children: /* @__PURE__ */ jsx(Icon, { className: "size-5" })
						}), t(label)]
					}, to)), /* @__PURE__ */ jsxs(Button, {
						variant: "ghost",
						className: "flex h-16 flex-col gap-1 rounded-none px-1 text-[11px]",
						onClick: () => setMore((x) => !x),
						"aria-expanded": more,
						"aria-label": t("Περισσότερα"),
						children: [more ? /* @__PURE__ */ jsx(X, { className: "size-5" }) : /* @__PURE__ */ jsx(Menu, { className: "size-5" }), t("Περισσότερα")]
					})]
				})
			}),
			more && /* @__PURE__ */ jsx("div", {
				className: "fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden",
				onClick: () => setMore(false),
				"aria-hidden": true
			}),
			more && /* @__PURE__ */ jsxs("div", {
				className: "fixed inset-x-0 bottom-16 z-40 animate-rise rounded-t-xl border-t bg-card p-4 shadow-lift lg:hidden",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "mb-3 text-sm font-semibold",
					children: pick("Μαγείρεμα, οργάνωση & οικογένεια", "Cook, plan & family")
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-2 gap-2",
					children: NAV.slice(4).map(({ to, label, hint, icon: Icon }) => /* @__PURE__ */ jsxs(Link, {
						to,
						"aria-current": isActive(to) ? "page" : void 0,
						className: cn("flex min-h-14 items-center gap-3 rounded-lg border p-3 text-left", isActive(to) ? "border-primary bg-primary/10" : "bg-card"),
						children: [/* @__PURE__ */ jsx(Icon, { className: "size-5 shrink-0 text-primary" }), /* @__PURE__ */ jsxs("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ jsx("span", {
								className: "block text-sm font-medium leading-tight",
								children: t(label)
							}), /* @__PURE__ */ jsx("span", {
								className: "block truncate text-[11px] text-muted-foreground",
								children: pick(hint[0], hint[1])
							})]
						})]
					}, to))
				})]
			})
		]
	});
}
function PageHeader({ eyebrow, title, children }) {
	const { t } = useI18n();
	return /* @__PURE__ */ jsx("header", {
		className: "mb-6 animate-rise",
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-end justify-between gap-4",
			children: [/* @__PURE__ */ jsxs("div", { children: [eyebrow && /* @__PURE__ */ jsx("p", {
				className: "mb-2 text-xs font-medium uppercase text-terracotta",
				children: t(eyebrow)
			}), /* @__PURE__ */ jsx("h1", {
				className: "text-3xl font-semibold sm:text-4xl",
				children: t(title)
			})] }), children]
		})
	});
}
//#endregion
export { ACTIVITY_KINDS as a, memberProgress as c, useToday as i, MemberSwitcher as n, activityLog as o, PageHeader as r, familyRoutines as s, AppShell as t };
