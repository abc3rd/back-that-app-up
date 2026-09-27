import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// AI moment retrieval: ranks the user's recordings against a natural-language
// (often voice) query using their captured metadata. InvokeLLM must run here
// (service role), not in the client.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const query = String(body.query || '').slice(0, 500);
    const corpus = Array.isArray(body.recordings) ? body.recordings : [];
    if (!query) return Response.json({ error: 'query is required' }, { status: 400 });

    const prompt =
      'You are a moment-retrieval assistant for an ambient audio capture app called "Back That App Up!". ' +
      'The user asks a natural-language question (often via voice) to find a specific saved moment. ' +
      'Return the recordings that best match, ranked by relevance. Use date/time, time-of-day, trigger type, location, tags, and transcript to match. ' +
      `"Today" is ${new Date().toISOString()}. Resolve relative dates (yesterday, last Tuesday, this morning) against it.\n\n` +
      `Query: "${query}"\n\n` +
      `Recordings:\n${JSON.stringify(corpus)}\n\n` +
      'Return JSON: { "summary": one short sentence, "matches": [ { "id": string, "reason": string } ] } most relevant first. ' +
      'Only use ids present in the list. If none match, return empty matches with a helpful summary.';

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: { id: { type: 'string' }, reason: { type: 'string' } },
              required: ['id', 'reason'],
            },
          },
        },
        required: ['summary', 'matches'],
      },
    });

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}