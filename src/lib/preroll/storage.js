const DB_NAME = 'btau';
const STORE = 'recordings';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  });
}

export const saveRecording = (rec) => run('readwrite', (s) => s.put(rec));
export const deleteRecording = (id) => run('readwrite', (s) => s.delete(id));
export const listRecordings = async () =>
  (await run('readonly', (s) => s.getAll())).sort((a, b) => b.timestamp - a.timestamp);