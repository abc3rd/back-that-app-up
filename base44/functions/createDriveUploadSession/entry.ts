import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const DEFAULT_FOLDER = 'Back That App Up!';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fileName = String(body.fileName || '');
    const mimeType = 'audio/wav'; // privileged uploads are audio captures only
    const contentLength = Number(body.contentLength);
    const folderName = (body.folderName && String(body.folderName).trim()) || DEFAULT_FOLDER;
    const description = body.description ? String(body.description).slice(0, 5000) : undefined;
    const MAX_BYTES = 262144000; // 250 MB cap per upload
    if (!/^btau_[\w.-]+\.wav$/.test(fileName)) {
      return Response.json({ error: 'Invalid file name' }, { status: 400 });
    }
    if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > MAX_BYTES) {
      return Response.json({ error: 'Invalid or oversized file' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const auth = { Authorization: `Bearer ${accessToken}` };

    // Find or create the backup folder (app-created files are visible under drive.file)
    const safeName = folderName.replace(/'/g, "\\'");
    const q = encodeURIComponent(`name='${safeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const findRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, { headers: auth });
    const found = await findRes.json();
    let folderId = found.files?.[0]?.id;
    if (!folderId) {
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' }),
      });
      const created = await createRes.json();
      folderId = created.id;
    }
    if (!folderId) return Response.json({ error: 'Could not resolve backup folder' }, { status: 502 });

    // Initiate a resumable upload session so the client can stream the bytes directly.
    const fileMeta = { name: fileName, parents: [folderId] };
    if (description) fileMeta.description = description;

    const sessionRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        ...auth,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(contentLength),
      },
      body: JSON.stringify(fileMeta),
    });
    if (!sessionRes.ok) {
      return Response.json({ error: 'Failed to create upload session' }, { status: 502 });
    }
    const uploadUrl = sessionRes.headers.get('Location');
    if (!uploadUrl) return Response.json({ error: 'No upload URL returned' }, { status: 502 });

    return Response.json({ uploadUrl, folderId, folderName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}