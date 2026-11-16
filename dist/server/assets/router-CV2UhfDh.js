import { t as AppShell } from "./AppShell-Dn_obJbp.js";
import { t as Route$9 } from "./meals._id-B8Tf5Bu1.js";
import { ClientOnly, HeadContent, Link, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
//#region src/styles.css?url
var styles_default = "/family-nutrition-os/assets/styles-DJ5n8fkl.css";
//#endregion
//#region src/components/ui/sonner.tsx
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ jsx(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6",
					children: /* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ jsx("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$8 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Zenith · Οικογενειακή διατροφή" },
			{
				name: "description",
				content: "Ένα μενού για όλη την οικογένεια, με μερίδα σε γραμμάρια για κάθε μέλος."
			},
			{
				property: "og:title",
				content: "Zenith · Οικογενειακή διατροφή"
			},
			{
				property: "og:description",
				content: "Ένα μενού για όλη την οικογένεια, με μερίδα σε γραμμάρια για κάθε μέλος."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: `/family-nutrition-os/favicon.png`,
				type: "image/png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Commissioner:wght@400;500;600;700&family=Literata:opsz,wght@7..72,500;7..72,600;7..72,700&display=swap&subset=greek"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "el",
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [children, /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$8.useRouteContext();
	return /* @__PURE__ */ jsxs(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(ClientOnly, { fallback: /* @__PURE__ */ jsx("div", {
			className: "py-16 text-center text-muted-foreground",
			children: "Zenith…"
		}) }) }), /* @__PURE__ */ jsx(Toaster$1, { position: "top-center" })]
	});
}
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter$7 = () => import("./routes-C3hSp5lv.js");
var Route$7 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Σήμερα · Zenith οικογενειακή διατροφή" },
		{
			name: "description",
			content: "Το επόμενο γεύμα, η μερίδα σου σε γραμμάρια, νερό και η πορεία της ημέρας."
		},
		{
			property: "og:title",
			content: "Σήμερα · Zenith οικογενειακή διατροφή"
		},
		{
			property: "og:description",
			content: "Το επόμενο γεύμα, η μερίδα σου σε γραμμάρια, νερό και η πορεία της ημέρας."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
//#endregion
//#region src/lib/head.ts
var pageHead = (title, description) => ({ meta: [
	{ title: `${title} · Zenith οικογενειακή διατροφή` },
	{
		name: "description",
		content: description
	},
	{
		property: "og:title",
		content: `${title} · Zenith`
	},
	{
		property: "og:description",
		content: description
	},
	{
		property: "og:type",
		content: "website"
	},
	{
		name: "twitter:card",
		content: "summary_large_image"
	}
] });
//#endregion
//#region src/routes/family.tsx
var $$splitComponentImporter$6 = () => import("./family-Cn3RYWaH.js");
var Route$6 = createFileRoute("/family")({
	head: () => pageHead("Οικογένεια", "Τα προφίλ της οικογένειας με στόχους ενέργειας, πρωτεΐνης και νερού."),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
//#endregion
//#region src/routes/guide.tsx
var $$splitComponentImporter$5 = () => import("./guide-BlhsYNYE.js");
var Route$5 = createFileRoute("/guide")({
	head: () => pageHead("Οδηγός & πηγές", "Η μέθοδος, κάθε πηγή με την ημερομηνία ελέγχου, οι κανόνες ασφαλείας και γλωσσάρι."),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
//#endregion
//#region src/routes/plan.tsx
var $$splitComponentImporter$4 = () => import("./plan-BnntvuP1.js");
var Route$4 = createFileRoute("/plan")({
	head: () => pageHead("Πρόγραμμα", "Η εβδομάδα σε μια ματιά: 28 ημέρες εναλλαγής με την ενέργεια κάθε ημέρας."),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
//#endregion
//#region src/routes/progress.tsx
var $$splitComponentImporter$3 = () => import("./progress-D7B_m50z.js");
var Route$3 = createFileRoute("/progress")({
	head: () => pageHead("Πρόοδος οικογένειας · Family progress", "Completed meals and training for each family member, with recorded minutes and personal weight trends."),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
//#endregion
//#region src/routes/shopping.tsx
var $$splitComponentImporter$2 = () => import("./shopping-De-7stfz.js");
var Route$2 = createFileRoute("/shopping")({
	head: () => pageHead("Ψώνια", "Λίστα για όλη την εβδομάδα, στρογγυλεμένη στις συσκευασίες και ομαδοποιημένη ανά διάδρομο."),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
//#endregion
//#region src/routes/training.tsx
var $$splitComponentImporter$1 = () => import("./training-BcbCAmyV.js");
var Route$1 = createFileRoute("/training")({
	head: () => pageHead("Προπόνηση οικογένειας · Family training", "Age-aware training for every family member with guided exercises, readiness checks and evidence links."),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
//#endregion
//#region src/routes/meals.index.tsx
var $$splitComponentImporter = () => import("./meals.index-BGtL3d48.js");
var Route = createFileRoute("/meals/")({
	head: () => pageHead("Συνταγές", "40 ελληνικές συνταγές με θρεπτικά στοιχεία από USDA για κάθε μερίδα."),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
//#region src/routeTree.gen.ts
var IndexRoute = Route$7.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$8
});
var FamilyRoute = Route$6.update({
	id: "/family",
	path: "/family",
	getParentRoute: () => Route$8
});
var GuideRoute = Route$5.update({
	id: "/guide",
	path: "/guide",
	getParentRoute: () => Route$8
});
var PlanRoute = Route$4.update({
	id: "/plan",
	path: "/plan",
	getParentRoute: () => Route$8
});
var ProgressRoute = Route$3.update({
	id: "/progress",
	path: "/progress",
	getParentRoute: () => Route$8
});
var ShoppingRoute = Route$2.update({
	id: "/shopping",
	path: "/shopping",
	getParentRoute: () => Route$8
});
var TrainingRoute = Route$1.update({
	id: "/training",
	path: "/training",
	getParentRoute: () => Route$8
});
var MealsIndexRoute = Route.update({
	id: "/meals/",
	path: "/meals/",
	getParentRoute: () => Route$8
});
var rootRouteChildren = {
	IndexRoute,
	FamilyRoute,
	GuideRoute,
	PlanRoute,
	ProgressRoute,
	ShoppingRoute,
	TrainingRoute,
	MealsIdRoute: Route$9.update({
		id: "/meals/$id",
		path: "/meals/$id",
		getParentRoute: () => Route$8
	}),
	MealsIndexRoute
};
var routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
