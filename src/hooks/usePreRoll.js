import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import PreRollEngine, { STANDARD_RATE, HIGH_RATE } from '@/lib/preroll/PreRollEngine';
import {
  deleteRecording,
  listRecordings,
  saveRecording,
  protectRecording,
  deleteAllTemporary,
  cleanupTemporary,
  cleanupTemporaryByAge,
  cleanupByStorageLimit,
} from '@/lib/preroll/storage';
import { captureLocation, reverseGeocode, buildMetadata } from '@/lib/preroll/metadata';
import { ensurePermission, showStatus, hideStatus } from '@/lib/preroll/statusNotification';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from './useSettings';
import { FEATURES } from '@/lib/entitlements';

const rateFor = (q) => (q === 'high' ? HIGH_RATE : STANDARD_RATE);

export default function usePreRoll() {
  const settings = useSettings();
  const {
    effRewind, effPostRoll, effAutoCapture, effQuality, effPhrase, effCustomPhrases,
    effSustainedDuration, effTempRetentionHours, effSpikeCooldown, effMaxStorageBytes,
    threshold, triggerCooldown, extendOnSecondTrigger, inputDeviceId, maxAuto, voiceArm,
    locationTagging, effAiTranscription, effAutoListen,
  } = settings;

  const engineRef = useRef(null);
  const wakeRef = useRef(null);
  const recRef = useRef(null);
  const recGenRef = useRef(0);
  const listeningRef = useRef(false);
  const voiceArmRef = useRef(voiceArm);
  const armRef = useRef(null);
  const recWantedRef = useRef(false);
  const silentRef = useRef(!settings.notifications);
  const soundRef = useRef(settings.sound);
  const vibrationRef = useRef(settings.vibration);
  const locRef = useRef(null);
  const lastHeardRef = useRef('');

  const [listening, setListening] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [db, setDb] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [lastSavedId, setLastSavedId] = useState(null);
  const [error, setError] = useState(null);
  const [voiceHeard, setVoiceHeard] = useState(false);
  const [voiceSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua) && !window.MSStream) return false; // iOS Safari/PWA does not support web speech recognition
    return true;
  });
  const { toast } = useToast();

  useEffect(() => { listeningRef.current = listening; }, [listening]);
  useEffect(() => { voiceArmRef.current = voiceArm; }, [voiceArm]);
  useEffect(() => { silentRef.current = !settings.notifications; }, [settings.notifications]);
  useEffect(() => { soundRef.current = settings.sound; }, [settings.sound]);
  useEffect(() => { vibrationRef.current = settings.vibration; }, [settings.vibration]);

  const saveMoment = useCallback(async (rec) => {
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: new File([rec.blob], rec.name, { type: 'audio/wav' }) });
      await base44.entities.Moment.create({
        name: rec.name,
        timestamp: rec.timestamp,
        trigger_type: rec.triggerType,
        duration_ms: rec.durationMs,
        peak_db: rec.peakDb,
        location_label: rec.location?.locality || rec.location?.place || '',
        tags: rec.tags || [],
        audio_uri: file_uri,
        transcript: '',
        status: 'pending',
      });
    } catch (e) {
      // best-effort: workflow transcription failure must not block the capture
    }
  }, []);

  const refresh = useCallback(async () => {
    if (effTempRetentionHours > 0) await cleanupTemporaryByAge(effTempRetentionHours);
    if (effMaxStorageBytes > 0) await cleanupByStorageLimit(effMaxStorageBytes);
    setRecordings(await listRecordings());
  }, [effTempRetentionHours, effMaxStorageBytes]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => () => { recWantedRef.current = false; engineRef.current?.stop(); recRef.current?.stop(); }, []);

  const handleCapture = useCallback(async ({ blob, durationMs, peakDb, triggerType, triggerTimestamp, triggerOffsetMs }) => {
    const ts = triggerTimestamp || Date.now();
    const protectedCapture = triggerType === 'button' || triggerType === 'voice';
    const rawLoc = locRef.current;
    let loc = null;
    if (rawLoc) {
      let place = null;
      if (protectedCapture) place = await reverseGeocode(rawLoc.lat, rawLoc.long);
      loc = { lat: rawLoc.lat, long: rawLoc.long, accuracy: rawLoc.accuracy, place: place?.place || null, locality: place?.locality || null };
    }
    const transcript = triggerType === 'voice' ? lastHeardRef.current : null;
    const tags = [triggerType, format(ts, 'EEEE'), format(ts, 'a'), loc?.place].filter(Boolean);
    const meta = buildMetadata({ timestamp: ts, triggerType, peakDb, durationMs, location: loc, transcript, tags });
    const rec = {
      id: `${ts}_${Math.random().toString(36).slice(2, 7)}`,
      name: `btau_${format(ts, 'yyyy-MM-dd_HH-mm-ss')}_${triggerType}.wav`,
      label: format(ts, 'MMM d · HH:mm:ss'),
      timestamp: ts,
      durationMs,
      sizeBytes: blob.size,
      peakDb,
      triggerType,
      triggerTimestamp: ts,
      triggerOffsetMs,
      protected: protectedCapture,
      temporary: !protectedCapture,
      location: loc,
      tags,
      transcript,
      meta,
      blob,
    };
    setRecordings((prev) => [rec, ...prev.filter((r) => r.id !== rec.id)]);
    setCapturing(false);
    setLastSavedId(rec.id);
    try {
      await saveRecording(rec);
      base44.analytics.track({ eventName: 'recording_saved' });
      if (!protectedCapture) await cleanupTemporary(maxAuto);
      if (effTempRetentionHours > 0) await cleanupTemporaryByAge(effTempRetentionHours);
      if (effMaxStorageBytes > 0) await cleanupByStorageLimit(effMaxStorageBytes);
      refresh();
      if (protectedCapture) saveMoment(rec);
    } catch (e) {
      setRecordings((prev) => prev.filter((r) => r.id !== rec.id));
      const full = e?.name === 'QuotaExceededError' || /quota|storage/i.test(e?.message || '');
      setError(full
        ? 'Device storage is full, so the capture was not saved. Delete temporary captures or lower the storage limit in Settings, then try again.'
        : `Couldn't save the capture: ${e?.message || 'unknown error'}. Try again.`);
      toast({ variant: 'destructive', description: 'Capture failed — see the message at the top of the screen' });
    }
    if (listeningRef.current && !silentRef.current) showStatus('Back That App Up! — Listening', 'Pre-roll capture is active. Audio stays on this device.', soundRef.current);
  }, [refresh, maxAuto, effTempRetentionHours, effMaxStorageBytes, saveMoment, toast]);

  const stopRec = useCallback(() => {
    recGenRef.current++; // invalidate any pending restart from a stale instance
    const r = recRef.current;
    recRef.current = null;
    try { r?.stop(); } catch {}
  }, []);

  const startRec = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    stopRec();
    const myGen = ++recGenRef.current;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    const phrases = [effPhrase, ...effCustomPhrases].map((p) => p.toLowerCase().trim()).filter(Boolean);
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join(' ').toLowerCase();
      if (!phrases.some((p) => text.includes(p))) return;
      setVoiceHeard(true);
      lastHeardRef.current = text;
      setTimeout(() => setVoiceHeard(false), 1500);
      if (listeningRef.current && engineRef.current) {
        engineRef.current.voiceCapture();
        stopRec(); // clear transcript; onend restarts recognition, not the mic
      } else {
        stopRec();
        armRef.current?.();
      }
    };
    rec.onerror = (e) => {
      const err = e?.error || 'unknown';
      if (err === 'no-speech' || err === 'aborted') return;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        recWantedRef.current = false;
        voiceArmRef.current = false;
        settings.setVoiceArm(false);
        toast({ variant: 'destructive', description: 'Voice recognition blocked. Check microphone permission.' });
        return;
      }
      if (err === 'audio-capture') {
        toast({ variant: 'destructive', description: 'No microphone found for voice recognition.' });
        return;
      }
      toast({ description: `Voice recognition error: ${err}` });
    };
    rec.onend = () => {
      if (recWantedRef.current && recGenRef.current === myGen) {
        setTimeout(() => {
          if (recGenRef.current !== myGen || !recWantedRef.current) return;
          try { rec.start(); recRef.current = rec; } catch {}
        }, 300);
      }
    };
    try { rec.start(); recRef.current = rec; } catch {}
  }, [stopRec, toast, effPhrase, effCustomPhrases, settings]);

  const arm = async () => {
    setError(null);
    recWantedRef.current = false;
    stopRec();
    if (locationTagging) captureLocation().then((l) => { locRef.current = l; });
    const engine = new PreRollEngine({
      onLevel: setDb,
      onCapture: handleCapture,
      onCaptureStart: (t) => {
        setCapturing(true);
        if (vibrationRef.current) navigator.vibrate?.(60);
        if (!silentRef.current) {
          const msg = t === 'spike' ? 'Spike detected — saving the moment…' : t === 'voice' ? 'Voice phrase heard — saving…' : 'Saving the moment…';
          showStatus('Back That App Up! — Capturing', msg, soundRef.current);
        }
      },
    });
    engine.setSampleRate(rateFor(effQuality));
    engine.setInputDeviceId(inputDeviceId);
    engine.setPostRoll(effPostRoll);
    engine.setAutoCapture(effAutoCapture);
    engine.setExtendOnSecondTrigger(extendOnSecondTrigger);
    engine.setTriggerCooldown(triggerCooldown * 1000);
    engine.setSpikeCooldown(effSpikeCooldown * 1000);
    engine.setSustainedDuration(effSustainedDuration);
    try {
      await engine.start(effRewind, threshold);
    } catch (err) {
      const name = err?.name || '';
      const denied = name === 'NotAllowedError' || name === 'SecurityError';
      const inUse = name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError';
      setError(
        denied
          ? 'Microphone access is blocked. Open your device settings, allow microphone access for this app, then tap Arm again.'
          : inUse
          ? 'The microphone is in use by another app. Close the other app, then tap Arm again.'
          : `Couldn't start listening: ${err?.message || 'unknown error'}. Tap Arm to try again.`
      );
      return;
    }
    engineRef.current = engine;
    setListening(true);
    base44.analytics.track({ eventName: 'detector_armed' });
    if (!silentRef.current) ensurePermission().then((ok) => ok && showStatus('Back That App Up! — Listening', 'Pre-roll capture is active. Audio stays on this device.', soundRef.current));
    navigator.wakeLock?.request('screen').then((l) => { wakeRef.current = l; }).catch(() => {});
    if (voiceArmRef.current) { recWantedRef.current = true; startRec(); }
  };
  useEffect(() => { armRef.current = arm; }, [arm]);
  // Start/stop the speech recognizer whenever voice-arm is on, so the phrase
  // can arm the detector (not just save while already listening).
  useEffect(() => {
    if (voiceArm) { recWantedRef.current = true; startRec(); }
    else { recWantedRef.current = false; stopRec(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceArm]);
  useEffect(() => {
    if (effAutoListen) armRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disarm = () => {
    engineRef.current?.stop();
    engineRef.current = null;
    wakeRef.current?.release();
    setListening(false);
    setCapturing(false);
    setDb(0);
    hideStatus();
  };

  const changeThreshold = (v) => {
    settings.setThreshold(v);
    if (engineRef.current) engineRef.current.threshold = v;
  };
  const changeRewind = (v) => {
    settings.setRewind(v);
    const applied = settings.can(FEATURES.EXTENDED_PRE_ROLL) ? v : Math.min(v, 30);
    engineRef.current?.setRewind(applied);
  };
  const changePostRoll = (v) => {
    settings.setPostRoll(v);
    const applied = settings.can(FEATURES.EXTENDED_POST_ROLL) ? v : Math.min(v, 10);
    engineRef.current?.setPostRoll(applied);
  };
  const toggleAutoCapture = () => {
    const next = !effAutoCapture;
    if (next && !settings.can(FEATURES.AUTO_CAPTURE)) { settings.openPaywall(FEATURES.AUTO_CAPTURE); return; }
    settings.setAutoCapture(next);
    engineRef.current?.setAutoCapture(next);
  };
  const changeMaxAuto = (v) => settings.setMaxAuto(v);
  const toggleVoiceArm = () => {
    const next = !voiceArm;
    settings.setVoiceArm(next);
    voiceArmRef.current = next;
    // recognition lifecycle is driven by the voiceArm effect below
  };
  const toggleSilent = () => {
    const enabled = !settings.notifications;
    settings.setNotifications(enabled);
    silentRef.current = !enabled;
    if (!enabled) hideStatus();
    else if (listeningRef.current) ensurePermission().then((ok) => ok && showStatus('Back That App Up! — Listening', 'Pre-roll capture is active. Audio stays on this device.', soundRef.current));
  };

  const backThatAppUp = () => engineRef.current?.saveNow();
  const remove = async (id) => { await deleteRecording(id); refresh(); };
  const rename = async (id, label) => {
    const rec = recordings.find((r) => r.id === id);
    if (!rec) return;
    const updated = { ...rec, label };
    setRecordings((prev) => prev.map((r) => (r.id === id ? updated : r)));
    try {
      await saveRecording(updated);
    } catch (e) {
      setRecordings((prev) => prev.map((r) => (r.id === id ? rec : r)));
      toast({ variant: 'destructive', description: 'Rename failed' });
    }
  };
  const protect = async (id) => {
    const rec = recordings.find((r) => r.id === id);
    if (!rec) return;
    const updated = { ...rec, protected: true };
    setRecordings((prev) => prev.map((r) => (r.id === id ? updated : r)));
    try {
      const saved = await protectRecording(id);
      if (saved) {
        setRecordings((prev) => prev.map((r) => (r.id === id ? saved : r)));
      } else {
        setRecordings((prev) => prev.map((r) => (r.id === id ? rec : r)));
        toast({ variant: 'destructive', description: 'Failed to protect capture' });
      }
    } catch (e) {
      setRecordings((prev) => prev.map((r) => (r.id === id ? rec : r)));
      toast({ variant: 'destructive', description: 'Failed to protect capture' });
    }
  };
  const deleteAllTemp = async () => {
    const n = await deleteAllTemporary();
    if (n) toast({ description: `Deleted ${n} temporary capture${n === 1 ? '' : 's'}` });
    refresh();
  };

  return {
    listening, capturing, db,
    threshold, rewind: effRewind, postRoll: effPostRoll, autoCapture: effAutoCapture, maxAuto, voiceArm, voiceSupported, voiceHeard, silentMode: !settings.notifications,
    recordings, lastSavedId, error,
    refresh, arm, disarm,
    changeThreshold, changeRewind, changePostRoll, toggleAutoCapture, changeMaxAuto, toggleVoiceArm, toggleSilent,
    backThatAppUp, remove, rename, protect, deleteAllTemp, dismissError: () => setError(null),
  };
}