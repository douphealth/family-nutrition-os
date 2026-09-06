const DB_NAME = 'zenith-pro-v2';
const DB_VERSION = 1;
const STORES = ['settings','profiles','logs','measurements','plans'];

export async function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach(name => { if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath:'id' }); });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(store, mode, fn) {
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tr = db.transaction(store, mode);
    const os = tr.objectStore(store);
    let result;
    try { result = fn(os); } catch (e) { reject(e); return; }
    tr.oncomplete = () => resolve(result);
    tr.onerror = () => reject(tr.error);
  });
}

export async function put(store, value) { return tx(store,'readwrite',os=>os.put(value)); }
export async function get(store, id) {
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const req = db.transaction(store).objectStore(store).get(id);
    req.onsuccess=()=>resolve(req.result || null); req.onerror=()=>reject(req.error);
  });
}
export async function all(store) {
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const req = db.transaction(store).objectStore(store).getAll();
    req.onsuccess=()=>resolve(req.result || []); req.onerror=()=>reject(req.error);
  });
}
export async function clearAll() {
  const db = await openDb();
  await Promise.all(STORES.map(store=>new Promise((resolve,reject)=>{const tr=db.transaction(store,'readwrite');tr.objectStore(store).clear();tr.oncomplete=resolve;tr.onerror=()=>reject(tr.error);}))); 
}

export async function exportBackup() {
  const payload = { schema:1, exportedAt:new Date().toISOString(), data:{} };
  for (const store of STORES) payload.data[store] = await all(store);
  return payload;
}

export async function importBackup(payload) {
  if (!payload || payload.schema !== 1 || !payload.data) throw new Error('Unsupported backup schema');
  await clearAll();
  for (const store of STORES) for (const row of (payload.data[store] || [])) await put(store,row);
}
