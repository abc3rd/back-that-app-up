import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PLAN, planHas, FEATURES } from '@/lib/entitlements';
import { useAuth } from '@/lib/AuthContext';

const KEY = 'btau.settings.v1';
const PLAN_KEY = 'btau.plan';
const PHRASE_DEFAULT = 'back that app up';

const DEFAULTS = {
  rewind: 30,
  postRoll: 30,
  extendOnSecondTrigger: false,
  triggerCooldown: 2,
  preventOverlaps: true,
  voiceArm: true,
  phrase: PHRASE_DEFAULT,
  customPhrases: [],
  autoCapture: false,
  threshold: 55,
  sustainedDuration: 0,
  spikeCooldown: 2,
  maxAuto: 10,
  tempRetentionMinutes: 0,
  quality: 'standard',
  inputDeviceId: '',
  arcEnabled: false,
  localOnly: true,
  driveFolder: 'Back That App Up!',
  locationTagging: true,
  recordingRetentionDays: 30,
  aiTranscription: false,
  autoListen: false,
  sound: false,
  vibration: false,
  notifications: false,
};

const load = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      ...DEFAULTS,
      ...parsed,
      customPhrases: Array.isArray(parsed.customPhrases) ? parsed.customPhrases : [],
    };
  } catch {
    return DEFAULTS;
  }
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [plan, setPlanState] = useState(() => localStorage.getItem(PLAN_KEY) || PLAN.FREE);
  const [s, setS] = useState(load);
  const [paywallFeature, setPaywallFeature] = useState(null);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(s)); }, [s]);
  useEffect(() => { localStorage.setItem(PLAN_KEY, plan); }, [plan]);

  const set = useCallback((patch) => setS((p) => ({ ...p, ...patch })), []);
  const setPlan = useCallback((p) => setPlanState(p), []);
  const can = useCallback((id) => isAdmin || planHas(plan, id), [plan, isAdmin]);
  const openPaywall = useCallback((id) => setPaywallFeature(id || 'pro'), []);
  const closePaywall = useCallback(() => setPaywallFeature(null), []);
  const requirePro = useCallback((id) => {
    if (can(id)) return true;
    setPaywallFeature(id);
    return false;
  }, [can]);

  const isPro = isAdmin || plan === PLAN.PRO;

  // Effective (entitlement-clamped) values used by the engine and UI.
  const effRewind = can(FEATURES.EXTENDED_PRE_ROLL) ? s.rewind : Math.min(s.rewind, 30);
  const effPostRoll = can(FEATURES.EXTENDED_POST_ROLL) ? s.postRoll : Math.min(s.postRoll, 30);
  const effAutoCapture = can(FEATURES.AUTO_CAPTURE) && s.autoCapture;
  const effQuality = can(FEATURES.HIGH_QUALITY) ? s.quality : 'standard';
  const effPhrase = can(FEATURES.CUSTOM_PHRASE) ? s.phrase : PHRASE_DEFAULT;
  const effCustomPhrases = can(FEATURES.MULTIPLE_PHRASES) ? s.customPhrases : [];
  const effSustainedDuration = can(FEATURES.SUSTAINED_DURATION) ? s.sustainedDuration : 0;
  const effSpikeCooldown = can(FEATURES.SPIKE_COOLDOWN) ? s.spikeCooldown : 2;
  const effTempRetentionMinutes = can(FEATURES.TEMP_RETENTION_DURATION) ? s.tempRetentionMinutes : 0;
  const effRecordingRetentionDays = s.recordingRetentionDays;
  const effAiTranscription = can(FEATURES.AI_TRANSCRIPTION) ? s.aiTranscription : false;
  const effAutoListen = isPro || s.autoListen;

  // Setters — gating is centralized here so components don't scatter paywall checks.
  const setRewind = (v) => {
    if (v > 30 && !can(FEATURES.EXTENDED_PRE_ROLL)) { openPaywall(FEATURES.EXTENDED_PRE_ROLL); set({ rewind: 30 }); return; }
    set({ rewind: v });
  };
  const setPostRoll = (v) => {
    if (v > 30 && !can(FEATURES.EXTENDED_POST_ROLL)) { openPaywall(FEATURES.EXTENDED_POST_ROLL); set({ postRoll: 30 }); return; }
    set({ postRoll: v });
  };
  const setExtendOnSecondTrigger = (v) => set({ extendOnSecondTrigger: v });
  const setTriggerCooldown = (v) => set({ triggerCooldown: v });
  const setPreventOverlaps = (v) => set({ preventOverlaps: v });
  const setVoiceArm = (v) => set({ voiceArm: v });
  const setPhrase = (v) => {
    if (!can(FEATURES.CUSTOM_PHRASE)) { openPaywall(FEATURES.CUSTOM_PHRASE); return; }
    set({ phrase: v });
  };
  const setCustomPhrases = (v) => {
    if (!can(FEATURES.MULTIPLE_PHRASES)) { openPaywall(FEATURES.MULTIPLE_PHRASES); return; }
    set({ customPhrases: v });
  };
  const setAutoCapture = (v) => {
    if (v && !can(FEATURES.AUTO_CAPTURE)) { openPaywall(FEATURES.AUTO_CAPTURE); return; }
    set({ autoCapture: v });
  };
  const setThreshold = (v) => set({ threshold: v });
  const setSustainedDuration = (v) => {
    if (v > 0 && !can(FEATURES.SUSTAINED_DURATION)) { openPaywall(FEATURES.SUSTAINED_DURATION); return; }
    set({ sustainedDuration: v });
  };
  const setSpikeCooldown = (v) => {
    if (!can(FEATURES.SPIKE_COOLDOWN)) { openPaywall(FEATURES.SPIKE_COOLDOWN); return; }
    set({ spikeCooldown: v });
  };
  const setMaxAuto = (v) => set({ maxAuto: v });
  const setTempRetentionMinutes = (v) => {
    if (v > 0 && !can(FEATURES.TEMP_RETENTION_DURATION)) { openPaywall(FEATURES.TEMP_RETENTION_DURATION); return; }
    set({ tempRetentionMinutes: v });
  };
  const setQuality = (v) => {
    if (v === 'high' && !can(FEATURES.HIGH_QUALITY)) { openPaywall(FEATURES.HIGH_QUALITY); return; }
    set({ quality: v });
  };
  const setInputDeviceId = (v) => set({ inputDeviceId: v });
  const setArcEnabled = (v) => {
    if (v && !can(FEATURES.ARC_SYNC)) { openPaywall(FEATURES.ARC_SYNC); return; }
    set({ arcEnabled: v });
  };
  const setLocalOnly = (v) => set({ localOnly: v });
  const setDriveFolder = (v) => set({ driveFolder: v });
  const setLocationTagging = (v) => set({ locationTagging: v });
  const setRecordingRetentionDays = (v) => set({ recordingRetentionDays: v });
  const setAiTranscription = (v) => {
    if (v && !can(FEATURES.AI_TRANSCRIPTION)) { openPaywall(FEATURES.AI_TRANSCRIPTION); return; }
    set({ aiTranscription: v });
  };
  const setAutoListen = (v) => set({ autoListen: v });
  const setSound = (v) => set({ sound: v });
  const setVibration = (v) => set({ vibration: v });
  const setNotifications = (v) => set({ notifications: v });

  const value = {
    ...s,
    effRewind, effPostRoll, effAutoCapture, effQuality, effPhrase, effCustomPhrases,
    effSustainedDuration, effSpikeCooldown, effTempRetentionMinutes, effRecordingRetentionDays, effAiTranscription, effAutoListen,
    plan, isPro, can, setPlan, openPaywall, closePaywall, requirePro, paywallFeature,
    setRewind, setPostRoll, setExtendOnSecondTrigger, setTriggerCooldown, setPreventOverlaps,
    setVoiceArm, setPhrase, setCustomPhrases, setAutoCapture, setThreshold, setSustainedDuration,
    setSpikeCooldown, setMaxAuto, setTempRetentionMinutes, setQuality, setInputDeviceId,
    setArcEnabled, setLocalOnly, setDriveFolder, setLocationTagging, setRecordingRetentionDays,
    setAiTranscription, setAutoListen, setSound, setVibration, setNotifications,
  };

  return React.createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}