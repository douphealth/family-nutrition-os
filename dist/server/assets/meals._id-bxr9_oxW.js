import { H as Button, I as SLOT_LABEL, S as nutritionBadges, U as cn, a as recipeById, b as kcalFromMacros, d as useStore, f as withPlate, r as loadOf, t as useI18n, w as saltGrams, x as mealMacros } from "./i18n-Bg74tMYw.js";
import { t as Route } from "./meals._id-B8Tf5Bu1.js";
import { n as nf } from "./format-C0mha9bs.js";
import { t as PlateList } from "./PlateList-DHRv0jTg.js";
import { t as SLOT_IMAGE } from "./images-CsQcqoZO.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowLeft, ChefHat, Clock, Lightbulb, X } from "lucide-react";
//#region src/routes/meals.$id.tsx?tsr-split=component
function Recipe() {
	const { t, pick, language } = useI18n();
	const { id } = Route.useParams();
	const r = recipeById(id);
	const s = useStore((x) => x);
	const profiles = s.profiles.map((p) => withPlate(p, loadOf(s, p.id)));
	const [who, setWho] = useState(s.activeId);
	const [cook, setCook] = useState(null);
	const me = profiles.find((p) => p.id === who) ?? profiles[0];
	const m = mealMacros(r, me, loadOf(s, me.id));
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs(Link, {
				to: "/meals",
				className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground",
				children: [
					/* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
					" ",
					t("Όλες οι συνταγές")
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "card-soft grid overflow-hidden md:grid-cols-2",
				children: [/* @__PURE__ */ jsx("img", {
					src: SLOT_IMAGE[r.slot],
					alt: "",
					width: 816,
					height: 816,
					className: "h-64 w-full object-cover md:h-full"
				}), /* @__PURE__ */ jsxs("div", {
					className: "p-6 sm:p-8",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-medium uppercase tracking-[0.14em] text-terracotta",
							children: t(SLOT_LABEL[r.slot])
						}),
						/* @__PURE__ */ jsx("h1", {
							className: "mt-1 text-3xl font-semibold sm:text-4xl",
							children: t(r.name)
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-2 flex items-center gap-1.5 text-muted-foreground",
							children: [
								/* @__PURE__ */ jsx(Clock, { className: "size-4" }),
								" ",
								r.time,
								" ",
								t("λεπτά")
							]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 flex flex-wrap gap-1.5",
							children: nutritionBadges(r).map((b) => /* @__PURE__ */ jsx("span", {
								className: "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium",
								children: t(b.label)
							}, b.id))
						}),
						r.tip && /* @__PURE__ */ jsxs("p", {
							className: "mt-5 flex gap-2 rounded-2xl bg-accent p-4 text-sm text-accent-foreground",
							children: [/* @__PURE__ */ jsx(Lightbulb, { className: "size-4 shrink-0" }), t(r.tip)]
						}),
						/* @__PURE__ */ jsxs(Button, {
							size: "lg",
							className: "mt-6 rounded-full",
							onClick: () => setCook(0),
							children: [
								/* @__PURE__ */ jsx(ChefHat, {}),
								" ",
								t("Ξεκίνα μαγείρεμα")
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-6 lg:grid-cols-[1.2fr_1fr]",
				children: [/* @__PURE__ */ jsxs("section", {
					className: "card-soft p-6",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "text-lg font-semibold",
							children: t("Το πιάτο του καθενός")
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: profiles.map((p) => /* @__PURE__ */ jsxs("button", {
								onClick: () => setWho(p.id),
								className: cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm", who === p.id ? "bg-card shadow-lift" : "bg-muted/60 text-muted-foreground"),
								children: [/* @__PURE__ */ jsx("span", {
									className: "size-2.5 rounded-full",
									style: { background: p.accent }
								}), p.name]
							}, p.id))
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3",
							children: /* @__PURE__ */ jsx(PlateList, {
								recipe: r,
								profile: me,
								load: loadOf(s, me.id)
							})
						})
					]
				}), /* @__PURE__ */ jsxs("section", {
					className: "card-soft p-6",
					children: [
						/* @__PURE__ */ jsxs("h2", {
							className: "text-lg font-semibold",
							children: [t("Θρεπτικά για"), me.name]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-4 grid grid-cols-2 gap-3",
							children: [
								[t("Ενέργεια"), `${nf(m.kcal, 0, language)} kcal`],
								[t("Πρωτεΐνη"), `${nf(m.p, 1, language)} g`],
								[t("Υδατάνθρακες"), `${nf(m.c, 1, language)} g`],
								[t("Λίπος"), `${nf(m.f, 1, language)} g`],
								[t("Ίνες"), `${nf(m.fib, 1, language)} g`],
								[t("Σίδηρος"), `${nf(m.fe, 1, language)} mg`],
								[t("Ασβέστιο"), `${nf(m.ca, 0, language)} mg`],
								[t("Αλάτι"), `${nf(saltGrams(m.na), 1, language)} g`]
							].map(([k, v]) => /* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl bg-surface p-3",
								children: [/* @__PURE__ */ jsx("p", {
									className: "text-xs text-muted-foreground",
									children: k
								}), /* @__PURE__ */ jsx("p", {
									className: "font-display text-lg font-semibold tabular",
									children: v
								})]
							}, k))
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-4 text-xs text-muted-foreground",
							children: [
								t("Μερίδα αναφοράς:"),
								nf(kcalFromMacros(r.base), 0, language),
								" ",
								t("kcal. Τιμές από USDA FoodData Central, ενέργεια με τους συντελεστές της ΕΕ (4/4/9, ίνες 2).")
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "card-soft p-6",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-semibold",
					children: t("Βήματα")
				}), /* @__PURE__ */ jsx("ol", {
					className: "mt-4 space-y-3",
					children: r.steps.map((st, i) => /* @__PURE__ */ jsxs("li", {
						className: "flex gap-4",
						children: [/* @__PURE__ */ jsx("span", {
							className: "grid size-8 shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground",
							children: i + 1
						}), /* @__PURE__ */ jsx("p", {
							className: "pt-1",
							children: t(st)
						})]
					}, i))
				})]
			}),
			cook !== null && /* @__PURE__ */ jsxs("div", {
				className: "fixed inset-0 z-50 flex flex-col bg-background p-6 sm:p-12",
				role: "dialog",
				"aria-label": t("Λειτουργία μαγειρέματος"),
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ jsxs("p", {
							className: "text-sm text-muted-foreground",
							children: [
								t(r.name),
								" ",
								t("· Βήμα"),
								cook + 1,
								" ",
								t("από"),
								r.steps.length
							]
						}), /* @__PURE__ */ jsx(Button, {
							variant: "ghost",
							size: "icon",
							"aria-label": t("Κλείσιμο"),
							onClick: () => setCook(null),
							children: /* @__PURE__ */ jsx(X, {})
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-4 h-1.5 overflow-hidden rounded-full bg-muted",
						children: /* @__PURE__ */ jsx("div", {
							className: "h-full bg-primary transition-all",
							style: { width: `${(cook + 1) / r.steps.length * 100}%` }
						})
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mx-auto my-auto max-w-3xl text-center font-display text-3xl leading-snug sm:text-5xl",
						children: t(r.steps[cook])
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mx-auto flex w-full max-w-md gap-3",
						children: [/* @__PURE__ */ jsx(Button, {
							size: "lg",
							variant: "outline",
							className: "h-14 flex-1 rounded-full",
							disabled: cook === 0,
							onClick: () => setCook(cook - 1),
							children: t("Πίσω")
						}), cook < r.steps.length - 1 ? /* @__PURE__ */ jsx(Button, {
							size: "lg",
							className: "h-14 flex-[2] rounded-full text-base",
							onClick: () => setCook(cook + 1),
							children: t("Επόμενο βήμα")
						}) : /* @__PURE__ */ jsx(Button, {
							size: "lg",
							className: "h-14 flex-[2] rounded-full text-base",
							onClick: () => setCook(null),
							children: t("Καλή όρεξη!")
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { Recipe as component };
