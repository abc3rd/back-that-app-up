import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const FOLDER_NAME = 'Back That App Up';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

const safeName = (name) =>
  String(name || 'recording.wav')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const signedUrl = body?.signed_url;
    const filename = safeName(body?.filename);

    if (typeof signedUrl !== 'string' || !signedUrl.startsWith('https://')) {
      return Response.json({ ok: false, error: 'Missing recording file' }, { status: 400 });
    }
    const host = new URL(signedUrl).hostname;
    if (/^(localhost$|127\.|10\.|192\.168\.|169\.254\.)/.test(host)) {
      return Response.json({ ok: false, error: 'Unsupported file source' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    if (!accessToken) {
      return Response.json({ ok: false, error: 'Google Drive is not connected' }, { status: 400 });
    }
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Find or create the destination folder. With the drive.file scope we only
    // see files this app created, so a create-on-miss is the safe path.
    let folderId = null;
    const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`);
    const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
      headers: authHeader,
    });
    if (listRes.ok) {
      const list = await listRes.json().catch(() => ({}));
      folderId = list?.files?.[0]?.id || null;
    }
    if (!folderId) {
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME }),
      });
      if (createRes.ok) {
        const created = await createRes.json().catch(() => ({}));
        folderId = created?.id || null;
      }
    }

    const fileRes = await fetch(signedUrl);
    if (!fileRes.ok) {
      return Response.json({ ok: false, error: 'Could not read the recording' }, { status: 400 });
    }
    const bytes = await fileRes.arrayBuffer();

    const metadata = folderId ? { name: filename, parents: [folderId] } : { name: filename };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([bytes], { type: 'audio/wav' }), filename);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
      { method: 'POST', headers: authHeader, body: form },
    );
    const data = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      return Response.json(
        { ok: false, error: data?.error?.message || 'Google Drive upload failed' },
        { status: 502 },
      );
    }

    return Response.json({ ok: true, path: data?.name || filename });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}