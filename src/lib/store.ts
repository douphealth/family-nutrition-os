import { useSyncExternalStore } from "react";
import { FAMILY, PLAN_28, RECIPES } from "@/engine/data";
import { cycleDayIndex, localDateKey } from "@/engine/dates";
import { plateScale, rotationEnergy } from "@/engine/nutrition-engine";

export type MealStatus = "done" | "skipped";
export interface DayLog { meals: Record<string, { status: MealStatus; portion: number }>; waterMl: number }
export interface Profile {
  id: string; name: string; relation: string; role: string; sex: "m" | "f"; age: number; height: number;
  weight: number; activityFactor: number; goal: string; athlete: boolean; accent: string; notes: string; plate?: number;
}
export interface State {
  profiles: Profile[];
  activeId: string;
  loads: Record<string, string>;
  logs: Record<string, Record<string, DayLog>>;
  measurements: Record<string, { date: string; weight: number }[]>;
  shopChecked: Record<string, boolean>;
  trainingSettings?: Record<string, any>;
  trainingLogs?: Record<string, any>;
}

const KEY = "fnos-state-v1";
const recipeMap = new Map<string, any>(RECIPES.map((r: any) => [r.id, r]));
export const recipeById = (id: string) => recipeMap.get(id) ?? null;
export const planFor = (dateKey: string) => PLAN_28[cycleDayIndex(dateKey) - 1];
export const todayKey = () => localDateKey(new Date());

/** Same calibration the original app applies: scale the plate so the rotation lands mid-range. */
export function withPlate(p: Profile, load = "normal"): Profile {
  const kcal = rotationEnergy(p, load, PLAN_28, recipeById);
  return { ...p, plate: plateScale(p, kcal, load) };
}

const initial = (): State => ({
  profiles: FAMILY.map((p: Profile) => ({ ...p })),
  activeId: FAMILY[0].id,
  loads: { son: "normal" },
  logs: {},
  measurements: {},
  shopChecked: {},
  trainingSettings: {},
  trainingLogs: {},
});

let state: State = initial();
let hydrated = false;
const listeners = new Set<() => void>();

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial(), ...JSON.parse(raw) };
  } catch { /* keep defaults */ }
}

export function setState(fn: (s: State) => State) {
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}

const serverState = initial();
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => { load(); listeners.add(cb); cb(); return () => listeners.delete(cb); },
    () => sel(state),
    () => sel(serverState),
  );
}

export const emptyLog = (): DayLog => ({ meals: {}, waterMl: 0 });
const EMPTY_LOG: DayLog = Object.freeze({ meals: {}, waterMl: 0 }) as DayLog;
export function getLog(s: State, id: string, date: string): DayLog {
  return s.logs[id]?.[date] ?? EMPTY_LOG;
}
export function updateLog(id: string, date: string, fn: (l: DayLog) => DayLog) {
  setState((s) => ({
    ...s,
    logs: { ...s.logs, [id]: { ...(s.logs[id] ?? {}), [date]: fn(getLog(s, id, date)) } },
  }));
}
export const loadOf = (s: State, id: string) => s.loads[id] ?? "normal";
