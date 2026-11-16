import { a as recipeById } from "./i18n-Bg74tMYw.js";
import { createFileRoute, lazyRouteComponent, notFound } from "@tanstack/react-router";
//#region src/routes/meals.$id.tsx
var $$splitComponentImporter = () => import("./meals._id-bxr9_oxW.js");
var Route = createFileRoute("/meals/$id")({
	loader: ({ params }) => {
		const r = recipeById(params.id);
		if (!r) throw notFound();
		return {
			name: r.name,
			slot: r.slot
		};
	},
	head: ({ loaderData }) => ({ meta: [
		{ title: `${loaderData?.name ?? "Συνταγή"} · Zenith` },
		{
			name: "description",
			content: `${loaderData?.name}: υλικά, βήματα και η μερίδα κάθε μέλους της οικογένειας.`
		},
		{
			property: "og:title",
			content: `${loaderData?.name ?? "Συνταγή"} · Zenith`
		},
		{
			property: "og:description",
			content: "Υλικά, βήματα και η μερίδα κάθε μέλους της οικογένειας."
		},
		{
			property: "og:type",
			content: "article"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
