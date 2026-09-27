import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Invoked by the "Transcribe Moment" workflow whenever a Moment record is
// created. Signs the private audio URI, transcribes it, and writes the
// transcript back onto the same record so audio + text stay together.
export default async function(req) {
  let base44;
  let momentId = '';
  try {
    base44 = createClientFromRequest(req);
    const body = await req.json();
    momentId = String(body.momentId || '');
    if (!momentId) return Response.json({ error: 'Missing momentId' }, { status: 400 });

    const moment = await base44.asServiceRole.entities.Moment.get(momentId);
    if (!moment) return Response.json({ error: 'Moment not found' }, { status: 404 });
    if (!moment.audio_uri) return Response.json({ error: 'Moment has no audio' }, { status: 400 });

    await base44.asServiceRole.entities.Moment.update(momentId, { status: 'transcribing' });

    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: moment.audio_uri,
      expires_in: 600,
    });
    if (!signed_url) throw new Error('Could not sign audio URL');

    const result = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: signed_url });
    const transcript = typeof result === 'string' ? result : (result?.text || '');

    await base44.asServiceRole.entities.Moment.update(momentId, { transcript, status: 'done' });
    return Response.json({ transcript, status: 'done' });
  } catch (error) {
    if (base44 && momentId) {
      try { await base44.asServiceRole.entities.Moment.update(momentId, { status: 'failed' }); } catch {}
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}