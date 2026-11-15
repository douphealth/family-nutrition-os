import { useSyncExternalStore } from "react";
import { FAMILY, PLAN_28, RECIPES } from "@/engine/data";
import { cycleDayIndex, localDateKey } from "@/engine/dates";
import { plateScale, rotationEnergy } from "@/engine/nutrition-engine";
import { mergeChangedState, parseSavedState, readDurableState, writeDurableState } from './persistence';

export type MealStatus = "done" | "skipped";
export interface DayLog { meals: Record<string, { status: MealStatus; portion: number }>; waterMl: number }
export interface Profile {
  id: string; name: string; relation: string; role: string; sex: "m" | "f"; age: number; height: number;
  weight: number; activityFactor: number; goal: string; athlete: boolean; accent: string; notes: string; plate?: number;
}
export interface State {
  language?: 'el' | 'en';
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
  language: 'el',
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
export type SaveStatus = 'loading' | 'saving' | 'saved' | 'fallback' | 'error';
let saveStatus: SaveStatus = 'loading';
let revision = 0;
let writeQueue = Promise.resolve();
const statusListeners = new Set<() => void>();
function status(value: SaveStatus) { saveStatus = value; statusListeners.forEach(l => l()); }
function notify() { listeners.forEach(l => l()); }
function localSaved(): State | null {
  try { const raw = localStorage.getItem(KEY); return raw ? parseSavedState(JSON.parse(raw)) : null; }
  catch { return null; }
}
function persist() {
  const snapshot = structuredClone(state);
  const stamp = Date.now();
  revision += 1;
  const writingRevision = revision;
  status('saving');
  let localOk = false;
  try { localStorage.setItem(KEY, JSON.stringify(snapshot)); localStorage.setItem(`${KEY}-saved-at`, String(stamp)); localOk = true; } catch { /* Durable store remains available. */ }
  writeQueue = writeQueue.then(async () => {
    try { await writeDurableState(snapshot, stamp); if (revision === writingRevision) status('saved'); }
    catch { if (revision === writingRevision) status(localOk ? 'fallback' : 'error'); }
  });
}

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const local = localSaved();
  if (local) state = local;
  const startingRevision = revision;
  let stamp = 0;
  try { stamp = Number(localStorage.getItem(`${KEY}-saved-at`)) || 0; } catch { /* IndexedDB may still work. */ }
  void readDurableState().then(row => {
    if (revision !== startingRevision) return;
    if (row && (!local || row.savedAt > stamp)) { state = row.state; notify(); }
    persist();
  }).catch(() => { if (revision === startingRevision) status(local ? 'fallback' : 'error'); });
  window.addEventListener('storage', event => {
    if (event.key !== KEY || !event.newValue) return;
    try { state = parseSavedState(JSON.parse(event.newValue)); revision += 1; notify(); status('saved'); }
    catch { /* Invalid writes must never erase family data. */ }
  });
  void navigator.storage?.persist?.().catch(() => false);
}

export function setState(fn: (s: State) => State) {
  load();
  const next = fn(state);
  const latest = typeof window === 'undefined' ? null : localSaved();
  state = latest ? mergeChangedState(state, next, latest) : next;
  persist();
  notify();
}

/** Restore is explicitly replacement, not a partial edit. */
export function restoreState(input: unknown) { load(); state = parseSavedState(input); persist(); notify(); }
export function useSaveStatus() {
  return useSyncExternalStore(cb => { statusListeners.add(cb); return () => statusListeners.delete(cb); }, () => saveStatus, () => 'loading' as SaveStatus);
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
