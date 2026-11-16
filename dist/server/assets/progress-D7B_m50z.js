import { D as weightTrend, F as SLOTS, H as Button, I as SLOT_LABEL, O as addDays, U as cn, a as recipeById, c as todayKey, d as useStore, i as planFor, l as updateLog, n as getLog, s as setState, t as useI18n, y as isMinor } from "./i18n-Bg74tMYw.js";
import { a as ACTIVITY_KINDS, c as memberProgress, i as useToday, n as MemberSwitcher, o as activityLog, r as PageHeader, s as familyRoutines } from "./AppShell-Dn_obJbp.js";
import { t as Input } from "./input-BaDDcapO.js";
import { n as nf, t as greekDate } from "./format-C0mha9bs.js";
import { n as Ring } from "./Ring-irkPS9iz.js";
import { t as useActive } from "./useActive-BB3w1w_j.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ArrowUpRight, Check, Droplet, Dumbbell, Minus, Plus, ShieldCheck, Trash2, TrendingDown, TrendingUp, Utensils } from "lucide-react";
import { CartesianGrid, Line, LineChart as LineChart$1, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
//#region src/components/FamilyProgress.tsx
function FamilyProgress() {
	const state = useStore((s) => s);
	const { pick, t, language } = useI18n();
	const today = useToday();
	const [week, setWeek] = useState(false);
	const start = week ? addDays(today, -6) : today;
	return /* @__PURE__ */ jsxs("section", {
		className: "mb-8 border-b pb-8",
		"aria-labelledby": "family-progress-title",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-5 flex flex-wrap items-end justify-between gap-4",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsxs("p", {
					className: "mb-2 text-xs font-semibold uppercase text-terracotta",
					children: ["Zenith · ", pick("Μαζί, κάθε μέρα", "Together, every day")]
				}),
				/* @__PURE__ */ jsx("h2", {
					id: "family-progress-title",
					className: "text-2xl font-semibold",
					children: pick("Η πρόοδος της οικογένειας", "Family progress")
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: [greekDate(start, void 0, language), week && ` — ${greekDate(today, void 0, language)}`]
				})
			] }), /* @__PURE__ */ jsxs("div", {
				className: "flex gap-1 rounded-md bg-muted p-1",
				role: "group",
				"aria-label": pick("Περίοδος προόδου", "Progress period"),
				children: [/* @__PURE__ */ jsx(Button, {
					size: "sm",
					variant: week ? "ghost" : "default",
					"aria-pressed": !week,
					onClick: () => setWeek(false),
					children: t("Σήμερα")
				}), /* @__PURE__ */ jsx(Button, {
					size: "sm",
					variant: week ? "default" : "ghost",
					"aria-pressed": week,
					onClick: () => setWeek(true),
					children: pick("Τελευταίες 7 ημέρες", "Last 7 days")
				})]
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
			children: state.profiles.map((p) => {
				const progress = memberProgress(state, p.id, start, today);
				return /* @__PURE__ */ jsxs("article", {
					className: "card-soft p-5",
					"aria-label": p.name,
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "mb-5 flex items-center gap-3",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary",
									children: p.name.charAt(0)
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ jsx("h3", {
										className: "truncate font-sans text-lg font-semibold",
										children: p.name
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-muted-foreground",
										children: t(p.relation)
									})]
								}),
								progress.completeDays > 0 && /* @__PURE__ */ jsx(Check, { className: "ml-auto size-5 text-success" })
							]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mb-5 flex justify-center",
							children: /* @__PURE__ */ jsx(Ring, {
								value: progress.meals,
								max: progress.mealTotal,
								size: 112,
								stroke: 10,
								color: "var(--success)",
								children: /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsxs("b", {
									className: "tabular block text-2xl",
									children: [Math.round(progress.meals / Math.max(1, progress.mealTotal) * 100), "%"]
								}), /* @__PURE__ */ jsx("span", {
									className: "text-[11px] text-muted-foreground",
									children: pick("γεύματα", "meals")
								})] })
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between gap-2 text-sm",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-2 text-muted-foreground",
								children: [/* @__PURE__ */ jsx(Utensils, { className: "size-4" }), pick("Γεύματα", "Meals")]
							}), /* @__PURE__ */ jsxs("b", {
								className: "tabular",
								"data-testid": `meals-${p.id}`,
								children: [
									progress.meals,
									"/",
									progress.mealTotal
								]
							})]
						}),
						/* @__PURE__ */ jsx("progress", {
							className: "family-meter my-3 h-1.5 w-full",
							value: progress.meals,
							max: progress.mealTotal,
							"aria-label": pick("Ολοκληρωμένα γεύματα", "Completed meals")
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between gap-2 text-sm",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-2 text-muted-foreground",
								children: [/* @__PURE__ */ jsx(Dumbbell, { className: "size-4" }), pick("Συνεδρίες", "Sessions")]
							}), /* @__PURE__ */ jsx("b", {
								"data-testid": `sessions-${p.id}`,
								children: progress.sessions
							})]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-2 text-xs text-muted-foreground",
							children: [
								progress.completedMinutes,
								"′ ",
								pick("καταγεγραμμένα", "recorded"),
								progress.unknownMinutes > 0 && ` · ${progress.unknownMinutes} ${pick("χωρίς λεπτά", "without minutes")}`
							]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-3 text-xs text-muted-foreground",
							children: [
								progress.completeDays,
								" ",
								pick("ημέρες με όλα τα γεύματα", "days with every meal")
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 flex gap-2 border-t pt-3",
							children: [/* @__PURE__ */ jsx(Button, {
								asChild: true,
								variant: "ghost",
								size: "sm",
								className: "flex-1",
								onClick: () => setState((s) => ({
									...s,
									activeId: p.id
								})),
								children: /* @__PURE__ */ jsxs(Link, {
									to: "/",
									children: [pick("Γεύματα", "Meals"), /* @__PURE__ */ jsx(ArrowUpRight, {})]
								})
							}), /* @__PURE__ */ jsx(Button, {
								asChild: true,
								variant: "ghost",
								size: "sm",
								className: "flex-1",
								onClick: () => setState((s) => ({
									...s,
									activeId: p.id
								})),
								children: /* @__PURE__ */ jsxs(Link, {
									to: "/training",
									children: [t("Προπόνηση"), /* @__PURE__ */ jsx(ArrowUpRight, {})]
								})
							})]
						})
					]
				}, p.id);
			})
		})]
	});
}
//#endregion
//#region src/components/FamilyRoutines.tsx
function FamilyRoutines() {
	const state = useStore((s) => s);
	const { pick, t, language } = useI18n();
	const today = useToday();
	const [days, setDays] = useState(7);
	const summary = familyRoutines(state, addDays(today, -1), days);
	const percent = summary.mealTotal ? Math.round(100 * summary.meals / summary.mealTotal) : 0;
	const difference = summary.meals - summary.previousMeals;
	return /* @__PURE__ */ jsxs("section", {
		className: "mb-8 border-b pb-8",
		"aria-labelledby": "family-routines-title",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-5 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					id: "family-routines-title",
					className: "text-2xl font-semibold",
					children: pick("Οι οικογενειακές συνήθειες", "Family routines")
				}), /* @__PURE__ */ jsxs("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: [
						greekDate(summary.start, void 0, language),
						" — ",
						greekDate(summary.end, void 0, language)
					]
				})] }), /* @__PURE__ */ jsx("div", {
					className: "flex gap-1 rounded-md bg-muted p-1",
					role: "group",
					"aria-label": pick("Περίοδος συνηθειών", "Routine period"),
					children: [7, 28].map((n) => /* @__PURE__ */ jsxs(Button, {
						size: "sm",
						variant: days === n ? "default" : "ghost",
						"aria-pressed": days === n,
						onClick: () => setDays(n),
						children: [
							n,
							" ",
							pick("ημέρες", "days")
						]
					}, n))
				})]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mb-5 flex items-start gap-2 text-sm text-muted-foreground",
				children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "size-4 shrink-0" }), pick("Ιδιωτική σύνοψη στη συσκευή · χωρίς αποστολή δεδομένων. Οι ημέρες χωρίς καταγραφή δεν αποδεικνύουν ότι χάθηκε ένα γεύμα ή μια προπόνηση.", "Private on-device summary · no data sent. Unlogged days do not prove a meal or workout was missed.")]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-5 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground",
							children: pick("Γεύματα σημειωμένα ως φαγωμένα", "Meals marked as eaten")
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-2 text-3xl font-semibold tabular",
							"data-testid": "routine-meals",
							children: [
								summary.meals,
								"/",
								summary.mealTotal
							]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: [
								percent,
								"% · ",
								difference > 0 ? "+" : "",
								difference,
								" ",
								pick("έναντι προηγούμενης περιόδου", "vs previous period")
							]
						})
					] }),
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground",
							children: pick("Ολοκληρωμένες συνεδρίες", "Completed sessions")
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-3xl font-semibold tabular",
							"data-testid": "routine-sessions",
							children: summary.sessions
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: [
								pick("Προηγούμενη περίοδος", "Previous period"),
								": ",
								summary.previousSessions
							]
						})
					] }),
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground",
							children: pick("Καταγεγραμμένα λεπτά", "Recorded minutes")
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-2 text-3xl font-semibold tabular",
							"data-testid": "routine-minutes",
							children: [nf(summary.completedMinutes, 0, language), "′"]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: [
								pick("Συνεδρίες χωρίς καταγεγραμμένα λεπτά", "Sessions without recorded minutes"),
								": ",
								summary.unknownMinutes
							]
						})
					] })
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: summary.slots.map((slot) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
					className: "flex justify-between gap-2 text-sm",
					children: [/* @__PURE__ */ jsx("span", { children: t(SLOT_LABEL[slot.slot]) }), /* @__PURE__ */ jsxs("b", {
						className: "tabular",
						children: [
							slot.completed,
							"/",
							slot.total
						]
					})]
				}), /* @__PURE__ */ jsx("progress", {
					className: "family-meter mt-2 h-1.5 w-full",
					value: slot.completed,
					max: slot.total || 1,
					"aria-label": t(SLOT_LABEL[slot.slot])
				})] }, slot.slot))
			}),
			/* @__PURE__ */ jsxs("details", {
				className: "mt-6 border-t pt-4",
				children: [/* @__PURE__ */ jsx("summary", {
					className: "cursor-pointer text-sm font-semibold",
					children: pick("Ανά ημέρα", "Daily breakdown")
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-3 overflow-x-auto",
					children: /* @__PURE__ */ jsxs("table", {
						className: "w-full text-left text-sm",
						children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
							className: "border-b",
							children: [
								/* @__PURE__ */ jsx("th", {
									className: "py-2",
									children: pick("Ημερομηνία", "Date")
								}),
								/* @__PURE__ */ jsx("th", { children: pick("Γεύματα", "Meals") }),
								/* @__PURE__ */ jsx("th", { children: pick("Συνεδρίες", "Sessions") })
							]
						}) }), /* @__PURE__ */ jsx("tbody", { children: summary.daily.map((day) => /* @__PURE__ */ jsxs("tr", {
							className: "border-b",
							children: [
								/* @__PURE__ */ jsx("td", {
									className: "py-2",
									children: greekDate(day.date, {
										day: "numeric",
										month: "short"
									}, language)
								}),
								/* @__PURE__ */ jsxs("td", {
									className: "tabular",
									children: [
										day.meals,
										"/",
										day.mealTotal
									]
								}),
								/* @__PURE__ */ jsx("td", {
									className: "tabular",
									children: day.sessions
								})
							]
						}, day.date)) })]
					})
				})]
			})
		]
	});
}
//#endregion
//#region src/components/QuickCheckIn.tsx
var KIND = {
	team: ["Ομαδική προπόνηση", "Team practice"],
	walk: ["Περπάτημα", "Walk"],
	strength: ["Δύναμη", "Strength"],
	mobility: ["Κινητικότητα", "Mobility"],
	sport: ["Άλλο άθλημα", "Other sport"]
};
/** One-tap daily check-in: meals, water and reported activity for the selected member. */
function QuickCheckIn() {
	const { pick, t } = useI18n();
	const { profile } = useActive();
	const today = useToday();
	const [date, setDate] = useState(null);
	const day = date ?? today;
	const log = useStore((s) => getLog(s, profile.id, day));
	const state = useStore((s) => s);
	const plan = planFor(day);
	const [kind, setKind] = useState(profile.athlete ? "team" : "walk");
	const [minutes, setMinutes] = useState("");
	const pr = memberProgress(state, profile.id, day, day);
	const activities = Object.values(state.trainingLogs ?? {}).filter((l) => l.memberId === profile.id && l.date === day && String(l.id).startsWith("activity-log:"));
	const toggle = (slot) => updateLog(profile.id, day, (l) => {
		const meals = { ...l.meals };
		if (meals[slot]?.status === "done") delete meals[slot];
		else meals[slot] = {
			status: "done",
			portion: 1
		};
		return {
			...l,
			meals
		};
	});
	const water = (d) => updateLog(profile.id, day, (l) => ({
		...l,
		waterMl: Math.max(0, l.waterMl + d)
	}));
	const addActivity = () => {
		const entry = activityLog(profile.id, day, kind, Number(minutes), Date.now());
		if (!entry) return;
		setState((s) => ({
			...s,
			trainingLogs: {
				...s.trainingLogs,
				[entry.id]: entry
			}
		}));
		setMinutes("");
	};
	const removeActivity = (id) => setState((s) => {
		const next = { ...s.trainingLogs };
		delete next[id];
		return {
			...s,
			trainingLogs: next
		};
	});
	const valid = activityLog(profile.id, day, kind, Number(minutes), 0) !== null;
	return /* @__PURE__ */ jsxs("section", {
		className: "card-soft mb-8 p-5 sm:p-6",
		"aria-labelledby": "checkin-title",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-xs font-semibold uppercase text-terracotta",
					children: pick("Γρήγορη καταγραφή · 10 δευτερόλεπτα", "Quick check-in · 10 seconds")
				}), /* @__PURE__ */ jsx("h2", {
					id: "checkin-title",
					className: "mt-1 text-2xl font-semibold",
					children: pick(`Τι έκανε ${profile.name};`, `What did ${profile.name} do?`)
				})] }), /* @__PURE__ */ jsx("div", {
					className: "inline-flex rounded-full border p-1",
					role: "group",
					"aria-label": pick("Ημέρα", "Day"),
					children: [[today, pick("Σήμερα", "Today")], [addDays(today, -1), pick("Χθες", "Yesterday")]].map(([d, label]) => /* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-pressed": day === d,
						onClick: () => setDate(d),
						className: cn("rounded-full px-4 py-1.5 text-sm", day === d ? "bg-primary text-primary-foreground" : "text-muted-foreground"),
						children: label
					}, d))
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-4",
				children: /* @__PURE__ */ jsx(MemberSwitcher, {})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr]",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs("h3", {
						className: "mb-2 text-sm font-semibold",
						children: [
							pick("Γεύματα · πάτα όσα φαγώθηκαν", "Meals · tap the ones eaten"),
							" ",
							/* @__PURE__ */ jsxs("span", {
								className: "font-normal text-muted-foreground",
								children: [
									pr.meals,
									"/",
									pr.mealTotal
								]
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "grid grid-cols-2 gap-2",
						children: SLOTS.map((slot) => {
							const done = log.meals[slot]?.status === "done";
							const r = recipeById(plan?.[slot]);
							return /* @__PURE__ */ jsxs("button", {
								type: "button",
								"aria-pressed": done,
								onClick: () => toggle(slot),
								className: cn("flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left transition-all", done ? "border-success bg-success/10" : "bg-card hover:bg-muted"),
								children: [/* @__PURE__ */ jsx("span", {
									className: cn("grid size-7 shrink-0 place-items-center rounded-full border-2", done ? "border-success bg-success text-primary-foreground" : "border-border"),
									children: done && /* @__PURE__ */ jsx(Check, { className: "size-4" })
								}), /* @__PURE__ */ jsxs("span", {
									className: "min-w-0",
									children: [/* @__PURE__ */ jsx("span", {
										className: "block text-sm font-medium",
										children: t(SLOT_LABEL[slot])
									}), r && /* @__PURE__ */ jsx("span", {
										className: "block truncate text-xs text-muted-foreground",
										children: t(r.name)
									})]
								})]
							}, slot);
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-3 flex items-center gap-3 rounded-lg border p-3",
						children: [
							/* @__PURE__ */ jsx(Droplet, { className: "size-5 text-aegean" }),
							/* @__PURE__ */ jsxs("span", {
								className: "flex-1 text-sm",
								children: [
									pick("Νερό", "Water"),
									" ",
									/* @__PURE__ */ jsxs("b", {
										className: "tabular",
										children: [log.waterMl, " ml"]
									})
								]
							}),
							/* @__PURE__ */ jsx(Button, {
								size: "icon",
								variant: "outline",
								"aria-label": pick("Λιγότερο νερό", "Less water"),
								onClick: () => water(-250),
								children: /* @__PURE__ */ jsx(Minus, {})
							}),
							/* @__PURE__ */ jsx(Button, {
								size: "icon",
								variant: "outline",
								"aria-label": pick("Ένα ποτήρι νερό", "One glass of water"),
								onClick: () => water(250),
								children: /* @__PURE__ */ jsx(Plus, {})
							})
						]
					})
				] }), /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs("h3", {
						className: "mb-2 flex items-center gap-2 text-sm font-semibold",
						children: [/* @__PURE__ */ jsx(Dumbbell, { className: "size-4 text-training" }), pick("Άσκηση που έγινε", "Exercise completed")]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex flex-wrap gap-1.5",
						children: ACTIVITY_KINDS.map((k) => /* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-pressed": kind === k,
							onClick: () => setKind(k),
							className: cn("rounded-full border px-3 py-1.5 text-xs", kind === k ? "border-training bg-training-surface font-semibold text-training" : "bg-card text-muted-foreground"),
							children: pick(...KIND[k])
						}, k))
					}),
					/* @__PURE__ */ jsxs("form", {
						className: "mt-3 flex gap-2",
						onSubmit: (e) => {
							e.preventDefault();
							addActivity();
						},
						children: [/* @__PURE__ */ jsx(Input, {
							inputMode: "numeric",
							"aria-label": pick("Λεπτά που έγιναν", "Minutes completed"),
							placeholder: pick("λεπτά", "minutes"),
							value: minutes,
							onChange: (e) => setMinutes(e.target.value.replace(/\D/g, "").slice(0, 3)),
							className: "h-11 w-28"
						}), /* @__PURE__ */ jsxs(Button, {
							type: "submit",
							className: "h-11 flex-1",
							disabled: !valid,
							children: [/* @__PURE__ */ jsx(Plus, {}), pick("Καταγραφή", "Log it")]
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 text-xs text-muted-foreground",
						children: pick("Γράψε τα λεπτά που έγιναν πραγματικά (1–240), όχι τα προγραμματισμένα.", "Enter the minutes actually done (1–240), not the planned ones.")
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "mt-3 divide-y",
						children: activities.map((a) => /* @__PURE__ */ jsxs("li", {
							className: "flex items-center justify-between py-2 text-sm",
							children: [/* @__PURE__ */ jsxs("span", { children: [
								pick(...KIND[a.kind] ?? ["Άσκηση", "Exercise"]),
								" · ",
								/* @__PURE__ */ jsxs("b", {
									className: "tabular",
									children: [a.completedMinutes, "′"]
								})
							] }), /* @__PURE__ */ jsx(Button, {
								size: "icon",
								variant: "ghost",
								className: "size-8",
								"aria-label": pick("Διαγραφή", "Delete"),
								onClick: () => removeActivity(a.id),
								children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
							})]
						}, a.id))
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-2 text-sm",
						children: [
							/* @__PURE__ */ jsx("b", {
								className: "tabular",
								children: pr.sessions
							}),
							" ",
							pick("ολοκληρωμένες συνεδρίες", "completed sessions"),
							" · ",
							/* @__PURE__ */ jsxs("b", {
								className: "tabular",
								children: [pr.completedMinutes, "′"]
							})
						]
					})
				] })]
			})
		]
	});
}
//#endregion
//#region src/routes/progress.tsx?tsr-split=component
var NO_MS = [];
var NO_LOGS = {};
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
		setState((s) => ({
			...s,
			measurements: {
				...s.measurements,
				[profile.id]: [...(s.measurements[profile.id] ?? []).filter((m) => m.date !== date), {
					date,
					weight: n
				}]
			}
		}));
		setW("");
	};
	const remove = (d) => setState((s) => ({
		...s,
		measurements: {
			...s.measurements,
			[profile.id]: (s.measurements[profile.id] ?? []).filter((m) => m.date !== d)
		}
	}));
	const TrendIcon = tr.direction === "down" ? TrendingDown : tr.direction === "up" ? TrendingUp : Minus;
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			eyebrow: t("Τάση, όχι μία μέρα"),
			title: t("Πρόοδος")
		}),
		/* @__PURE__ */ jsx(QuickCheckIn, {}),
		/* @__PURE__ */ jsx(FamilyProgress, {}),
		/* @__PURE__ */ jsx(FamilyRoutines, {}),
		/* @__PURE__ */ jsxs("h2", {
			className: "mb-3 text-xl font-semibold",
			children: [
				t("Βάρος"),
				" · ",
				profile.name
			]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "grid gap-6 lg:grid-cols-[1.5fr_1fr]",
			children: [/* @__PURE__ */ jsxs("section", {
				className: "card-soft p-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-start justify-between gap-4",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
							className: "text-lg font-semibold",
							children: t("Βάρος")
						}), /* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground",
							children: t("Μία ζύγιση είναι θόρυβος· η κλίση είναι το σήμα.")
						})] }), tr.slopePerWeek != null && /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3 rounded-2xl bg-surface px-4 py-2",
							children: [/* @__PURE__ */ jsx(TrendIcon, {
								className: "size-5",
								style: { color: profile.accent }
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
								className: "font-display text-xl font-semibold tabular",
								children: [
									tr.slopePerWeek > 0 ? "+" : "",
									nf(tr.slopePerWeek, 2, language),
									" kg"
								]
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-muted-foreground",
								children: t("ανά εβδομάδα")
							})] })]
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-4 h-64",
						children: tr.count >= 2 ? /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(LineChart$1, {
							data: tr.points.map((p) => ({
								...p,
								label: greekDate(p.date, {
									day: "numeric",
									month: "short"
								}, language)
							})),
							children: [
								/* @__PURE__ */ jsx(CartesianGrid, {
									stroke: "var(--border)",
									vertical: false
								}),
								/* @__PURE__ */ jsx(XAxis, {
									dataKey: "label",
									tick: {
										fontSize: 12,
										fill: "var(--muted-foreground)"
									},
									axisLine: false,
									tickLine: false
								}),
								/* @__PURE__ */ jsx(YAxis, {
									domain: ["dataMin - 1", "dataMax + 1"],
									tick: {
										fontSize: 12,
										fill: "var(--muted-foreground)"
									},
									axisLine: false,
									tickLine: false,
									width: 40
								}),
								/* @__PURE__ */ jsx(Tooltip, {
									contentStyle: {
										borderRadius: 12,
										border: "1px solid var(--border)",
										background: "var(--card)"
									},
									formatter: (v) => [`${nf(v, 1, language)} kg`, t("Βάρος")]
								}),
								/* @__PURE__ */ jsx(Line, {
									type: "monotone",
									dataKey: "weight",
									stroke: profile.accent,
									strokeWidth: 3,
									dot: {
										r: 4,
										fill: profile.accent
									}
								})
							]
						}) }) : /* @__PURE__ */ jsx("div", {
							className: "grid h-full place-items-center rounded-2xl border-2 border-dashed text-center text-sm text-muted-foreground",
							children: /* @__PURE__ */ jsxs("p", { children: [
								t("Πρόσθεσε τουλάχιστον δύο ζυγίσεις"),
								/* @__PURE__ */ jsx("br", {}),
								t("για να εμφανιστεί η τάση.")
							] })
						})
					}),
					minor && /* @__PURE__ */ jsx("p", {
						className: "mt-3 rounded-xl bg-accent p-3 text-sm text-accent-foreground",
						children: t("Στους εφήβους το βάρος αυξάνεται φυσιολογικά με την ανάπτυξη — δεν υπάρχει στόχος απώλειας.")
					})
				]
			}), /* @__PURE__ */ jsxs("section", {
				className: "card-soft p-6",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "text-lg font-semibold",
						children: t("Νέα ζύγιση")
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-3 flex gap-2",
						children: [/* @__PURE__ */ jsx(Input, {
							type: "date",
							value: date,
							max: today,
							onChange: (e) => setDate(e.target.value),
							className: "h-11 rounded-xl"
						}), /* @__PURE__ */ jsx(Input, {
							inputMode: "decimal",
							placeholder: "kg",
							value: w,
							onChange: (e) => setW(e.target.value),
							onKeyDown: (e) => e.key === "Enter" && add(),
							className: "h-11 w-24 rounded-xl"
						})]
					}),
					/* @__PURE__ */ jsx(Button, {
						className: "mt-3 w-full rounded-full",
						size: "lg",
						onClick: add,
						children: t("Αποθήκευση")
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "mt-4 max-h-56 divide-y overflow-auto",
						children: [...tr.points].reverse().map((p) => /* @__PURE__ */ jsxs("li", {
							className: "flex items-center justify-between py-2 text-sm",
							children: [/* @__PURE__ */ jsx("span", {
								className: "capitalize",
								children: greekDate(p.date, {
									weekday: "short",
									day: "numeric",
									month: "short"
								}, language)
							}), /* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-2 font-semibold tabular",
								children: [
									nf(p.weight, 1, language),
									" kg",
									/* @__PURE__ */ jsx(Button, {
										variant: "ghost",
										size: "icon",
										className: "size-7",
										"aria-label": t("Διαγραφή"),
										onClick: () => remove(p.date),
										children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" })
									})
								]
							})]
						}, p.date))
					})
				]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "card-soft mt-6 p-6",
			children: [
				/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-semibold",
					children: t("Ημερολόγιο καταγραφής · 28 ημέρες")
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted-foreground",
					children: t("Πόσα από τα 4 γεύματα καταγράφηκαν κάθε μέρα.")
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-4 grid grid-cols-7 gap-2",
					children: cal.map((d) => {
						const n = Object.values(logs[d]?.meals ?? {}).filter((m) => m.status === "done").length;
						return /* @__PURE__ */ jsx("div", {
							title: `${greekDate(d, void 0, language)} · ${n}/4`,
							className: cn("grid aspect-square place-items-center rounded-xl text-xs tabular", d === today && "ring-2 ring-primary"),
							style: { background: n ? `color-mix(in oklab, ${profile.accent} ${20 + n * 20}%, transparent)` : "var(--muted)" },
							children: /* @__PURE__ */ jsx("span", {
								className: cn(n >= 3 ? "text-primary-foreground" : "text-muted-foreground"),
								children: Number(d.slice(8))
							})
						}, d);
					})
				})
			]
		})
	] });
}
//#endregion
export { Progress as component };
