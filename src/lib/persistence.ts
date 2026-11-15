import Dexie, { type Table } from 'dexie';
import { z } from 'zod';
import type { State } from './store';

const profileSchema = z.object({
  id: z.string().min(1), name: z.string(), relation: z.string(), role: z.string(),
  sex: z.enum(['m', 'f']), age: z.number().positive(), height: z.number().positive(),
  weight: z.number().positive(), activityFactor: z.number().positive(), goal: z.string(),
  athlete: z.boolean(), accent: z.string(), notes: z.string(), plate: z.number().optional(),
});
const daySchema = z.object({
  meals: z.record(z.object({ status: z.enum(['done', 'skipped']), portion: z.number().positive() })),
  waterMl: z.number().nonnegative(),
});
const stateSchema = z.object({
  language: z.enum(['el', 'en']).optional(), profiles: z.array(profileSchema).nonempty(),
  activeId: z.string(), loads: z.record(z.string()).default({}),
  logs: z.record(z.record(daySchema)).default({}),
  measurements: z.record(z.array(z.object({ date: z.string(), weight: z.number().positive() }))).default({}),
  shopChecked: z.record(z.boolean()).default({}),
  trainingSettings: z.record(z.record(z.unknown())).default({}),
  trainingLogs: z.record(z.record(z.unknown())).default({}),
});
export function parseSavedState(input: unknown): State {
  const parsed = stateSchema.parse(input);
  if (new Set(parsed.profiles.map(p => p.id)).size !== parsed.profiles.length) throw new Error('Duplicate member IDs');
  if (!parsed.profiles.some(p => p.id === parsed.activeId)) throw new Error('Unknown active member');
  const { language, profiles, ...rest } = parsed;
  return { ...rest, ...(language ? { language } : {}), profiles: profiles.map(p => {
    const { plate, ...profile } = p;
    return { ...profile, ...(plate === undefined ? {} : { plate }) };
  }) };
}

interface SavedFamily { id: string; savedAt: number; state: State }
let database: (Dexie & { family: Table<SavedFamily> }) | undefined;
function getDatabase() {
  if (!database) {
    database = new Dexie('zenith-family-v1') as Dexie & { family: Table<SavedFamily> };
    database.version(1).stores({ family: 'id' });
  }
  return database;
}
export async function readDurableState() {
  const row = await getDatabase().family.get('household');
  return row ? { ...row, state: parseSavedState(row.state) } : null;
}
export async function writeDurableState(state: State, savedAt: number) {
  await getDatabase().family.put({ id: 'household', state: structuredClone(state), savedAt });
}

/** Merge only the leaf values changed by this action, preserving another tab's unrelated edits. */
export function mergeChangedState(before: State, after: State, latest: State): State {
  function merge(a: unknown, b: unknown, c: unknown): unknown {
    if (JSON.stringify(a) === JSON.stringify(b)) return c;
    if (Array.isArray(a) && Array.isArray(b) && Array.isArray(c) && b.every(x => x && typeof x === 'object' && 'id' in x)) {
      return b.map(item => merge(a.find(x => x.id === item.id), item, c.find(x => x.id === item.id) ?? item));
    }
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      const aa = a as Record<string, unknown>, bb = b as Record<string, unknown>;
      const result = { ...(c && typeof c === 'object' ? c : {}) } as Record<string, unknown>;
      for (const key of new Set([...Object.keys(aa), ...Object.keys(bb)])) {
        if (!(key in bb)) delete result[key];
        else result[key] = merge(aa[key], bb[key], result[key]);
      }
      return result;
    }
    return b;
  }
  return merge(before, after, latest) as State;
}