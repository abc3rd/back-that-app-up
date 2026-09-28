// Server-side entitlement gate for paid AI features.
// The client's localStorage "plan" preview is NOT trusted here — only the
// User record (set by billing or an admin) or an admin role grants access.
// Returns { ok: true } when entitled, otherwise { ok: false, status, error }.
export async function assertEntitled(base44, user) {
  if (user?.role === 'admin') return { ok: true };
  // User.plan is a client-writable field: a user can set it to 'pro' on their own
  // record without paying, so it is NOT a trusted entitlement signal. Until a
  // server-verified billing signal (e.g. a Stripe webhook that writes `plan`
  // server-side with signature verification) is connected, deny Pro for non-admins
  // by default. Admins are always entitled.
  return { ok: false, status: 402, error: 'A Pro plan is required for this feature.' };
}