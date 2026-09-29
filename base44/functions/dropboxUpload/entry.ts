import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CONNECTOR_ID = '6abb66f6e7acff92271379c6';
const FOLDER = '/Back That App Up';

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

    const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID).catch(() => null);
    if (!conn?.accessToken) {
      return Response.json({ ok: false, error: 'Dropbox is not connected' }, { status: 400 });
    }
    const auth = { Authorization: `Bearer ${conn.accessToken}` };

    // Make sure the destination folder exists — a conflict simply means it already does.
    await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: FOLDER, autorename: false }),
    }).catch(() => null);

    const fileRes = await fetch(signedUrl);
    if (!fileRes.ok) {
      return Response.json({ ok: false, error: 'Could not read the recording' }, { status: 400 });
    }
    const bytes = await fileRes.arrayBuffer();

    const uploadRes = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        ...auth,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: `${FOLDER}/${filename}`,
          mode: 'overwrite',
          autorename: false,
          mute: true,
        }),
      },
      body: bytes,
    });
    const data = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      return Response.json({ ok: false, error: data?.error_summary || 'Dropbox upload failed' }, { status: 502 });
    }

    return Response.json({ ok: true, path: data?.path_display || data?.path_lower || filename });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}