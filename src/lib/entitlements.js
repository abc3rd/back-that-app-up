// Centralized entitlement definitions. Future Android billing and web billing
// should map their SKU/purchase tokens to these same feature IDs.
export const PLAN = { FREE: 'free', PRO: 'pro' };

export const FEATURES = {
  EXTENDED_PRE_ROLL: 'extended_pre_roll',
  EXTENDED_POST_ROLL: 'extended_post_roll',
  CUSTOM_PHRASE: 'custom_phrase',
  MULTIPLE_PHRASES: 'multiple_phrases',
  AUTO_CAPTURE: 'auto_capture',
  SUSTAINED_DURATION: 'sustained_duration',
  SPIKE_COOLDOWN: 'spike_cooldown',
  TEMP_RETENTION_DURATION: 'temp_retention_duration',
  HIGH_QUALITY: 'high_quality',
  ARC_DEVICES: 'arc_devices',
  DEVICE_PAIRING: 'device_pairing',
  DEVICE_TRANSFER: 'device_transfer',
  ARC_SYNC: 'arc_sync',
  AI_TRANSCRIPTION: 'ai_transcription',
  AI_SUMMARY: 'ai_summary',
  AI_SEARCH: 'ai_search',
  AI_MOMENTS: 'ai_moments',
};

const PRO_FEATURES = new Set([
  FEATURES.EXTENDED_PRE_ROLL,
  FEATURES.EXTENDED_POST_ROLL,
  FEATURES.CUSTOM_PHRASE,
  FEATURES.MULTIPLE_PHRASES,
  FEATURES.AUTO_CAPTURE,
  FEATURES.SUSTAINED_DURATION,
  FEATURES.SPIKE_COOLDOWN,
  FEATURES.TEMP_RETENTION_DURATION,
  FEATURES.HIGH_QUALITY,
  FEATURES.ARC_DEVICES,
  FEATURES.DEVICE_PAIRING,
  FEATURES.DEVICE_TRANSFER,
  FEATURES.ARC_SYNC,
  FEATURES.AI_TRANSCRIPTION,
  FEATURES.AI_SUMMARY,
  FEATURES.AI_SEARCH,
  FEATURES.AI_MOMENTS,
]);

export const isProFeature = (id) => PRO_FEATURES.has(id);
export const planHas = (plan, id) => plan === PLAN.PRO || !PRO_FEATURES.has(id);

export const FEATURE_META = {
  [FEATURES.EXTENDED_PRE_ROLL]: 'Extended pre-roll',
  [FEATURES.EXTENDED_POST_ROLL]: 'Extended post-roll',
  [FEATURES.CUSTOM_PHRASE]: 'Custom trigger phrase',
  [FEATURES.MULTIPLE_PHRASES]: 'Multiple trigger phrases',
  [FEATURES.AUTO_CAPTURE]: 'Sound spike auto capture',
  [FEATURES.SUSTAINED_DURATION]: 'Sustained sound duration',
  [FEATURES.SPIKE_COOLDOWN]: 'Spike cooldown',
  [FEATURES.TEMP_RETENTION_DURATION]: 'Temporary retention',
  [FEATURES.HIGH_QUALITY]: 'High-quality recording',
  [FEATURES.ARC_DEVICES]: 'ARC devices',
  [FEATURES.DEVICE_PAIRING]: 'Device pairing',
  [FEATURES.DEVICE_TRANSFER]: 'Device-to-device transfer',
  [FEATURES.ARC_SYNC]: 'ARC synchronization',
  [FEATURES.AI_TRANSCRIPTION]: 'Transcription',
  [FEATURES.AI_SUMMARY]: 'Summary',
  [FEATURES.AI_SEARCH]: 'Search inside recordings',
  [FEATURES.AI_MOMENTS]: 'Extract important moments',
};