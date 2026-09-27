import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Invoked by the "Upload Moment to Drive" workflow once a Moment reaches the
// "done" state. Uploads the recording (WAV) and its transcript into a dedicated
// backup folder in the builder's Google Drive, then marks the Moment as
// uploaded so re-edits (e.g. tag changes) do not re-trigger duplicate uploads.
const DEFAULT_FOLDER = 'Back That App Up!';

export default async function(req) {
  let base44;
  let momentId = '';
  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    momentId = String(body.momentId || '');
    if (!momentId) return Response.json({ error: 'Missing momentId' }, { status: 400 });

    const moment = await base44.asServiceRole.entities.Moment.get(momentId);
    if (!moment) return Response.json({ error: 'Moment not found' }, { status: 404 });
    if (moment.created_by_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (!moment.audio_uri) return Response.json({ error: 'Moment has no audio' }, { status: 400 });
    if (moment.drive_uploaded) return Response.json({ status: 'already_uploaded' });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const auth = { Authorization: `Bearer ${accessToken}` };

    // Find or create the backup folder (app-created files are visible under drive.file).
    const safeName = DEFAULT_FOLDER.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const q = encodeURIComponent(`name='${safeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const findRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, { headers: auth });
    const found = await findRes.json();
    let folderId = found.files?.[0]?.id;
    if (!folderId) {
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: DEFAULT_FOLDER, mimeType: 'application/vnd.google-apps.folder' }),
      });
      const created = await createRes.json();
      folderId = created.id;
    }
    if (!folderId) return Response.json({ error: 'Could not resolve backup folder' }, { status: 502 });

    // Sign the private audio URI and fetch its bytes.
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: moment.audio_uri,
      expires_in: 600,
    });
    if (!signed_url) throw new Error('Could not sign audio URL');

    const audioRes = await fetch(signed_url);
    if (!audioRes.ok) throw new Error('Could not fetch audio bytes');
    const audioBuf = await audioRes.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuf);

    const baseName = (moment.name || `moment_${momentId}`).replace(/\.wav$/i, '');
    const audioFileName = `${baseName}.wav`;
    const transcript = moment.transcript || '';

    // Resumable upload for the audio file (handles large clips), with the
    // transcript embedded as the file description so audio + text stay linked.
    const fileMeta = { name: audioFileName, parents: [folderId] };
    if (transcript) fileMeta.description = transcript.slice(0, 5000);

    const sessionRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
      method: 'POST',
      headers: {
        ...auth,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'audio/wav',
        'X-Upload-Content-Length': String(audioBytes.length),
      },
      body: JSON.stringify(fileMeta),
    });
    if (!sessionRes.ok) throw new Error('Failed to create audio upload session');
    const uploadUrl = sessionRes.headers.get('Location');
    if (!uploadUrl) throw new Error('No upload URL returned');

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'audio/wav', 'Content-Length': String(audioBytes.length) },
      body: audioBytes,
    });
    if (!putRes.ok) throw new Error('Failed to upload audio');
    const audioFile = await putRes.json();

    // Best-effort: also save the transcript as a separate .txt file.
    let transcriptFileId = null;
    if (transcript) {
      const txtName = `${baseName}.txt`;
      const boundary = `btau_boundary_${Date.now()}`;
      const meta = JSON.stringify({ name: txtName, parents: [folderId] });
      const body =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: text/plain\r\n\r\n${transcript}\r\n` +
        `--${boundary}--\r\n`;
      const txtRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      });
      if (txtRes.ok) {
        const t = await txtRes.json();
        transcriptFileId = t.id;
      }
    }

    await base44.asServiceRole.entities.Moment.update(momentId, { drive_uploaded: true });

    return Response.json({
      status: 'uploaded',
      audioFileId: audioFile.id,
      transcriptFileId,
      folderId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}