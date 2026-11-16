//#region src/lib/format.ts
var nf = (n, d = 0, language = "el") => new Intl.NumberFormat(language === "en" ? "en-GB" : "el-GR", {
	maximumFractionDigits: d,
	minimumFractionDigits: 0
}).format(n);
var greekDate = (key, opts = {
	weekday: "long",
	day: "numeric",
	month: "long"
}, language = "el") => {
	const [y, m, d] = key.split("-").map(Number);
	return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "el-GR", opts).format(new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1));
};
//#endregion
export { nf as n, greekDate as t };
