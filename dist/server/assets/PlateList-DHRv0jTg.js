import { T as scaledIngredients, V as qtyOf, t as useI18n } from "./i18n-Bg74tMYw.js";
import { n as nf } from "./format-C0mha9bs.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/PlateList.tsx
function PlateList({ recipe, profile, load, portion = 1 }) {
	const { t, pick, language } = useI18n();
	return /* @__PURE__ */ jsx("ul", {
		className: "divide-y divide-border/70",
		children: scaledIngredients(recipe, profile, load, portion).map(({ ing, g }, i) => {
			const q = qtyOf(ing, g);
			const unit = ing.u === "τεμ" ? t("τεμ.") : ing.u;
			return /* @__PURE__ */ jsxs("li", {
				className: "flex items-baseline justify-between gap-3 py-2 text-[15px]",
				children: [/* @__PURE__ */ jsx("span", { children: t(ing.n) }), /* @__PURE__ */ jsxs("span", {
					className: "tabular shrink-0 font-semibold",
					children: [
						ing.u === "τεμ" ? nf(q, 1, language) : nf(Math.round(q / 5) * 5, 0, language),
						" ",
						/* @__PURE__ */ jsx("span", {
							className: "font-normal text-muted-foreground",
							children: unit
						}),
						ing.u !== "g" && /* @__PURE__ */ jsxs("span", {
							className: "ml-1 text-xs font-normal text-muted-foreground",
							children: [
								"(",
								nf(Math.round(g), 0, language),
								" g)"
							]
						})
					]
				})]
			}, i);
		})
	});
}
//#endregion
export { PlateList as t };
