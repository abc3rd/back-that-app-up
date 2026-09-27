// ARC (Ambient Recording Cloud) abstraction — UI/API surface only.
// No backend is implemented; every device/sync operation stays local.
// The native Android/Capacitor build can later back these functions with a
// real foreground mic service and ARC sync without changing call sites.

const DEVICE_KEY = 'btau.device.id';

const getDeviceId = () => {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
};

const deviceName = () => {
  if (typeof navigator === 'undefined') return 'This device';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'Android device';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS device';
  if (/mac/i.test(ua)) return 'Mac';
  if (/win/i.test(ua)) return 'Windows PC';
  return 'This device';
};

export const arc = {
  accountStatus: () => ({ connected: false, email: null, plan: null }),
  thisDevice: () => ({ id: getDeviceId(), name: deviceName(), localOnly: true }),
  authorizedDevices: () => [],
  // The following require the ARC backend, which is not yet connected.
  pairDevice: async () => { throw new Error('ARC pairing is not available yet.'); },
  transferTo: async () => { throw new Error('Device-to-device transfer requires ARC.'); },
};