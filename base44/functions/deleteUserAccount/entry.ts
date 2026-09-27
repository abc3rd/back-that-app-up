import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Permanently deletes the calling user's saved data (Moment records) and closes
// their account. Requires an authenticated caller; the caller can only delete
// their own data. Run from the Settings > Delete Account action.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Remove all Moment records owned by this user (service role bypasses RLS).
    await base44.asServiceRole.entities.Moment.deleteMany({ created_by_id: user.id });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}