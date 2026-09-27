// Server-side entitlement gate for paid AI features.
// The client's localStorage "plan" preview is NOT trusted here — only the
// User record (set by billing or an admin) or an admin role grants access.
// Returns { ok: true } when entitled, otherwise { ok: false, status, error }.
export async function assertEntitled(base44, user) {
  if (user?.role === 'admin') return { ok: true };
  let plan = user?.plan || user?.data?.plan;
  if (!plan) {
    try {
      const rec = await base44.asServiceRole.entities.User.get(user.id);
      plan = rec?.plan || rec?.data?.plan;
    } catch {}
  }
  if (plan === 'pro') return { ok: true };
  return { ok: false, status: 402, error: 'A Pro plan is required for this feature.' };
}