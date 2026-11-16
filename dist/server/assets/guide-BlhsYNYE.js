import { N as METHOD, P as SAFETY, R as SOURCES, j as GLOSSARY, t as useI18n } from "./i18n-Bg74tMYw.js";
import { r as PageHeader } from "./AppShell-Dn_obJbp.js";
import { t as greekDate } from "./format-C0mha9bs.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ExternalLink, ShieldCheck } from "lucide-react";
//#region src/routes/guide.tsx?tsr-split=component
function Guide() {
	const { t, pick, language } = useI18n();
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			eyebrow: t("Γιατί να εμπιστευτείς τους αριθμούς"),
			title: t("Οδηγός & πηγές")
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "mb-6 rounded-[1.4rem] bg-sidebar p-6 text-sidebar-foreground sm:p-8",
			children: [/* @__PURE__ */ jsxs("h2", {
				className: "flex items-center gap-2 text-xl font-semibold",
				children: [
					/* @__PURE__ */ jsx(ShieldCheck, { className: "size-5 text-sidebar-primary" }),
					" ",
					t("Κανόνες ασφαλείας")
				]
			}), /* @__PURE__ */ jsx("ul", {
				className: "mt-3 grid gap-2 text-sm sm:grid-cols-2",
				children: SAFETY.map((s) => /* @__PURE__ */ jsx("li", {
					className: "rounded-xl bg-sidebar-accent p-3",
					children: t(s)
				}, s))
			})]
		}),
		/* @__PURE__ */ jsx("h2", {
			className: "mb-3 text-2xl font-semibold",
			children: t("Η μέθοδος")
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mb-8 grid gap-4 md:grid-cols-2",
			children: METHOD.map((m) => /* @__PURE__ */ jsxs("article", {
				className: "card-soft p-5",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "font-semibold",
					children: t(m.title)
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1.5 text-sm leading-relaxed text-muted-foreground",
					children: t(m.body)
				})]
			}, t(m.title)))
		}),
		/* @__PURE__ */ jsx("h2", {
			className: "mb-3 text-2xl font-semibold",
			children: t("Πηγές")
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mb-8 card-soft divide-y",
			children: SOURCES.map((s) => /* @__PURE__ */ jsxs("a", {
				href: s.url,
				target: "_blank",
				rel: "noreferrer",
				className: "flex gap-4 p-4 hover:bg-muted/50",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex-1",
					children: [/* @__PURE__ */ jsx("p", {
						className: "font-medium",
						children: s.label
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-0.5 text-sm text-muted-foreground",
						children: t(s.used)
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "shrink-0 text-right text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ jsx(ExternalLink, { className: "ml-auto mb-1 size-4" }),
						t("ελέγχθηκε"),
						/* @__PURE__ */ jsx("br", {}),
						greekDate(s.verified, {
							day: "numeric",
							month: "short",
							year: "numeric"
						}, language)
					]
				})]
			}, s.id))
		}),
		/* @__PURE__ */ jsx("h2", {
			className: "mb-3 text-2xl font-semibold",
			children: t("Γλωσσάρι")
		}),
		/* @__PURE__ */ jsx("dl", {
			className: "grid gap-3 md:grid-cols-2",
			children: GLOSSARY.map(([term, d]) => /* @__PURE__ */ jsxs("div", {
				className: "rounded-2xl bg-surface p-4",
				children: [/* @__PURE__ */ jsx("dt", {
					className: "font-semibold",
					children: t(term)
				}), /* @__PURE__ */ jsx("dd", {
					className: "mt-1 text-sm text-muted-foreground",
					children: t(d)
				})]
			}, term))
		})
	] });
}
//#endregion
export { Guide as component };
