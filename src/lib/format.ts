export const nf = (n: number, d = 0) =>
  new Intl.NumberFormat("el-GR", { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(n);
export const greekDate = (key: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("el-GR", opts).format(new Date(y!, (m ?? 1) - 1, d ?? 1));
};
