import { A as AISLES, H as Button, O as addDays, U as cn, a as recipeById, c as todayKey, d as useStore, f as withPlate, h as buildShoppingList, i as planFor, k as mondayOf, r as loadOf, s as setState, t as useI18n } from "./i18n-Bg74tMYw.js";
import { r as PageHeader } from "./AppShell-Dn_obJbp.js";
import { n as nf } from "./format-C0mha9bs.js";
import { useMemo, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Check, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
//#region src/routes/shopping.tsx?tsr-split=component
var fmtQty = (qty, unit) => unit === "g" && qty >= 1e3 ? `${nf(qty / 1e3, 2)} kg` : unit === "ml" && qty >= 1e3 ? `${nf(qty / 1e3, 2)} L` : `${nf(qty)} ${unit === "τεμ" ? "τεμ." : unit}`;
function Shopping() {
	const { t, pick, language } = useI18n();
	const s = useStore((x) => x);
	const [next, setNext] = useState(false);
	const monday = addDays(mondayOf(todayKey()), next ? 7 : 0);
	const items = useMemo(() => {
		return buildShoppingList({
			days: Array.from({ length: 7 }, (_, i) => ({ plan: planFor(addDays(monday, i)) })),
			profiles: s.profiles.map((p) => withPlate(p, loadOf(s, p.id))),
			recipeById,
			loadFor: (p) => loadOf(s, p.id)
		});
	}, [
		monday,
		s.profiles,
		s.loads
	]);
	const key = (id) => `${monday}:${id}`;
	const checked = items.filter((i) => s.shopChecked[key(i.id)]).length;
	const toggle = (id) => setState((x) => ({
		...x,
		shopChecked: {
			...x.shopChecked,
			[key(id)]: !x.shopChecked[key(id)]
		}
	}));
	const copy = async () => {
		const text = AISLES.map((a) => {
			const list = items.filter((i) => i.aisle === a.id && !s.shopChecked[key(i.id)]);
			return list.length ? `${t(a.label)}\n${list.map((i) => `• ${t(i.name)} — ${t(fmtQty(i.qty, i.unit))}`).join("\n")}` : "";
		}).filter(Boolean).join("\n\n");
		await navigator.clipboard.writeText(text);
		toast.success(t("Η λίστα αντιγράφηκε — στείλ' τη με μήνυμα"));
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			eyebrow: t(`${checked} από ${items.length} στο καλάθι`),
			title: t("Λίστα για ψώνια"),
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "flex rounded-full bg-muted p-1",
						children: [false, true].map((n) => /* @__PURE__ */ jsx("button", {
							onClick: () => setNext(n),
							className: cn("rounded-full px-4 py-1.5 text-sm", next === n ? "bg-card font-medium shadow-lift" : "text-muted-foreground"),
							children: n ? t("Επόμενη εβδομάδα") : t("Αυτή η εβδομάδα")
						}, String(n)))
					}),
					/* @__PURE__ */ jsxs(Button, {
						variant: "outline",
						className: "rounded-full",
						onClick: copy,
						children: [
							/* @__PURE__ */ jsx(Copy, {}),
							" ",
							t("Αντιγραφή")
						]
					}),
					/* @__PURE__ */ jsxs(Button, {
						variant: "ghost",
						className: "rounded-full",
						onClick: () => setState((x) => ({
							...x,
							shopChecked: Object.fromEntries(Object.entries(x.shopChecked).filter(([k]) => !k.startsWith(monday)))
						})),
						children: [
							/* @__PURE__ */ jsx(RotateCcw, {}),
							" ",
							t("Καθαρισμός")
						]
					})
				]
			})
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mb-6 h-2 overflow-hidden rounded-full bg-muted",
			children: /* @__PURE__ */ jsx("div", {
				className: "h-full rounded-full bg-success transition-all duration-500",
				style: { width: `${items.length ? checked / items.length * 100 : 0}%` }
			})
		}),
		/* @__PURE__ */ jsxs("p", {
			className: "mb-5 text-sm text-muted-foreground",
			children: [
				t("Για 7 ημέρες και"),
				s.profiles.length,
				" ",
				t("άτομα, με τη μερίδα του καθενός. Οι ποσότητες στρογγυλεύονται προς τα πάνω στη συσκευασία που αγοράζεις.")
			]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "columns-1 gap-5 md:columns-2 xl:columns-3",
			children: AISLES.map((a) => {
				const list = items.filter((i) => i.aisle === a.id);
				if (!list.length) return null;
				return /* @__PURE__ */ jsxs("section", {
					className: "card-soft mb-5 break-inside-avoid p-5",
					children: [/* @__PURE__ */ jsxs("h2", {
						className: "mb-2 flex justify-between font-semibold",
						children: [/* @__PURE__ */ jsx("span", { children: t(a.label) }), /* @__PURE__ */ jsx("span", {
							className: "text-sm font-normal text-muted-foreground",
							children: list.length
						})]
					}), /* @__PURE__ */ jsx("ul", { children: list.map((i) => {
						const on = !!s.shopChecked[key(i.id)];
						return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", {
							onClick: () => toggle(i.id),
							className: "flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-muted/60",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: cn("grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors", on ? "border-success bg-success text-primary-foreground" : "border-border"),
									children: on && /* @__PURE__ */ jsx(Check, { className: "size-3.5" })
								}),
								/* @__PURE__ */ jsx("span", {
									className: cn("flex-1 text-[15px]", on && "text-muted-foreground line-through"),
									children: t(i.name)
								}),
								/* @__PURE__ */ jsx("span", {
									className: cn("tabular text-sm font-semibold", on && "text-muted-foreground"),
									children: t(fmtQty(i.qty, i.unit))
								})
							]
						}) }, i.id);
					}) })]
				}, a.id);
			})
		})
	] });
}
//#endregion
export { Shopping as component };
