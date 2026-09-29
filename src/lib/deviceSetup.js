const TOUR_KEY = 'btau.onboarded';
const SETUP_KEY = 'btau.deviceSetup.v1';

// True when running as an installed home-screen app or inside a native shell.
export const isInstalled = () => {
  if (typeof window === 'undefined') return false;
  if (window.Capacitor?.isNativePlatform?.()) return true;
  const modes = ['standalone', 'fullscreen', 'minimal-ui'];
  if (modes.some((m) => window.matchMedia?.(`(display-mode: ${m})`).matches)) return true;
  return window.navigator.standalone === true;
};

export const isSetupConfirmed = () => localStorage.getItem(SETUP_KEY) === '1';

// Only counts as done while actually running installed — so the walkthrough
// comes back once after the app gets installed, never on an ordinary open.
export const confirmSetup = () => {
  if (isInstalled()) localStorage.setItem(SETUP_KEY, '1');
};

export const markTourDone = () => localStorage.setItem(TOUR_KEY, '1');

// Lets Settings replay the whole guide on demand.
export const resetOnboarding = () => {
  localStorage.removeItem(TOUR_KEY);
  localStorage.removeItem(SETUP_KEY);
};

export const needsOnboarding = () =>
  localStorage.getItem(TOUR_KEY) !== '1' || (isInstalled() && !isSetupConfirmed());

// The browser tells us when the app was installed, so the freshly installed
// app asks for its device setup pass once.
export const initInstallWatch = () => {
  if (typeof window === 'undefined') return;
  window.addEventListener('appinstalled', () => localStorage.removeItem(SETUP_KEY));
};