import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { saveRecording, listRecordings, deleteRecording, protectRecording, cleanupTemporary, cleanupTemporaryByAge, cleanupByStorageLimit, deleteAllRecordings } from '../src/lib/preroll/storage.js';

test('persist blobs and labels, preserve protected clips under all retention policies', async () => {
  const make = (id, timestamp, protectedCapture) => ({ id, timestamp, label: id, protected: protectedCapture, temporary: !protectedCapture, sizeBytes: 100, blob: new Blob(['audio']) });
  await saveRecording(make('saved', 0, true)); await saveRecording(make('old', 0, false)); await saveRecording(make('new', Date.now(), false));
  assert.equal(await cleanupTemporaryByAge(1), 1);
  let records = await listRecordings(); assert.deepEqual(records.map((r) => r.id), ['new', 'saved']);
  assert.equal(await records[1].blob.text(), 'audio');
  await saveRecording({ ...records[1], label: 'Renamed' });
  await protectRecording('new'); await saveRecording(make('temporary', Date.now(), false));
  assert.equal(await cleanupByStorageLimit(1), 1);
  await saveRecording(make('temporary', Date.now(), false)); assert.equal(await cleanupTemporary(0), 1);
  records = await listRecordings(); assert.equal(records.find((r) => r.id === 'saved').label, 'Renamed');
  assert.equal(records.find((r) => r.id === 'new').protected, true);
  await deleteRecording('new'); assert.equal((await listRecordings()).length, 1);
  await deleteAllRecordings(); assert.deepEqual(await listRecordings(), []);
});
