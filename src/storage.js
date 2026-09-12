/**
 * ZENITH PRO · storage layer
 * ---------------------------------------------------------------------------
 * Deliberately keeps the v2 database name and object stores so an existing
 * install upgrades in place with NO data loss. v3 only adds a store (v2 → v3
 * schema bump) and migrates the old flat log shape into the new nested one.
 *
 * Two backends:
 *   1. IndexedDB (preferred)
 *   2. localStorage (fallback, used when IndexedDB is unavailable or blocked —
 *      e.g. some private/incognito modes, or embedded webviews)
 *
 * Every write validates its record. Import is atomic: a bad backup leaves the
 * existing data completely untouched.
 */

const DB_NAME = 'zenith-pro-v2'; // intentionally unchanged from v2 → in-place upgrade
const DB_VERSION = 2;
export const STORES = ['settings', 'profiles', 'logs', 'measurements', 'plans', 'checklists'];

export const BACKUP_SCHEMA = 2;

let dbPromise = null;
let backend = 'idb';

/* ── IndexedDB ─────────────────────────────────────────────────────────── */

export async function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      reject(err);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach(name => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      });
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => { dbPromise = null; reject(req.error || new Error('IndexedDB unavailable')); };
    req.onblocked = () => { dbPromise = null; reject(new Error('IndexedDB upgrade blocked by another tab')); };
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tr = db.transaction(store, mode);
    const os = tr.objectStore(store);
    let result;
    try { result = fn(os); } catch (e) { try { tr.abort(); } catch { /* already aborted */ } reject(e); return; }
    tr.oncomplete = () => resolve(result);
    tr.onerror = () => reject(tr.error || new Error('IndexedDB transaction failed'));
    tr.onabort = () => reject(tr.error || new Error('IndexedDB transaction aborted'));
  }));
}

/* ── localStorage fallback ─────────────────────────────────────────────── */

const lsKey = store => `zenith:ls:${store}`;
function lsRead(store) {
  try { return JSON.parse(localStorage.getItem(lsKey(store)) || '[]') || []; } catch { return []; }
}
function lsWrite(store, rows) {
  localStorage.setItem(lsKey(store), JSON.stringify(rows));
}
async function useFallback() {
  backend = 'local';
  dbPromise = null;
}

export function activeBackend() { return backend; }

/* ── Unified API ───────────────────────────────────────────────────────── */

function assertStore(store) {
  if (!STORES.includes(store)) throw new Error(`Unknown store: ${store}`);
}
function assertRecord(value) {
  if (!value || typeof value !== 'object' || typeof value.id !== 'string' || !value.id.trim()) {
    throw new Error('Invalid record: expected an object with a non-empty string id');
  }
}

export async function put(store, value) {
  assertStore(store);
  assertRecord(value);
  if (backend === 'local') {
    const rows = lsRead(store).filter(r => r.id !== value.id);
    rows.push(value);
    lsWrite(store, rows);
    return value;
  }
  try {
    await tx(store, 'readwrite', os => os.put(value));
    return value;
  } catch (err) {
    await useFallback();
    const rows = lsRead(store).filter(r => r.id !== value.id);
    rows.push(value);
    lsWrite(store, rows);
    return value;
  }
}

export async function get(store, id) {
  assertStore(store);
  if (backend === 'local') return lsRead(store).find(r => r.id === id) || null;
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(store).objectStore(store).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    await useFallback();
    return lsRead(store).find(r => r.id === id) || null;
  }
}

export async function all(store) {
  assertStore(store);
  if (backend === 'local') return lsRead(store);
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(store).objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    await useFallback();
    return lsRead(store);
  }
}

/** v2 had no way to remove a mistaken record. */
export async function del(store, id) {
  assertStore(store);
  if (backend === 'local') {
    lsWrite(store, lsRead(store).filter(r => r.id !== id));
    return;
  }
  try {
    await tx(store, 'readwrite', os => os.delete(id));
  } catch {
    await useFallback();
    lsWrite(store, lsRead(store).filter(r => r.id !== id));
  }
}

export async function clearAll() {
  if (backend === 'local') {
    STORES.forEach(s => { try { localStorage.removeItem(lsKey(s)); } catch { /* ignore */ } });
    return;
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tr = db.transaction(STORES, 'readwrite');
    STORES.forEach(store => tr.objectStore(store).clear());
    tr.oncomplete = () => resolve();
    tr.onerror = () => reject(tr.error || new Error('Clear failed'));
    tr.onabort = () => reject(tr.error || new Error('Clear aborted'));
  });
}

/* ── Migration ─────────────────────────────────────────────────────────── */

/**
 * v2 stored meals flat on the log: { breakfast:{status,portion}, ... }.
 * v3 nests them under `meals` and adds water/sleep/energy/note.
 * Idempotent — safe to run on every read.
 */
export function migrateLog(log) {
  if (!log || typeof log !== 'object') return log;
  const out = { ...log };
  if (!out.meals || typeof out.meals !== 'object') {
    const meals = {};
    for (const slot of ['breakfast', 'lunch', 'snack', 'dinner']) {
      const legacy = out[slot];
      if (legacy && typeof legacy === 'object') {
        meals[slot] = { status: legacy.status === 'done' ? 'done' : 'planned', portion: Number(legacy.portion) || 1 };
      }
      delete out[slot];
    }
    out.meals = meals;
  }
  if (!Array.isArray(out.waterLog)) out.waterLog = [];
  if (out.waterMl == null && out.waterLog.length) out.waterMl = out.waterLog.reduce((a, b) => a + b, 0);
  if (out.waterMl == null) out.waterMl = 0;
  out.schema = BACKUP_SCHEMA;
  return out;
}

/* ── Backup ────────────────────────────────────────────────────────────── */

export async function exportBackup() {
  const payload = {
    schema: BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    app: 'ZENITH PRO',
    version: '3.0.0',
    data: {}
  };
  for (const store of STORES) payload.data[store] = await all(store);
  return payload;
}

function validateBackup(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Το αρχείο δεν είναι έγκυρο backup.');
  if (payload.schema !== 1 && payload.schema !== BACKUP_SCHEMA) throw new Error('Μη υποστηριζόμενη έκδοση backup.');
  if (!payload.data || typeof payload.data !== 'object') throw new Error('Το backup δεν περιέχει δεδομένα.');
  for (const store of STORES) {
    const rows = payload.data[store];
    if (rows != null && !Array.isArray(rows)) throw new Error(`Μη έγκυρο τμήμα: ${store}`);
    for (const row of (rows || [])) {
      if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !row.id.trim()) {
        throw new Error(`Μη έγκυρη εγγραφή στο: ${store}`);
      }
    }
  }
}

export async function importBackup(payload) {
  validateBackup(payload);
  const prepared = {};
  for (const store of STORES) {
    const rows = payload.data[store] || [];
    prepared[store] = store === 'logs' ? rows.map(migrateLog) : rows;
  }

  if (backend === 'local') {
    STORES.forEach(s => lsWrite(s, prepared[s]));
    return;
  }

  // Atomic: everything in one transaction, so a failure changes nothing.
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tr = db.transaction(STORES, 'readwrite');
    try {
      for (const store of STORES) {
        const os = tr.objectStore(store);
        os.clear();
        for (const row of prepared[store]) os.put(row);
      }
    } catch (error) {
      try { tr.abort(); } catch { /* already aborted */ }
      reject(error);
      return;
    }
    tr.oncomplete = () => resolve();
    tr.onerror = () => reject(tr.error || new Error('Η επαναφορά απέτυχε.'));
    tr.onabort = () => reject(tr.error || new Error('Η επαναφορά ακυρώθηκε.'));
  });
}

/** Rough storage footprint, for the diagnostics panel. */
export async function storageInfo() {
  const info = { backend, persisted: false, usage: null, quota: null };
  try {
    if (navigator.storage?.persisted) info.persisted = await navigator.storage.persisted();
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      info.usage = est.usage ?? null;
      info.quota = est.quota ?? null;
    }
  } catch { /* estimate is best-effort only */ }
  return info;
}

export async function requestPersistence() {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch { /* not supported */ }
  return false;
}
