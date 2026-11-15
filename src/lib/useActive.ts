import { useMemo } from "react";
import { loadOf, useStore, withPlate } from "./store";

export function useActive() {
  const profiles = useStore((s) => s.profiles);
  const activeId = useStore((s) => s.activeId);
  const load = useStore((s) => loadOf(s, s.activeId));
  const raw = profiles.find((p) => p.id === activeId) ?? profiles[0]!;
  const profile = useMemo(() => withPlate(raw, load), [raw, load]);
  return { profile, load, profiles };
}
