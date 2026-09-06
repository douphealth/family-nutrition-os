const DB_NAME = 'zenith-pro-v2';
const DB_VERSION = 1;
const STORES = ['settings','profiles','logs','measurements','plans'];
let dbPromise = null;

export async function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach(name => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath:'id' });
      });
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => { dbPromise = null; reject(req.error); };
    req.onblocked = () => { dbPromise = null; reject(new Error('IndexedDB upgrade blocked')); };
  });
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tr = db.transaction(store, mode);
    const os = tr.objectStore(store);
    let result;
    try { result = fn(os); } catch (e) { tr.abort(); reject(e); return; }
    tr.oncomplete = () => resolve(result);
    tr.onerror = () => reject(tr.error || new Error('IndexedDB transaction failed'));
    tr.onabort = () => reject(tr.error || new Error('IndexedDB transaction aborted'));
  });
}

export async function put(store, value) {
  if (!STORES.includes(store)) throw new Error('Unknown store');
  if (!value || typeof value !== 'object' || typeof value.id !== 'string') throw new Error('Invalid record');
  return tx(store,'readwrite',os=>os.put(value));
}

export async function get(store, id) {
  if (!STORES.includes(store)) throw new Error('Unknown store');
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const req = db.transaction(store).objectStore(store).get(id);
    req.onsuccess=()=>resolve(req.result || null);
    req.onerror=()=>reject(req.error);
  });
}

export async function all(store) {
  if (!STORES.includes(store)) throw new Error('Unknown store');
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const req = db.transaction(store).objectStore(store).getAll();
    req.onsuccess=()=>resolve(req.result || []);
    req.onerror=()=>reject(req.error);
  });
}

export async function clearAll() {
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tr = db.transaction(STORES,'readwrite');
    STORES.forEach(store=>tr.objectStore(store).clear());
    tr.oncomplete=()=>resolve();
    tr.onerror=()=>reject(tr.error || new Error('Clear failed'));
    tr.onabort=()=>reject(tr.error || new Error('Clear aborted'));
  });
}

export async function exportBackup() {
  const payload = { schema:1, exportedAt:new Date().toISOString(), app:'ZENITH PRO', data:{} };
  for (const store of STORES) payload.data[store] = await all(store);
  return payload;
}

function validateBackup(payload) {
  if (!payload || payload.schema !== 1 || !payload.data || typeof payload.data !== 'object') throw new Error('Unsupported backup schema');
  for (const store of STORES) {
    const rows = payload.data[store];
    if (rows != null && !Array.isArray(rows)) throw new Error(`Invalid ${store} store`);
    for (const row of (rows || [])) {
      if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !row.id.trim()) throw new Error(`Invalid ${store} record`);
    }
  }
}

export async function importBackup(payload) {
  validateBackup(payload);
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tr = db.transaction(STORES,'readwrite');
    try {
      for (const store of STORES) {
        const os = tr.objectStore(store);
        os.clear();
        for (const row of (payload.data[store] || [])) os.put(row);
      }
    } catch (error) {
      tr.abort();
      reject(error);
      return;
    }
    tr.oncomplete=()=>resolve();
    tr.onerror=()=>reject(tr.error || new Error('Restore failed'));
    tr.onabort=()=>reject(tr.error || new Error('Restore aborted'));
  });
}
