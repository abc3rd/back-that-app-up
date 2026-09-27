import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Notifies the user (by email) that a recording was successfully uploaded to
// their Google Drive. Called from the client after the resumable PUT succeeds.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.email) return Response.json({ error: 'No email on file' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || 'your recording').slice(0, 120);
    const folder = String(body.folder || 'Google Drive').slice(0, 80);
    // strip angle brackets to keep the email body HTML-safe
    const safeName = name.replace(/[<>]/g, '');
    const safeFolder = folder.replace(/[<>]/g, '');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Back That App Up! — Recording backed up',
      text: `Your recording "${safeName}" was successfully uploaded to ${safeFolder}.\n\nListen at https://back-that-app-up.base44.app/moments`,
      html: `<p>Your recording <strong>${safeName}</strong> was successfully uploaded to <strong>${safeFolder}</strong>.</p><p><a href="https://back-that-app-up.base44.app/moments">Listen in your moments</a></p>`,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}