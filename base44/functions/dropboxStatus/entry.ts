import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CONNECTOR_ID = '6abb66f6e7acff92271379c6';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ connected: false }, { status: 401 });

    const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID).catch(() => null);
    if (!conn?.accessToken) return Response.json({ connected: false });

    const res = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${conn.accessToken}`, 'Content-Type': 'application/json' },
      body: 'null',
    });
    if (!res.ok) return Response.json({ connected: false });

    const data = await res.json();
    return Response.json({
      connected: true,
      account: { name: data?.name?.display_name || null, email: data?.email || null },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}