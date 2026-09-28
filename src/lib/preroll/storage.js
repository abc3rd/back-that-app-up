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

// Delete unprotected temporary captures older than `retentionHours`.
// Saved/protected recordings are never touched by automatic retention cleanup.
export const cleanupTemporaryByAge = async (retentionHours) => {
  if (!retentionHours || retentionHours <= 0) return 0;
  const all = await run('readonly', (s) => s.getAll());
  const cutoff = Date.now() - retentionHours * 60 * 60 * 1000;
  const expired = all.filter((r) => r.temporary && !r.protected && r.timestamp < cutoff);
  if (!expired.length) return 0;
  await run('readwrite', (s) => { expired.forEach((r) => s.delete(r.id)); });
  return expired.length;
};

// Keep temporary audio under `maxBytes` by deleting the oldest unprotected
// captures first. Saved/protected recordings are never touched.
export const cleanupByStorageLimit = async (maxBytes) => {
  if (!maxBytes || maxBytes <= 0) return 0;
  const all = await run('readonly', (s) => s.getAll());
  const sizeOf = (r) => r.sizeBytes || r.blob?.size || 0;
  const temps = all.filter((r) => r.temporary && !r.protected).sort((a, b) => a.timestamp - b.timestamp);
  let total = temps.reduce((n, r) => n + sizeOf(r), 0);
  const toDelete = [];
  for (const r of temps) {
    if (total <= maxBytes) break;
    toDelete.push(r);
    total -= sizeOf(r);
  }
  if (!toDelete.length) return 0;
  await run('readwrite', (s) => { toDelete.forEach((r) => s.delete(r.id)); });
  return toDelete.length;
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

// Sum the on-device bytes of every stored recording, split by saved vs temporary.
export const getRecordingsStats = async () => {
  const all = await run('readonly', (s) => s.getAll());
  let savedCount = 0, savedBytes = 0, tempCount = 0, tempBytes = 0;
  for (const r of all) {
    const bytes = r.sizeBytes || r.blob?.size || 0;
    if (r.temporary && !r.protected) { tempCount++; tempBytes += bytes; }
    else { savedCount++; savedBytes += bytes; }
  }
  return {
    count: all.length,
    totalBytes: savedBytes + tempBytes,
    savedCount, savedBytes, tempCount, tempBytes,
  };
};