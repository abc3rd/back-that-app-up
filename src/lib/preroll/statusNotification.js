const TAG = 'btau-status';
let current = null;

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function ensurePermission() {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const p = await Notification.requestPermission();
    return p === 'granted';
  } catch {
    return false;
  }
}

export function showStatus(title, body) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  try {
    current?.close?.();
    current = new Notification(title, { body, tag: TAG, requireInteraction: true, silent: true });
    current.onclose = () => { current = null; };
  } catch {
    current = null;
  }
}

export function hideStatus() {
  try { current?.close?.(); } catch {}
  current = null;
}