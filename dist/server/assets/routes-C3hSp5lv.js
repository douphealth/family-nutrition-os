import { C as referenceValues, E as targetsFor, F as SLOTS, H as Button, I as SLOT_LABEL, L as SLOT_TIME, U as cn, _ as contextualGuidance, a as recipeById, d as useStore, i as planFor, l as updateLog, n as getLog, s as setState, t as useI18n, v as dayMacros, w as saltGrams, z as TRAINING_LOADS } from "./i18n-Bg74tMYw.js";
import { i as useToday, n as MemberSwitcher } from "./AppShell-Dn_obJbp.js";
import { n as nf, t as greekDate } from "./format-C0mha9bs.js";
import { t as PlateList } from "./PlateList-DHRv0jTg.js";
import { n as Ring, t as Bar } from "./Ring-irkPS9iz.js";
import { t as SLOT_IMAGE } from "./images-CsQcqoZO.js";
import { t as useActive } from "./useActive-BB3w1w_j.js";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Check, Clock, Droplets, Minus, Plus, SkipForward, Sparkles, Undo2 } from "lucide-react";
//#region src/assets/hero-table.jpg
var hero_table_default = "/family-nutrition-os/assets/hero-table-DGzHUyLX.jpg";
//#endregion
//#region src/routes/index.tsx?tsr-split=component
function greeting() {
	const h = (/* @__PURE__ */ new Date()).getHours();
	return h < 12 ? "Καλημέρα" : h < 18 ? "Καλό απόγευμα" : "Καλησπέρα";
}
function Today() {
	const { t: tr, pick, language } = useI18n();
	const { profile, load } = useActive();
	const date = useToday();
	const plan = planFor(date);
	const log = useStore((s) => getLog(s, s.activeId, date));
	const t = targetsFor(profile, load);
	const refs = referenceValues(profile);
	const day = dayMacros(plan, profile, load, log, recipeById);
	const nextSlot = SLOTS.find((s) => !log.meals[s]) ?? null;
	const nextRecipe = nextSlot ? recipeById(plan[nextSlot]) : null;
	const tips = contextualGuidance({
		profile,
		trainingLoad: load,
		today: { waterMl: log.waterMl },
		plannedMeal: null
	});
	const eaten = day.confirmed;
	const done = Object.values(log.meals).filter((m) => m.status === "done").length;
	const mark = (slot, status) => updateLog(profile.id, date, (l) => {
		const meals = { ...l.meals };
		if (status) meals[slot] = {
			status,
			portion: 1
		};
		else delete meals[slot];
		return {
			...l,
			meals
		};
	});
	const water = (d) => updateLog(profile.id, date, (l) => ({
		...l,
		waterMl: Math.max(0, l.waterMl + d)
	}));
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("section", {
				className: "relative overflow-hidden rounded-[2rem] shadow-lift animate-rise",
				children: [
					/* @__PURE__ */ jsx("img", {
						src: hero_table_default,
						alt: tr("Ελληνικό οικογενειακό τραπέζι"),
						width: 1600,
						height: 912,
						className: "absolute inset-0 h-full w-full object-cover"
					}),
					/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-hero-fade" }),
					/* @__PURE__ */ jsxs("div", {
						className: "relative flex min-h-[260px] flex-col justify-end gap-2 p-6 text-primary-foreground sm:p-10",
						children: [
							/* @__PURE__ */ jsxs("p", {
								className: "text-sm capitalize opacity-80",
								children: [
									greekDate(date, void 0, language),
									" ",
									tr("· Ημέρα"),
									plan.day,
									" ",
									tr("από 28")
								]
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "max-w-lg text-4xl font-semibold sm:text-5xl",
								children: [
									tr(greeting()),
									", ",
									profile.name
								]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "max-w-md text-base opacity-85",
								children: done === 4 ? tr("Όλα τα γεύματα της ημέρας είναι καταγεγραμμένα. Μπράβο!") : tr(`${done} από 4 γεύματα σήμερα · ${tr(profile.role)}`)
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsx(MemberSwitcher, {}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3 border-y py-4",
				children: [/* @__PURE__ */ jsxs("p", {
					className: "text-sm text-muted-foreground",
					children: [
						pick("Για εσένα σήμερα", "For you today"),
						" · ",
						tr(profile.role)
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "ghost",
						children: /* @__PURE__ */ jsxs(Link, {
							to: "/progress",
							children: [pick("Πρόοδος οικογένειας", "Family progress"), " →"]
						})
					}), /* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "outline",
						children: /* @__PURE__ */ jsxs(Link, {
							to: "/training",
							children: [pick("Η δική μου προπόνηση", "My training"), " →"]
						})
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-6 lg:grid-cols-[1.35fr_1fr]",
				children: [/* @__PURE__ */ jsx("section", {
					className: "card-soft min-w-0 overflow-hidden animate-rise",
					children: nextSlot && nextRecipe ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row",
						children: [/* @__PURE__ */ jsx("img", {
							src: SLOT_IMAGE[nextSlot],
							alt: "",
							loading: "lazy",
							width: 816,
							height: 816,
							className: "h-44 w-full object-cover sm:h-auto sm:w-48"
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex-1 p-6",
							children: [
								/* @__PURE__ */ jsxs("p", {
									className: "flex items-center gap-2 text-sm font-medium text-terracotta",
									children: [
										/* @__PURE__ */ jsx(Clock, { className: "size-4" }),
										" ",
										tr("Επόμενο ·"),
										tr(SLOT_LABEL[nextSlot]),
										" ",
										SLOT_TIME[nextSlot]
									]
								}),
								/* @__PURE__ */ jsx("h2", {
									className: "mt-1 text-2xl font-semibold",
									children: tr(nextRecipe.name)
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: [
										tr("Το πιάτο του/της"),
										profile.name,
										" ",
										tr("— ζύγισε ή μέτρησε:")
									]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-3",
									children: /* @__PURE__ */ jsx(PlateList, {
										recipe: nextRecipe,
										profile,
										load
									})
								})
							]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 border-t bg-surface/60 p-4",
						children: [
							/* @__PURE__ */ jsxs(Button, {
								size: "lg",
								className: "rounded-full",
								onClick: () => mark(nextSlot, "done"),
								children: [
									/* @__PURE__ */ jsx(Check, {}),
									" ",
									tr("Το έφαγα")
								]
							}),
							/* @__PURE__ */ jsxs(Button, {
								size: "lg",
								variant: "outline",
								className: "rounded-full",
								onClick: () => mark(nextSlot, "skipped"),
								children: [
									/* @__PURE__ */ jsx(SkipForward, {}),
									" ",
									tr("Παράλειψη")
								]
							}),
							/* @__PURE__ */ jsx(Button, {
								size: "lg",
								variant: "ghost",
								className: "ml-auto rounded-full",
								asChild: true,
								children: /* @__PURE__ */ jsx(Link, {
									to: "/meals/$id",
									params: { id: nextRecipe.id },
									children: tr("Συνταγή & μαγείρεμα →")
								})
							})
						]
					})] }) : /* @__PURE__ */ jsxs("div", {
						className: "grid place-items-center gap-2 p-12 text-center",
						children: [
							/* @__PURE__ */ jsx(Sparkles, { className: "size-8 text-sun" }),
							/* @__PURE__ */ jsx("h2", {
								className: "text-2xl font-semibold",
								children: tr("Η μέρα ολοκληρώθηκε")
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-muted-foreground",
								children: tr("Τα τέσσερα γεύματα έχουν καταγραφεί. Τα λέμε αύριο!")
							})
						]
					})
				}), /* @__PURE__ */ jsxs("section", {
					className: "card-soft min-w-0 p-6 animate-rise",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "text-lg font-semibold",
							children: tr("Η ενέργεια της ημέρας")
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 flex flex-wrap items-center gap-6",
							children: [/* @__PURE__ */ jsx(Ring, {
								value: eaten.kcal,
								max: t.energy.upper,
								color: profile.accent,
								children: /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
									className: "font-display text-3xl font-semibold tabular",
									children: nf(eaten.kcal, 0, language)
								}), /* @__PURE__ */ jsx("div", {
									className: "text-xs text-muted-foreground",
									children: "kcal"
								})] })
							}), /* @__PURE__ */ jsxs("div", {
								className: "space-y-1 text-sm",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-muted-foreground",
										children: tr("Εύρος στόχου")
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "font-display text-xl font-semibold tabular",
										children: [
											nf(t.energy.lower, 0, language),
											"–",
											nf(t.energy.upper, 0, language)
										]
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "text-muted-foreground",
										children: [tr("Πρόγραμμα ημέρας:"), /* @__PURE__ */ jsxs("b", {
											className: "text-foreground tabular",
											children: [nf(day.planned.kcal, 0, language), " kcal"]
										})]
									})
								]
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-6 space-y-4",
							children: [
								/* @__PURE__ */ jsx(Metric, {
									label: tr("Πρωτεΐνη"),
									value: eaten.p,
									unit: "g",
									goal: t.protein.min,
									goalText: `${t.protein.min}–${t.protein.max} g`,
									color: "var(--aegean)"
								}),
								/* @__PURE__ */ jsx(Metric, {
									label: tr("Ίνες"),
									value: eaten.fib,
									unit: "g",
									goal: refs.fibre.g,
									goalText: tr(`στόχος ${refs.fibre.g} g`),
									color: "var(--olive)"
								}),
								/* @__PURE__ */ jsx(Metric, {
									label: tr("Σίδηρος"),
									value: eaten.fe,
									unit: "mg",
									goal: refs.iron.mg,
									goalText: tr(`στόχος ${refs.iron.mg} mg`),
									color: "var(--terracotta)"
								}),
								/* @__PURE__ */ jsx(Metric, {
									label: tr("Ασβέστιο"),
									value: eaten.ca,
									unit: "mg",
									goal: refs.calcium.mg,
									goalText: tr(`στόχος ${refs.calcium.mg} mg`),
									color: "var(--sun)"
								}),
								/* @__PURE__ */ jsx(Metric, {
									label: tr("Αλάτι"),
									value: saltGrams(eaten.na),
									unit: "g",
									goal: refs.sodium.saltG,
									goalText: tr(`κάτω από ${refs.sodium.saltG} g`),
									color: eaten.na > refs.sodium.maxMg ? "var(--destructive)" : "var(--muted-foreground)",
									decimals: 1
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-6 lg:grid-cols-[1.35fr_1fr]",
				children: [/* @__PURE__ */ jsxs("section", {
					className: "card-soft min-w-0 p-6",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-lg font-semibold",
						children: tr("Τα γεύματα της ημέρας")
					}), /* @__PURE__ */ jsx("ol", {
						className: "mt-4 space-y-2",
						children: SLOTS.map((slot) => {
							const r = recipeById(plan[slot]);
							const st = log.meals[slot]?.status;
							const kcal = day.detail.find((d) => d.slot === slot)?.planned.kcal ?? 0;
							return /* @__PURE__ */ jsxs("li", {
								className: cn("flex items-center gap-4 rounded-2xl border p-3 transition-colors", st === "done" ? "border-success/30 bg-success/5" : st === "skipped" ? "opacity-60" : "bg-card"),
								children: [
									/* @__PURE__ */ jsx("img", {
										src: SLOT_IMAGE[slot],
										alt: "",
										loading: "lazy",
										width: 816,
										height: 816,
										className: "size-14 rounded-xl object-cover"
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ jsxs("p", {
												className: "text-xs font-medium uppercase tracking-wider text-muted-foreground",
												children: [
													tr(SLOT_LABEL[slot]),
													" · ",
													SLOT_TIME[slot]
												]
											}),
											/* @__PURE__ */ jsx(Link, {
												to: "/meals/$id",
												params: { id: r.id },
												className: cn("block truncate font-medium hover:underline", st === "skipped" && "line-through"),
												children: tr(r.name)
											}),
											/* @__PURE__ */ jsxs("p", {
												className: "text-xs text-muted-foreground tabular",
												children: [
													nf(kcal, 0, language),
													" ",
													tr("kcal για"),
													profile.name
												]
											})
										]
									}),
									st ? /* @__PURE__ */ jsx(Button, {
										variant: "ghost",
										size: "icon",
										"aria-label": tr("Αναίρεση"),
										onClick: () => mark(slot, null),
										children: /* @__PURE__ */ jsx(Undo2, {})
									}) : /* @__PURE__ */ jsx(Button, {
										variant: "outline",
										size: "icon",
										className: "rounded-full",
										"aria-label": tr(`Έφαγα ${tr(SLOT_LABEL[slot])}`),
										onClick: () => mark(slot, "done"),
										children: /* @__PURE__ */ jsx(Check, {})
									}),
									st === "done" && /* @__PURE__ */ jsx("span", {
										className: "grid size-9 place-items-center rounded-full bg-success text-primary-foreground",
										children: /* @__PURE__ */ jsx(Check, { className: "size-4" })
									})
								]
							}, slot);
						})
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "min-w-0 space-y-6",
					children: [
						/* @__PURE__ */ jsxs("section", {
							className: "card-soft p-6",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ jsxs("h2", {
										className: "flex items-center gap-2 text-lg font-semibold",
										children: [
											/* @__PURE__ */ jsx(Droplets, { className: "size-5 text-aegean" }),
											" ",
											tr("Νερό")
										]
									}), /* @__PURE__ */ jsxs("span", {
										className: "text-sm text-muted-foreground tabular",
										children: [
											nf(log.waterMl, 0, language),
											" / ",
											nf(t.hydration.ml, 0, language),
											" ml"
										]
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-4 flex flex-wrap gap-1.5",
									children: Array.from({ length: t.hydration.glasses }).map((_, i) => /* @__PURE__ */ jsx("button", {
										onClick: () => water(i < log.waterMl / 250 ? -250 : 250),
										"aria-label": tr(`Ποτήρι ${i + 1}`),
										className: cn("h-10 w-7 rounded-b-lg rounded-t-sm border-2 transition-all", i < Math.round(log.waterMl / 250) ? "border-aegean bg-aegean/70" : "border-border bg-muted/50 hover:border-aegean/50")
									}, i))
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-4 flex flex-wrap gap-2",
									children: [/* @__PURE__ */ jsxs(Button, {
										variant: "outline",
										className: "rounded-full",
										onClick: () => water(-250),
										children: [/* @__PURE__ */ jsx(Minus, {}), " 250 ml"]
									}), /* @__PURE__ */ jsxs(Button, {
										className: "rounded-full",
										onClick: () => water(250),
										children: [
											/* @__PURE__ */ jsx(Plus, {}),
											" ",
											tr("Ένα ποτήρι")
										]
									})]
								})
							]
						}),
						profile.athlete && /* @__PURE__ */ jsxs("section", {
							className: "card-soft p-6",
							children: [
								/* @__PURE__ */ jsx("h2", {
									className: "text-lg font-semibold",
									children: tr("Προπόνηση σήμερα")
								}),
								/* @__PURE__ */ jsx(Button, {
									asChild: true,
									variant: "outline",
									className: "my-3",
									children: /* @__PURE__ */ jsx(Link, {
										to: "/training",
										children: tr("Ατομικό πρόγραμμα μπάσκετ →")
									})
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "text-sm text-muted-foreground",
									children: [
										tr("Αλλάζει τους υδατάνθρακες και το νερό του"),
										profile.name,
										"."
									]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-3 flex flex-wrap gap-2",
									children: TRAINING_LOADS.map(([id, label]) => /* @__PURE__ */ jsx("button", {
										onClick: () => setState((s) => ({
											...s,
											loads: {
												...s.loads,
												[profile.id]: id
											}
										})),
										className: cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", load === id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"),
										children: label
									}, id))
								})
							]
						}),
						tips.length > 0 && /* @__PURE__ */ jsxs("section", {
							className: "rounded-[1.4rem] bg-accent p-6 text-accent-foreground",
							children: [/* @__PURE__ */ jsxs("h2", {
								className: "flex items-center gap-2 font-semibold",
								children: [
									/* @__PURE__ */ jsx(Sparkles, { className: "size-4" }),
									" ",
									tr("Συμβουλές για σήμερα")
								]
							}), /* @__PURE__ */ jsx("ul", {
								className: "mt-2 list-disc space-y-1.5 pl-5 text-sm",
								children: tips.map((tip) => /* @__PURE__ */ jsx("li", { children: tr(tip) }, tip))
							})]
						})
					]
				})]
			})
		]
	});
}
function Metric({ label, value, unit, goal, goalText, color, decimals = 0 }) {
	const { t, pick, language } = useI18n();
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
		className: "mb-1.5 flex justify-between text-sm",
		children: [/* @__PURE__ */ jsx("span", {
			className: "font-medium",
			children: label
		}), /* @__PURE__ */ jsxs("span", {
			className: "text-muted-foreground tabular",
			children: [
				/* @__PURE__ */ jsxs("b", {
					className: "text-foreground",
					children: [
						nf(value, decimals, language),
						" ",
						unit
					]
				}),
				" · ",
				goalText
			]
		})]
	}), /* @__PURE__ */ jsx(Bar, {
		value,
		max: goal,
		color
	})] });
}
//#endregion
export { Today as component };
