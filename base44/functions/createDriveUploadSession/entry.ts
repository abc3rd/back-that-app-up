import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const FOLDER_NAME = 'Back That App Up!';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fileName = body.fileName;
    const mimeType = body.mimeType || 'audio/wav';
    const contentLength = Number(body.contentLength);
    if (!fileName || !contentLength) {
      return Response.json({ error: 'fileName and contentLength are required' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const auth = { Authorization: `Bearer ${accessToken}` };

    // Find or create the backup folder (app-created files are visible under drive.file)
    const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const findRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, { headers: auth });
    const found = await findRes.json();
    let folderId = found.files?.[0]?.id;
    if (!folderId) {
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
      });
      const created = await createRes.json();
      folderId = created.id;
    }
    if (!folderId) return Response.json({ error: 'Could not resolve backup folder' }, { status: 502 });

    // Initiate a resumable upload session so the client can stream the bytes directly
    const sessionRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        ...auth,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(contentLength),
      },
      body: JSON.stringify({ name: fileName, parents: [folderId] }),
    });
    if (!sessionRes.ok) {
      const details = await sessionRes.text();
      return Response.json({ error: 'Failed to create upload session', details }, { status: 502 });
    }
    const uploadUrl = sessionRes.headers.get('Location');
    if (!uploadUrl) return Response.json({ error: 'No upload URL returned' }, { status: 502 });

    return Response.json({ uploadUrl, folderId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}