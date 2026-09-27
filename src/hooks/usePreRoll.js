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
  cleanupExpiredTemporary,
} from '@/lib/preroll/storage';
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
    effSustainedDuration, effTempRetentionMinutes, effSpikeCooldown,
    threshold, triggerCooldown, extendOnSecondTrigger, inputDeviceId, maxAuto, voiceArm,
  } = settings;

  const engineRef = useRef(null);
  const wakeRef = useRef(null);
  const recRef = useRef(null);
  const listeningRef = useRef(false);
  const voiceArmRef = useRef(voiceArm);
  const armRef = useRef(null);
  const recWantedRef = useRef(false);
  const silentRef = useRef(false);

  const [listening, setListening] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [db, setDb] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [lastSavedId, setLastSavedId] = useState(null);
  const [error, setError] = useState(null);
  const [voiceHeard, setVoiceHeard] = useState(false);
  const [voiceSupported] = useState(() => typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
  const [silentMode, setSilentMode] = useState(() => localStorage.getItem('btau.silent') === '1');
  const { toast } = useToast();

  useEffect(() => { listeningRef.current = listening; }, [listening]);
  useEffect(() => { voiceArmRef.current = voiceArm; }, [voiceArm]);
  useEffect(() => { silentRef.current = silentMode; }, [silentMode]);

  const refresh = useCallback(async () => {
    if (effTempRetentionMinutes > 0) await cleanupExpiredTemporary(effTempRetentionMinutes);
    setRecordings(await listRecordings());
  }, [effTempRetentionMinutes]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => () => { recWantedRef.current = false; engineRef.current?.stop(); recRef.current?.stop(); }, []);

  const backupToDrive = useCallback(async (blob, name) => {
    try {
      const res = await base44.functions.invoke('createDriveUploadSession', { fileName: name, mimeType: 'audio/wav', contentLength: blob.size });
      const uploadUrl = res.data?.uploadUrl;
      if (!uploadUrl) throw new Error('No upload URL');
      const putRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'audio/wav' }, body: blob });
      if (!putRes.ok) throw new Error('Upload failed');
      toast({ description: 'Recording backed up to Google Drive' });
    } catch (e) {
      toast({ variant: 'destructive', description: 'Google Drive backup failed' });
    }
  }, [toast]);

  const handleCapture = useCallback(async ({ blob, durationMs, peakDb, triggerType, triggerTimestamp, triggerOffsetMs }) => {
    const ts = triggerTimestamp || Date.now();
    const protectedCapture = triggerType === 'button' || triggerType === 'voice';
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
      blob,
    };
    setRecordings((prev) => [rec, ...prev.filter((r) => r.id !== rec.id)]);
    setCapturing(false);
    setLastSavedId(rec.id);
    try {
      await saveRecording(rec);
      base44.analytics.track({ eventName: 'recording_saved' });
      if (!protectedCapture) await cleanupTemporary(maxAuto);
      if (effTempRetentionMinutes > 0) await cleanupExpiredTemporary(effTempRetentionMinutes);
      refresh();
      if (protectedCapture) backupToDrive(blob, rec.name);
    } catch (e) {
      setRecordings((prev) => prev.filter((r) => r.id !== rec.id));
      toast({ variant: 'destructive', description: 'Failed to save capture' });
    }
    if (listeningRef.current && !silentRef.current) showStatus('Back That App Up! — Listening', 'Pre-roll capture is active. Audio stays on this device.');
  }, [refresh, backupToDrive, maxAuto, effTempRetentionMinutes, toast]);

  const stopRec = useCallback(() => {
    const r = recRef.current;
    recRef.current = null;
    try { r?.stop(); } catch {}
  }, []);

  const startRec = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    stopRec();
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    const phrases = [effPhrase, ...effCustomPhrases].map((p) => p.toLowerCase().trim()).filter(Boolean);
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join(' ').toLowerCase();
      if (!phrases.some((p) => text.includes(p))) return;
      setVoiceHeard(true);
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
      toast({ description: `Voice recognition error: ${err}` });
    };
    rec.onend = () => {
      if (recWantedRef.current) {
        setTimeout(() => { try { rec.start(); recRef.current = rec; } catch {} }, 300);
      }
    };
    try { rec.start(); recRef.current = rec; } catch {}
  }, [stopRec, toast, effPhrase, effCustomPhrases, settings]);

  const arm = async () => {
    setError(null);
    recWantedRef.current = false;
    stopRec();
    const engine = new PreRollEngine({
      onLevel: setDb,
      onCapture: handleCapture,
      onCaptureStart: (t) => {
        setCapturing(true);
        if (!silentRef.current) {
          const msg = t === 'spike' ? 'Spike detected — saving the moment…' : t === 'voice' ? 'Voice phrase heard — saving…' : 'Saving the moment…';
          showStatus('Back That App Up! — Capturing', msg);
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
      setError(err.name === 'NotAllowedError' ? 'Microphone access was denied. Allow it in your device settings to start listening.' : err.message);
      return;
    }
    engineRef.current = engine;
    setListening(true);
    base44.analytics.track({ eventName: 'detector_armed' });
    if (!silentRef.current) ensurePermission().then((ok) => ok && showStatus('Back That App Up! — Listening', 'Pre-roll capture is active. Audio stays on this device.'));
    navigator.wakeLock?.request('screen').then((l) => { wakeRef.current = l; }).catch(() => {});
    if (voiceArmRef.current) { recWantedRef.current = true; startRec(); }
  };
  useEffect(() => { armRef.current = arm; }, [arm]);

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
    recWantedRef.current = next;
    if (next) startRec(); else stopRec();
  };
  const toggleSilent = () => {
    setSilentMode((prev) => {
      const next = !prev;
      silentRef.current = next;
      localStorage.setItem('btau.silent', next ? '1' : '0');
      if (next) hideStatus();
      else if (listeningRef.current) ensurePermission().then((ok) => ok && showStatus('Back That App Up! — Listening', 'Pre-roll capture is active. Audio stays on this device.'));
      return next;
    });
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
    const updated = await protectRecording(id);
    if (updated) {
      setRecordings((prev) => prev.map((r) => (r.id === id ? updated : r)));
      backupToDrive(updated.blob, updated.name);
    }
  };
  const deleteAllTemp = async () => {
    const n = await deleteAllTemporary();
    if (n) toast({ description: `Deleted ${n} temporary capture${n === 1 ? '' : 's'}` });
    refresh();
  };

  return {
    listening, capturing, db,
    threshold, rewind: effRewind, postRoll: effPostRoll, autoCapture: effAutoCapture, maxAuto, voiceArm, voiceSupported, voiceHeard, silentMode,
    recordings, lastSavedId, error,
    refresh, arm, disarm,
    changeThreshold, changeRewind, changePostRoll, toggleAutoCapture, changeMaxAuto, toggleVoiceArm, toggleSilent,
    backThatAppUp, remove, rename, protect, deleteAllTemp, dismissError: () => setError(null),
  };
}