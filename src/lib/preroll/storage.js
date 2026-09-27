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
    tx.oncomplete = () => resolve(req && req.result !== undefined ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
  });
}

export const saveRecording = (rec) => run('readwrite', (s) => s.put(rec));
export const deleteRecording = (id) => run('readwrite', (s) => s.delete(id));
export const listRecordings = async () =>
  (await run('readonly', (s) => s.getAll())).sort((a, b) => b.timestamp - a.timestamp);

// Convert an unprotected automatic spike capture into a protected user capture.
export const protectRecording = async (id) => {
  const rec = await run('readonly', (s) => s.get(id));
  if (!rec) return null;
  const updated = { ...rec, protected: true, temporary: false };
  await run('readwrite', (s) => s.put(updated));
  return updated;
};

// Delete every unprotected temporary capture.
export const deleteAllTemporary = async () => {
  const all = await run('readonly', (s) => s.getAll());
  const temps = all.filter((r) => r.temporary && !r.protected);
  if (!temps.length) return 0;
  await run('readwrite', (s) => { temps.forEach((t) => s.delete(t.id)); });
  return temps.length;
};

// Keep at most `max` unprotected temporary captures; delete the oldest beyond that.
// Protected captures (manual / voice / kept) are never touched.
export const cleanupTemporary = async (max) => {
  const all = await run('readonly', (s) => s.getAll());
  const temps = all
    .filter((r) => r.temporary && !r.protected)
    .sort((a, b) => a.timestamp - b.timestamp);
  const toDelete = temps.slice(0, Math.max(0, temps.length - max));
  if (!toDelete.length) return 0;
  await run('readwrite', (s) => { toDelete.forEach((t) => s.delete(t.id)); });
  return toDelete.length;
};

// Delete unprotected temporary captures older than `retentionMinutes`.
export const cleanupExpiredTemporary = async (retentionMinutes) => {
  if (!retentionMinutes || retentionMinutes <= 0) return 0;
  const all = await run('readonly', (s) => s.getAll());
  const cutoff = Date.now() - retentionMinutes * 60 * 1000;
  const expired = all.filter((r) => r.temporary && !r.protected && r.timestamp < cutoff);
  if (!expired.length) return 0;
  await run('readwrite', (s) => { expired.forEach((r) => s.delete(r.id)); });
  return expired.length;
};

// Delete every recording (protected and temporary).
export const deleteAllRecordings = async () => {
  const all = await run('readonly', (s) => s.getAll());
  if (!all.length) return 0;
  await run('readwrite', (s) => { all.forEach((r) => s.delete(r.id)); });
  return all.length;
};

export const getStorageEstimate = async () => {
  if (navigator.storage?.estimate) {
    try { return await navigator.storage.estimate(); } catch { return null; }
  }
  return null;
};