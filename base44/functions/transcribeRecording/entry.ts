import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { assertEntitled } from '../../shared/entitlements.ts';

// Transcribe a previously-uploaded audio file. TranscribeAudio must run server
// side (service role). The client uploads the blob to public storage first,
// then passes the resulting URL here.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const ent = await assertEntitled(base44, user);
    if (!ent.ok) return Response.json({ error: ent.error }, { status: ent.status });

    const body = await req.json();
    const audioUrl = String(body.audioUrl || '');
    if (!/^https:\/\/.+/i.test(audioUrl)) {
      return Response.json({ error: 'Invalid audio URL' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
    const transcript = typeof result === 'string' ? result : result?.text || '';
    return Response.json({ transcript });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}