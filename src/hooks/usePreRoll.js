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
import { offloadToCloud, CLOUD_LABELS } from '@/lib/preroll/cloud';
import { triggerTag } from '@/lib/preroll/triggers';
import { transcribeLocalRecording } from '@/lib/preroll/transcribe';
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
  const recordingsRef = useRef([]);
  const transcribingRef = useRef(new Set());
  const pendingMomentRef = useRef(new Set());
  const startingRef = useRef(false);
  const sessionRef = useRef(0);
  const mountedRef = useRef(true);
  const failedCaptureRef = useRef(null);

  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [listening, setListening] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureKind, setCaptureKind] = useState(null);
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
  useEffect(() => { recordingsRef.current = recordings; }, [recordings]);
  useEffect(() => { voiceArmRef.current = voiceArm; }, [voiceArm]);
  useEffect(() => { silentRef.current = !settings.notifications; }, [settings.notifications]);
  useEffect(() => { soundRef.current = settings.sound; }, [settings.sound]);
  useEffect(() => { vibrationRef.current = settings.vibration; }, [settings.vibration]);

  // Every capture becomes a moment tagged with how it was triggered (Manual
  // Button / Voice Command / Sound Spike), so the list can be scanned by type.
  const saveMoment = useCallback(async (rec) => {
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: new File([rec.blob], rec.name, { type: 'audio/wav' }) });
    return base44.entities.Moment.create({
      name: rec.name,
      timestamp: rec.timestamp,
      trigger_type: rec.triggerType,
      duration_ms: rec.durationMs,
      peak_db: rec.peakDb,
      location_label: rec.location?.locality || rec.location?.place || '',
      tags: rec.tags || [],
      audio_uri: file_uri,
      transcript: rec.transcript || '',
      status: 'pending',
    });
  }, []);

  const refresh = useCallback(async () => {
    if (effTempRetentionHours > 0) await cleanupTemporaryByAge(effTempRetentionHours);
    if (effMaxStorageBytes > 0) await cleanupByStorageLimit(effMaxStorageBytes);
    setRecordings(await listRecordings());
  }, [effTempRetentionHours, effMaxStorageBytes]);
  useEffect(() => {
    const safelyRefresh = () => refresh().catch((e) => setError(`Could not read saved recordings: ${e.message}`));
    safelyRefresh();
    const timer = setInterval(safelyRefresh, 60000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sessionRef.current++;
      recWantedRef.current = false;
      recGenRef.current++;
      listeningRef.current = false;
      engineRef.current?.stop();
      recRef.current?.stop();
      wakeRef.current?.release().catch(() => {});
      hideStatus();
    };
  }, []);

  // Visual-voicemail style transcripts: each capture is transcribed in the
  // background and its text is stored with the recording.
  const applyTranscript = useCallback(async (id, patch) => {
    const cur = recordingsRef.current.find((r) => r.id === id);
    if (!cur) return;
    const merged = { ...cur, ...patch };
    setRecordings((prev) => prev.map((r) => (r.id === id ? merged : r)));
    try { await saveRecording(merged); } catch {}
  }, []);

  // Reads the text back out of the audio already stored with a moment, so the
  // moment gets its transcript without a second upload of the same clip.
  const transcribeMomentAudio = useCallback(async (momentId) => {
    const moment = await base44.entities.Moment.get(momentId);
    if (!moment?.audio_uri) throw new Error('Moment has no audio');
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: moment.audio_uri, expires_in: 900 });
    const res = await base44.functions.invoke('transcribeRecording', { audioUrl: signed_url });
    if (res.data?.error) throw new Error(res.data.error);
    return res.data?.transcript || '';
  }, []);

  const transcribeRec = useCallback(async (rec) => {
    if (!effAiTranscription || !rec?.blob || transcribingRef.current.has(rec.id)) return;
    transcribingRef.current.add(rec.id);
    await applyTranscript(rec.id, { transcriptStatus: 'transcribing' });
    try {
      const transcript = rec.momentId ? await transcribeMomentAudio(rec.momentId) : await transcribeLocalRecording(rec);
      await applyTranscript(rec.id, { transcript, transcriptStatus: 'done' });
      if (rec.momentId) await base44.entities.Moment.update(rec.momentId, { transcript, status: 'done' });
    } catch {
      await applyTranscript(rec.id, { transcriptStatus: 'failed' });
    } finally {
      transcribingRef.current.delete(rec.id);
    }
  }, [effAiTranscription, applyTranscript, transcribeMomentAudio]);

  // Newest captures first, so the one just saved reads back immediately. Clips
  // still waiting on their moment are handled by the save flow itself.
  useEffect(() => {
    if (!effAiTranscription) return;
    recordings.filter((r) => r.blob && !r.transcriptStatus && !pendingMomentRef.current.has(r.id)).slice(0, 3).forEach((r) => transcribeRec(r));
  }, [recordings, effAiTranscription, transcribeRec]);

  // Automatic cloud offload: push saved captures to the user's own Dropbox and
  // drop the local copy so device space frees itself.
  const autoOffloadNow = useCallback(async () => {
    if (!settings.autoOffload) return;
    const r = await offloadToCloud();
    if (r.uploaded) {
      refresh();
      toast({ description: `Moved ${r.uploaded} recording${r.uploaded === 1 ? '' : 's'} to ${CLOUD_LABELS[r.target] || 'cloud storage'}` });
    }
  }, [settings.autoOffload, refresh, toast]);
  useEffect(() => { autoOffloadNow().catch((e) => setError(`Cloud offload failed: ${e.message}`)); }, [autoOffloadNow]);

  const handleCapture = useCallback(async ({ blob, durationMs, peakDb, triggerType, triggerTimestamp, triggerOffsetMs, interrupted }) => {
    setSaving(true);
    let locallySaved = false;
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
    const tags = [triggerTag(triggerType), format(ts, 'EEEE'), format(ts, 'a'), loc?.place].filter(Boolean);
    const meta = buildMetadata({ timestamp: ts, triggerType, peakDb, durationMs, location: loc, transcript, tags });
    const rec = {
      id: `${ts}_${Math.random().toString(36).slice(2, 7)}`,
      name: `btau_${format(ts, 'yyyy-MM-dd_HH-mm-ss')}_${triggerType}.wav`,
      label: `${format(ts, 'MMM d · HH:mm:ss')}${interrupted ? ' (partial)' : ''}`,
      interrupted: !!interrupted,
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
    pendingMomentRef.current.add(rec.id);
    setRecordings((prev) => [rec, ...prev.filter((r) => r.id !== rec.id)]);
    setCapturing(false);
    setCaptureKind(null);
    try {
      await saveRecording(rec);
      locallySaved = true;
      setLastSavedId(rec.id);
      try { Promise.resolve(base44.analytics.track({ eventName: 'recording_saved' })).catch(() => {}); } catch { /* Keep saved clips usable if analytics fails. */ }
      if (!protectedCapture) await cleanupTemporary(maxAuto);
      if (effTempRetentionHours > 0) await cleanupTemporaryByAge(effTempRetentionHours);
      if (effMaxStorageBytes > 0) await cleanupByStorageLimit(effMaxStorageBytes);
      await refresh();
      autoOffloadNow().catch(() => {});
      // Moment + transcript are best-effort: the clip is already saved on device,
      // so a hiccup here must never surface as a failed capture.
      try {
        const moment = await saveMoment(rec);
        const linked = { ...rec, momentId: moment?.id };
        if (moment?.id) {
          setRecordings((prev) => prev.map((r) => (r.id === rec.id ? linked : r)));
          try { await saveRecording(linked); } catch {}
        }
        pendingMomentRef.current.delete(rec.id);
        transcribeRec(linked);
      } catch {
        pendingMomentRef.current.delete(rec.id);
        transcribeRec(rec);
      }
    } catch (e) {
      pendingMomentRef.current.delete(rec.id);
      if (locallySaved) {
        setError(`Capture saved locally, but follow-up processing failed: ${e?.message || 'unknown error'}`);
        setSaving(false);
        return;
      }
      failedCaptureRef.current = rec;
      if (engineRef.current) engineRef.current.persistenceBlocked = true;
      setPendingSave(true);
      setRecordings((prev) => prev.filter((r) => r.id !== rec.id));
      const full = e?.name === 'QuotaExceededError' || /quota|storage/i.test(e?.message || '');
      setError(full
        ? 'Device storage is full, so the capture was not saved. Delete temporary captures, then use Retry save. This unsaved clip stays in memory only until you leave.'
        : `Couldn't save the capture: ${e?.message || 'unknown error'}. Use Retry save before leaving.`);
      toast({ variant: 'destructive', description: 'Capture failed — see the message at the top of the screen' });
    }
    setSaving(false);
    if (listeningRef.current && !silentRef.current) showStatus('Back That App Up! — Listening', 'Pre-roll capture is active.', soundRef.current);
  }, [refresh, maxAuto, effTempRetentionHours, effMaxStorageBytes, saveMoment, toast, autoOffloadNow, transcribeRec]);

  const stopRec = useCallback(() => {
    recGenRef.current++; // invalidate any pending restart from a stale instance
    const r = recRef.current;
    recRef.current = null;
    try { r?.stop(); } catch {}
  }, []);

  const startRec = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !voiceSupported) return;
    stopRec();
    const myGen = ++recGenRef.current;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    const phrases = [effPhrase, ...effCustomPhrases].map((p) => p.toLowerCase().trim()).filter(Boolean);
    rec.onresult = (e) => {
      const text = Array.from(e.results).slice(e.resultIndex).filter((r) => r.isFinal).map((r) => r[0].transcript).join(' ').toLowerCase();
      if (!phrases.some((p) => text.includes(p))) return;
      setVoiceHeard(true);
      lastHeardRef.current = text;
      setTimeout(() => { if (mountedRef.current) setVoiceHeard(false); }, 1500);
      if (listeningRef.current && engineRef.current) {
        engineRef.current.voiceCapture();
        stopRec(); // Invalidate the old recognizer and explicitly create a fresh one.
        if (recWantedRef.current) startRec();
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
  }, [stopRec, toast, effPhrase, effCustomPhrases, settings, voiceSupported]);

  const arm = async () => {
    if (startingRef.current || listeningRef.current || failedCaptureRef.current) return;
    startingRef.current = true;
    setStarting(true);
    const session = ++sessionRef.current;
    setError(null);
    recWantedRef.current = false;
    stopRec();
    if (locationTagging) captureLocation().then((l) => { locRef.current = l; });
    const engine = new PreRollEngine({
      onLevel: setDb,
      onCapture: handleCapture,
      onError: (err) => { if (mountedRef.current) { setError(err.message || 'Audio capture failed.'); setSaving(false); } },
      onState: (state) => {
        if (mountedRef.current && state !== 'running') { listeningRef.current = false; setListening(false); }
      },
      onCaptureStart: (t) => {
        setCapturing(true);
        setCaptureKind(t);
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
      engineRef.current?.stop();
      await engine.start(effRewind, threshold);
      if (!mountedRef.current || session !== sessionRef.current) { engine.stop(); return; }
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
    } finally { startingRef.current = false; if (mountedRef.current) setStarting(false); }
    engineRef.current = engine;
    listeningRef.current = true;
    setListening(true);
    try { Promise.resolve(base44.analytics.track({ eventName: 'detector_armed' })).catch(() => {}); } catch { /* Analytics must not block recording. */ }
    if (!silentRef.current) ensurePermission().then((ok) => ok && showStatus('Back That App Up! — Listening', 'Pre-roll capture is active.', soundRef.current));
    navigator.wakeLock?.request('screen').then((l) => { if (session === sessionRef.current && mountedRef.current) wakeRef.current = l; else l.release(); }).catch(() => {});
    if (voiceArmRef.current) { recWantedRef.current = true; startRec(); }
  };
  useEffect(() => { armRef.current = arm; }, [arm]);
  // Start/stop the speech recognizer whenever voice-arm is on, so the phrase
  // can arm the detector (not just save while already listening).
  useEffect(() => {
    if (voiceArm && voiceSupported) { recWantedRef.current = true; startRec(); }
    else { recWantedRef.current = false; stopRec(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceArm]);
  useEffect(() => {
    if (effAutoListen) armRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disarm = () => {
    sessionRef.current++;
    listeningRef.current = false;
    engineRef.current?.stop();
    engineRef.current = null;
    wakeRef.current?.release().catch(() => {});
    wakeRef.current = null;
    setListening(false);
    setCapturing(false);
    setCaptureKind(null);
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
    else if (listeningRef.current) ensurePermission().then((ok) => ok && showStatus('Back That App Up! — Listening', 'Pre-roll capture is active.', soundRef.current));
  };

  const backThatAppUp = () => engineRef.current?.saveNow();
  const retrySave = async () => {
    const rec = failedCaptureRef.current;
    if (!rec || saving) return;
    setSaving(true);
    try {
      await saveRecording(rec);
      failedCaptureRef.current = null;
      if (engineRef.current) engineRef.current.persistenceBlocked = false;
      setPendingSave(false);
      setLastSavedId(rec.id);
      setError(null);
      await refresh();
    } catch (e) { setError(`Could not save clip: ${e.message}. Export it before leaving.`); }
    finally { setSaving(false); }
  };
  const downloadPending = () => {
    const rec = failedCaptureRef.current;
    if (!rec) return;
    const url = URL.createObjectURL(rec.blob);
    const link = document.createElement('a'); link.href = url; link.download = rec.name;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };
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
    starting, saving, pendingSave, retrySave, downloadPending, listening, capturing, captureKind, db, aiTranscriptionOn: effAiTranscription,
    threshold, rewind: effRewind, postRoll: effPostRoll, autoCapture: effAutoCapture, maxAuto, voiceArm, voiceSupported, voiceHeard, silentMode: !settings.notifications,
    recordings, lastSavedId, error,
    refresh, arm, disarm,
    changeThreshold, changeRewind, changePostRoll, toggleAutoCapture, changeMaxAuto, toggleVoiceArm, toggleSilent,
    backThatAppUp, remove, rename, protect, deleteAllTemp, dismissError: () => setError(null),
  };
}