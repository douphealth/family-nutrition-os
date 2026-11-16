import { E as targetsFor, H as Button, M as GOALS, d as useStore, f as withPlate, g as canUseAdultBmi, m as bmi, o as restoreState, p as adultBmiLabel, r as loadOf, s as setState, t as useI18n, y as isMinor } from "./i18n-Bg74tMYw.js";
import { r as PageHeader } from "./AppShell-Dn_obJbp.js";
import { t as Input } from "./input-BaDDcapO.js";
import { n as nf } from "./format-C0mha9bs.js";
import { useRef } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
//#region src/routes/family.tsx?tsr-split=component
function Family() {
	const { t: tr, pick, language } = useI18n();
	const s = useStore((x) => x);
	const file = useRef(null);
	const edit = (id, patch) => setState((x) => ({
		...x,
		profiles: x.profiles.map((p) => p.id === id ? {
			...p,
			...patch
		} : p)
	}));
	const exportJson = () => {
		const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `zenith-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
	};
	const importJson = async (f) => {
		try {
			restoreState(JSON.parse(await f.text()));
			toast.success(tr("Το αντίγραφο επαναφέρθηκε"));
		} catch {
			toast.error(tr("Το αρχείο δεν είναι έγκυρο αντίγραφο"));
		}
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageHeader, {
			eyebrow: tr(`${s.profiles.length} μέλη`),
			title: tr("Η οικογένεια"),
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex gap-2",
				children: [
					/* @__PURE__ */ jsxs(Button, {
						variant: "outline",
						className: "rounded-full",
						onClick: exportJson,
						children: [
							/* @__PURE__ */ jsx(Download, {}),
							" ",
							tr("Αντίγραφο ασφαλείας")
						]
					}),
					/* @__PURE__ */ jsxs(Button, {
						variant: "ghost",
						className: "rounded-full",
						onClick: () => file.current?.click(),
						children: [
							/* @__PURE__ */ jsx(Upload, {}),
							" ",
							tr("Επαναφορά")
						]
					}),
					/* @__PURE__ */ jsx("input", {
						ref: file,
						type: "file",
						accept: "application/json",
						hidden: true,
						onChange: (e) => e.target.files?.[0] && importJson(e.target.files[0])
					})
				]
			})
		}),
		/* @__PURE__ */ jsx("p", {
			className: "mb-6 border-l-2 border-primary pl-4 text-sm text-muted-foreground",
			children: pick("Οι αλλαγές μένουν σε αυτή τη συσκευή. Κράτα αντίγραφο πριν καθαρίσεις δεδομένα του προγράμματος περιήγησης. Ο συγχρονισμός μεταξύ κινητών δεν έχει συνδεθεί ακόμη.", "Changes stay on this device. Export a backup before clearing browser data. Cross-phone sync is not connected yet.")
		}),
		/* @__PURE__ */ jsx("div", {
			className: "grid gap-6 md:grid-cols-2",
			children: s.profiles.map((raw) => {
				const p = withPlate(raw, loadOf(s, raw.id));
				const t = targetsFor(p, loadOf(s, p.id));
				const minor = isMinor(p);
				return /* @__PURE__ */ jsxs("article", {
					className: "card-soft overflow-hidden",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-4 p-6",
							style: { background: `color-mix(in oklab, ${p.accent} 12%, transparent)` },
							children: [/* @__PURE__ */ jsx("span", {
								className: "grid size-14 place-items-center rounded-2xl font-display text-2xl font-semibold text-primary-foreground",
								style: { background: p.accent },
								children: p.name.charAt(0)
							}), /* @__PURE__ */ jsxs("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ jsx(Input, {
									value: p.name,
									onChange: (e) => edit(p.id, { name: e.target.value }),
									className: "h-9 border-transparent bg-transparent px-1 font-display text-xl font-semibold shadow-none hover:border-border",
									"aria-label": tr("Όνομα")
								}), /* @__PURE__ */ jsxs("p", {
									className: "px-1 text-sm text-muted-foreground",
									children: [
										tr(p.relation),
										" · ",
										tr(p.role)
									]
								})]
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-3 gap-3 p-6 pb-0",
							children: [
								/* @__PURE__ */ jsx(Stat, {
									label: tr("Ενέργεια"),
									value: `${nf(t.energy.lower, 0, language)}–${nf(t.energy.upper, 0, language)}`,
									unit: "kcal"
								}),
								/* @__PURE__ */ jsx(Stat, {
									label: tr("Πρωτεΐνη"),
									value: `${t.protein.min}–${t.protein.max}`,
									unit: "g"
								}),
								/* @__PURE__ */ jsx(Stat, {
									label: tr("Νερό"),
									value: nf(t.hydration.ml / 1e3, 1, language),
									unit: tr("L ροφήματα")
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-3 gap-3 p-6",
							children: [
								/* @__PURE__ */ jsx(Field, {
									label: tr("Ηλικία"),
									value: p.age,
									onChange: (v) => edit(p.id, { age: v })
								}),
								/* @__PURE__ */ jsx(Field, {
									label: tr("Ύψος (cm)"),
									value: p.height,
									onChange: (v) => edit(p.id, { height: v })
								}),
								/* @__PURE__ */ jsx(Field, {
									label: tr("Βάρος (kg)"),
									value: p.weight,
									onChange: (v) => edit(p.id, { weight: v })
								}),
								/* @__PURE__ */ jsxs("label", {
									className: "col-span-3 text-sm",
									children: [/* @__PURE__ */ jsx("span", {
										className: "mb-1 block text-muted-foreground",
										children: tr("Στόχος")
									}), /* @__PURE__ */ jsx("select", {
										value: p.goal,
										onChange: (e) => edit(p.id, { goal: e.target.value }),
										className: "h-10 w-full rounded-xl border bg-card px-3",
										children: GOALS.filter(([g]) => !(minor && g === "gradual_fat_loss")).map(([g, l]) => /* @__PURE__ */ jsx("option", {
											value: g,
											children: tr(l)
										}, g))
									})]
								})
							]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "border-t bg-surface/60 px-6 py-3 text-xs text-muted-foreground",
							children: [
								canUseAdultBmi(p) ? `BMI ${nf(bmi(p), 1, language)} · ${tr(adultBmiLabel(p))}` : tr("Ανήλικος: χωρίς περιορισμό θερμίδων και χωρίς κατηγορίες BMI ενηλίκων."),
								" ",
								tr(t.energy.note)
							]
						})
					]
				}, p.id);
			})
		})
	] });
}
function Stat({ label, value, unit }) {
	const { t, pick, language } = useI18n();
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-2xl bg-surface p-3",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ jsx("p", {
				className: "font-display text-lg font-semibold leading-tight tabular",
				children: value
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-[11px] text-muted-foreground",
				children: unit
			})
		]
	});
}
function Field({ label, value, onChange }) {
	const { t, pick, language } = useI18n();
	return /* @__PURE__ */ jsxs("label", {
		className: "text-sm",
		children: [/* @__PURE__ */ jsx("span", {
			className: "mb-1 block text-muted-foreground",
			children: label
		}), /* @__PURE__ */ jsx(Input, {
			type: "number",
			value,
			onChange: (e) => {
				const n = Number(e.target.value);
				if (n > 0) onChange(n);
			},
			className: "h-10 rounded-xl"
		})]
	});
}
//#endregion
export { Family as component };
