import { E as targetsFor, F as SLOTS, H as Button, I as SLOT_LABEL, O as addDays, U as cn, a as recipeById, c as todayKey, i as planFor, k as mondayOf, t as useI18n, v as dayMacros } from "./i18n-Bg74tMYw.js";
import { n as MemberSwitcher, r as PageHeader } from "./AppShell-Dn_obJbp.js";
import { n as nf, t as greekDate } from "./format-C0mha9bs.js";
import { t as SLOT_IMAGE } from "./images-CsQcqoZO.js";
import { t as useActive } from "./useActive-BB3w1w_j.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ChevronLeft, ChevronRight } from "lucide-react";
//#region src/routes/plan.tsx?tsr-split=component
function Plan() {
	const { t: tr, pick, language } = useI18n();
	const { profile, load } = useActive();
	const [offset, setOffset] = useState(0);
	const today = todayKey();
	const monday = addDays(mondayOf(today), offset * 7);
	const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
	const t = targetsFor(profile, load);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			eyebrow: tr(`Εβδομάδα ${planFor(monday).week} από 4`),
			title: tr("Το πρόγραμμα της εβδομάδας"),
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ jsx(Button, {
						variant: "outline",
						size: "icon",
						className: "rounded-full",
						"aria-label": tr("Προηγούμενη"),
						onClick: () => setOffset(offset - 1),
						children: /* @__PURE__ */ jsx(ChevronLeft, {})
					}),
					/* @__PURE__ */ jsx(Button, {
						variant: offset === 0 ? "default" : "outline",
						className: "rounded-full",
						onClick: () => setOffset(0),
						children: tr("Αυτή η εβδομάδα")
					}),
					/* @__PURE__ */ jsx(Button, {
						variant: "outline",
						size: "icon",
						className: "rounded-full",
						"aria-label": tr("Επόμενη"),
						onClick: () => setOffset(offset + 1),
						children: /* @__PURE__ */ jsx(ChevronRight, {})
					})
				]
			})
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mb-6",
			children: /* @__PURE__ */ jsx(MemberSwitcher, {})
		}),
		/* @__PURE__ */ jsxs("p", {
			className: "mb-4 text-sm text-muted-foreground",
			children: [
				tr("Θερμίδες για"),
				profile.name,
				" ",
				tr("· στόχος"),
				nf(t.energy.lower, 0, language),
				"–",
				nf(t.energy.upper, 0, language),
				" kcal"
			]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
			children: days.map((d) => {
				const p = planFor(d);
				const kcal = dayMacros(p, profile, load, {}, recipeById).planned.kcal;
				const inRange = kcal >= t.energy.lower * .9 && kcal <= t.energy.upper * 1.1;
				const isToday = d === today;
				return /* @__PURE__ */ jsxs("article", {
					className: cn("card-soft p-4", isToday && "ring-2 ring-primary"),
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "mb-3 flex items-baseline justify-between",
							children: [/* @__PURE__ */ jsx("h2", {
								className: "font-display text-lg font-semibold capitalize",
								children: greekDate(d, { weekday: "long" }, language)
							}), /* @__PURE__ */ jsxs("span", {
								className: "text-xs text-muted-foreground",
								children: [greekDate(d, {
									day: "numeric",
									month: "short"
								}, language), isToday && tr(" · σήμερα")]
							})]
						}),
						/* @__PURE__ */ jsx("ul", {
							className: "space-y-2",
							children: SLOTS.map((s) => {
								const r = recipeById(p[s]);
								return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
									to: "/meals/$id",
									params: { id: r.id },
									className: "group flex items-center gap-3 rounded-xl p-1 hover:bg-muted",
									children: [/* @__PURE__ */ jsx("img", {
										src: SLOT_IMAGE[s],
										alt: "",
										loading: "lazy",
										width: 816,
										height: 816,
										className: "size-10 rounded-lg object-cover"
									}), /* @__PURE__ */ jsxs("span", {
										className: "min-w-0",
										children: [/* @__PURE__ */ jsx("span", {
											className: "block text-[11px] uppercase tracking-wider text-muted-foreground",
											children: tr(SLOT_LABEL[s])
										}), /* @__PURE__ */ jsx("span", {
											className: "block truncate text-sm font-medium group-hover:underline",
											children: tr(r.name)
										})]
									})]
								}) }, s);
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-3 flex items-center justify-between border-t pt-3 text-sm",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-muted-foreground",
								children: tr("Σύνολο")
							}), /* @__PURE__ */ jsxs("span", {
								className: cn("rounded-full px-2.5 py-0.5 font-semibold tabular", inRange ? "bg-success/10 text-success" : "bg-warning/15 text-foreground"),
								children: [nf(kcal, 0, language), " kcal"]
							})]
						})
					]
				}, d);
			})
		})
	] });
}
//#endregion
export { Plan as component };
