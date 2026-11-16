import { d as useStore, f as withPlate, r as loadOf } from "./i18n-Bg74tMYw.js";
import { useMemo } from "react";
//#region src/lib/useActive.ts
function useActive() {
	const profiles = useStore((s) => s.profiles);
	const activeId = useStore((s) => s.activeId);
	const load = useStore((s) => loadOf(s, s.activeId));
	const raw = profiles.find((p) => p.id === activeId) ?? profiles[0];
	if (!raw) throw new Error("No family profiles available");
	return {
		profile: useMemo(() => withPlate(raw, load), [raw, load]),
		load,
		profiles
	};
}
//#endregion
export { useActive as t };
