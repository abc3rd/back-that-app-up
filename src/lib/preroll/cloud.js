import { base44 } from '@/api/base44Client';
import { listRecordings, deleteRecording } from './storage';

// Per-user Dropbox connector (each app user links their own Dropbox account).
export const DROPBOX_CONNECTOR_ID = '6abb66f6e7acff92271379c6';

export const CLOUD_LABELS = { dropbox: 'Dropbox' };

// Returns the linked Dropbox account, or null when Dropbox is not connected.
export const getDropboxAccount = async () => {
  try {
    const res = await base44.functions.invoke('dropboxStatus', {});
    return res.data?.connected ? res.data.account || {} : null;
  } catch {
    return null;
  }
};

export const connectDropbox = () => base44.connectors.connectAppUser(DROPBOX_CONNECTOR_ID);
export const disconnectDropbox = () => base44.connectors.disconnectAppUser(DROPBOX_CONNECTOR_ID);

// Dropbox is the only cloud destination that offers one-tap setup.
export const resolveCloudTarget = async () => ((await getDropboxAccount()) ? 'dropbox' : null);

const pushOne = async (rec) => {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({
    file: new File([rec.blob], rec.name, { type: 'audio/wav' }),
  });
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 900 });
  const res = await base44.functions.invoke('dropboxUpload', { signed_url, filename: rec.name });
  if (!res.data?.ok) throw new Error(res.data?.error || 'upload failed');
};

let offloadRunning = false;

// Push every saved capture to the cloud target, then drop the local copy.
export const offloadToCloud = async (onProgress) => {
  if (offloadRunning) return { uploaded: 0, failed: 0, total: 0, bytes: 0, target: null };
  offloadRunning = true;
  try {
    const target = await resolveCloudTarget();
    if (!target) return { uploaded: 0, failed: 0, total: 0, bytes: 0, target: null };

    const all = await listRecordings();
    const saved = all.filter((r) => !(r.temporary && !r.protected) && r.blob);
    let uploaded = 0;
    let failed = 0;
    let bytes = 0;

    for (const rec of saved) {
      onProgress?.({ done: uploaded + failed, total: saved.length });
      try {
        await pushOne(rec);
        await deleteRecording(rec.id);
        bytes += rec.sizeBytes || rec.blob.size || 0;
        uploaded += 1;
      } catch {
        failed += 1;
      }
    }

    return { uploaded, failed, total: saved.length, bytes, target };
  } finally {
    offloadRunning = false;
  }
};