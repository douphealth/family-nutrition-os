import { B as RECIPES, F as SLOTS, I as SLOT_LABEL, S as nutritionBadges, U as cn, b as kcalFromMacros, t as useI18n } from "./i18n-Bg74tMYw.js";
import { r as PageHeader } from "./AppShell-Dn_obJbp.js";
import { t as Input } from "./input-BaDDcapO.js";
import { n as nf } from "./format-C0mha9bs.js";
import { t as SLOT_IMAGE } from "./images-CsQcqoZO.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Clock, Search } from "lucide-react";
//#region src/routes/meals.index.tsx?tsr-split=component
var TONE = {
	blue: "bg-aegean/10 text-aegean",
	accent: "bg-olive/10 text-olive",
	rose: "bg-terracotta/10 text-terracotta",
	gold: "bg-sun/20 text-foreground",
	warn: "bg-destructive/10 text-destructive"
};
function Meals() {
	const { t, pick, language } = useI18n();
	const [slot, setSlot] = useState("all");
	const [q, setQ] = useState("");
	const list = RECIPES.filter((r) => (slot === "all" || r.slot === slot) && `${r.name} ${t(r.name)}`.toLowerCase().includes(q.toLowerCase()));
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			eyebrow: t(`${RECIPES.length} συνταγές`),
			title: t("Τι θα μαγειρέψουμε;")
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "relative sm:w-72",
				children: [/* @__PURE__ */ jsx(Search, { className: "absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ jsx(Input, {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: t("Αναζήτηση συνταγής…"),
					className: "h-11 rounded-full bg-card pl-10"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap gap-2",
				children: ["all", ...SLOTS].map((s) => /* @__PURE__ */ jsx("button", {
					onClick: () => setSlot(s),
					className: cn("rounded-full border px-4 py-2 text-sm transition-colors", slot === s ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"),
					children: s === "all" ? t("Όλες") : t(SLOT_LABEL[s])
				}, s))
			})]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
			children: list.map((r) => /* @__PURE__ */ jsxs(Link, {
				to: "/meals/$id",
				params: { id: r.id },
				className: "card-soft group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "relative h-40 overflow-hidden",
					children: [/* @__PURE__ */ jsx("img", {
						src: SLOT_IMAGE[r.slot],
						alt: "",
						loading: "lazy",
						width: 816,
						height: 816,
						className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
					}), /* @__PURE__ */ jsx("span", {
						className: "absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-medium backdrop-blur",
						children: t(SLOT_LABEL[r.slot])
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "p-5",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "font-display text-lg font-semibold leading-snug",
							children: t(r.name)
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-1 flex items-center gap-3 text-sm text-muted-foreground tabular",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "flex items-center gap-1",
									children: [
										/* @__PURE__ */ jsx(Clock, { className: "size-3.5" }),
										r.time,
										"′"
									]
								}),
								/* @__PURE__ */ jsxs("span", { children: [nf(kcalFromMacros(r.base)), " kcal"] }),
								/* @__PURE__ */ jsxs("span", { children: [
									nf(r.base.p),
									" ",
									t("g πρωτ.")
								] })
							]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 flex flex-wrap gap-1.5",
							children: nutritionBadges(r).map((b) => /* @__PURE__ */ jsx("span", {
								className: cn("rounded-full px-2.5 py-0.5 text-xs font-medium", TONE[b.tone]),
								children: t(b.label)
							}, b.id))
						})
					]
				})]
			}, r.id))
		})
	] });
}
//#endregion
export { Meals as component };
