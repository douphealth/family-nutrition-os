import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/Ring.tsx
function Ring({ value, max, size = 132, stroke = 12, color = "var(--olive)", children }) {
	const r = (size - stroke) / 2;
	const c = 2 * Math.PI * r;
	const pct = max > 0 ? Math.min(1, value / max) : 0;
	return /* @__PURE__ */ jsxs("div", {
		className: "relative grid place-items-center",
		style: {
			width: size,
			height: size
		},
		children: [/* @__PURE__ */ jsxs("svg", {
			width: size,
			height: size,
			className: "-rotate-90",
			children: [/* @__PURE__ */ jsx("circle", {
				cx: size / 2,
				cy: size / 2,
				r,
				fill: "none",
				stroke: "var(--muted)",
				strokeWidth: stroke
			}), /* @__PURE__ */ jsx("circle", {
				cx: size / 2,
				cy: size / 2,
				r,
				fill: "none",
				stroke: color,
				strokeWidth: stroke,
				strokeLinecap: "round",
				strokeDasharray: c,
				strokeDashoffset: c * (1 - pct),
				style: { transition: "stroke-dashoffset 0.8s cubic-bezier(.2,.7,.2,1)" }
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "absolute inset-0 grid place-items-center text-center",
			children
		})]
	});
}
function Bar({ value, max, color = "var(--olive)", marker }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "relative h-2.5 overflow-hidden rounded-full bg-muted",
		children: [/* @__PURE__ */ jsx("div", {
			className: "h-full rounded-full transition-all duration-700",
			style: {
				width: `${max > 0 ? Math.min(100, value / max * 100) : 0}%`,
				background: color
			}
		}), marker != null && max > 0 && /* @__PURE__ */ jsx("div", {
			className: "absolute inset-y-0 w-0.5 bg-foreground/40",
			style: { left: `${Math.min(100, marker / max * 100)}%` }
		})]
	});
}
//#endregion
export { Ring as n, Bar as t };
