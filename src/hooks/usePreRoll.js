import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import PreRollEngine from '@/lib/preroll/PreRollEngine';
import {
  deleteRecording,
  listRecordings,
  saveRecording,
  protectRecording,
  deleteAllTemporary,
  cleanupTemporary,
} from '@/lib/preroll/storage';
import { ensurePermission, showStatus, hideStatus } from '@/lib/preroll/statusNotification';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

const num = (key, fallback) => Number(localStorage.getItem(key)) || fallback;
const PHRASE = 'back that app up';

export default function usePreRoll() {
  const engineRef = useRef(null);
  const wakeRef = useRef(null);
  const recRef = useRef(null);
  const listeningRef = useRef(false);
  const voiceArmRef = useRef(false);
  const armRef = useRef(null);
  const recWantedRef = useRef(false);
  const autoCaptureRef = useRef(false);
  const postRollRef = useRef(10);
  const maxAutoRef = useRef(10);
  const silentRef = useRef(false);

  const [listening, setListening] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [db, setDb] = useState(0);
  const [threshold, setThreshold] = useState(() => num('btau.threshold.v2', 55));
  const [rewind, setRewind] = useState(() => num('btau.rewind.v3', 30));
  const [postRoll, setPostRoll] = useState(() => num('btau.postroll.v1', 10));
  const [autoCapture, setAutoCapture] = useState(() => localStorage.getItem('btau.autocap') === '1');
  const [maxAuto, setMaxAuto] = useState(() => num('btau.maxauto.v1', 10));
  const [recordings, setRecordings] = useState([]);
  const [lastSavedId, setLastSavedId] = useState(null);
  const [error, setError] = useState(null);
  const [voiceHeard, setVoiceHeard] = useState(false);
  const [voiceSupported] = useState(() => typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
  const [voiceArm, setVoiceArm] = useState(() => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [silentMode, setSilentMode] = useState(() => localStorage.getItem('btau.silent') === '1');
  const { toast } = useToast();

  useEffect(() => { listeningRef.current = listening; }, [listening]);
  useEffect(() => { voiceArmRef.current = voiceArm; }, [voiceArm]);
  useEffect(() => { silentRef.current = silentMode; }, [silentMode]);
  useEffect(() => { autoCaptureRef.current = autoCapture; }, [autoCapture]);
  useEffect(() => { postRollRef.current = postRoll; }, [postRoll]);
  useEffect(() => { maxAutoRef.current = maxAuto; }, [maxAuto]);

  const refresh = useCallback(async () => setRecordings(await listRecordings()), []);
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
    await saveRecording(rec);
    setCapturing(false);
    setLastSavedId(rec.id);
    if (!protectedCapture) {
      await cleanupTemporary(maxAutoRef.current);
    }
    refresh();
    if (protectedCapture) backupToDrive(blob, rec.name);
    if (listeningRef.current && !silentRef.current) showStatus('Back That App Up! — Listening', 'Pre-roll capture is active. Audio stays on this device.');
  }, [refresh, backupToDrive]);

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
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join(' ').toLowerCase();
      if (!text.includes(PHRASE)) return;
      setVoiceHeard(true);
      setTimeout(() => setVoiceHeard(false), 1500);
      if (listeningRef.current && engineRef.current) {
        // Voice-triggered capture: pre-roll + post-roll. The mic buffer keeps running.
        engineRef.current.voiceCapture();
        // Restart recognition to clear the transcript; the mic is NOT restarted.
        stopRec();
      } else {
        stopRec();
        armRef.current?.();
      }
    };
    rec.onerror = (e) => {
      const err = e?.error || 'unknown';
      if (err === 'no-speech' || err === 'aborted') return; // recoverable; onend restarts
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        recWantedRef.current = false;
        voiceArmRef.current = false;
        setVoiceArm(false);
        toast({ variant: 'destructive', description: 'Voice recognition blocked. Check microphone permission.' });
        return;
      }
      toast({ description: `Voice recognition error: ${err}` });
    };
    rec.onend = () => {
      // Restart recognition while it is wanted — independent of the rolling mic buffer.
      if (recWantedRef.current) {
        setTimeout(() => { try { rec.start(); recRef.current = rec; } catch {} }, 300);
      }
    };
    try { rec.start(); recRef.current = rec; } catch {}
  }, [stopRec, toast]);

  const arm = async () => {
    setError(null);
    recWantedRef.current = false;
    stopRec();
    const engine = new PreRollEngine({
      onLevel: setDb,
      onCapture: handleCapture,
      onCaptureStart: (triggerType) => {
        setCapturing(true);
        if (!silentRef.current) {
          const msg = triggerType === 'spike' ? 'Spike detected — saving the moment…'
            : triggerType === 'voice' ? 'Voice phrase heard — saving…'
            : 'Saving the moment…';
          showStatus('Back That App Up! — Capturing', msg);
        }
      },
    });
    try {
      await engine.start(rewind, threshold);
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Microphone access was denied. Allow it in your device settings to start listening.' : err.message);
      return;
    }
    engine.setPostRoll(postRollRef.current);
    engine.setAutoCapture(autoCaptureRef.current);
    engineRef.current = engine;
    setListening(true);
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
    setThreshold(v);
    localStorage.setItem('btau.threshold.v2', v);
    if (engineRef.current) engineRef.current.threshold = v;
  };

  const changeRewind = (v) => {
    setRewind(v);
    localStorage.setItem('btau.rewind.v3', v);
    engineRef.current?.setRewind(v);
  };

  const changePostRoll = (v) => {
    setPostRoll(v);
    localStorage.setItem('btau.postroll.v1', v);
    engineRef.current?.setPostRoll(v);
  };

  const toggleAutoCapture = () => {
    setAutoCapture((prev) => {
      const next = !prev;
      autoCaptureRef.current = next;
      localStorage.setItem('btau.autocap', next ? '1' : '0');
      if (engineRef.current) engineRef.current.setAutoCapture(next);
      return next;
    });
  };

  const changeMaxAuto = (v) => {
    setMaxAuto(v);
    localStorage.setItem('btau.maxauto.v1', v);
    maxAutoRef.current = v;
  };

  const toggleVoiceArm = () => {
    const next = !voiceArm;
    setVoiceArm(next);
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
    await saveRecording(updated);
    setRecordings((prev) => prev.map((r) => (r.id === id ? updated : r)));
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
    listening, capturing, db, threshold, rewind, postRoll, autoCapture, maxAuto,
    recordings, lastSavedId, error, voiceArm, voiceSupported, voiceHeard, silentMode,
    refresh, arm, disarm, changeThreshold, changeRewind, changePostRoll,
    toggleAutoCapture, changeMaxAuto, backThatAppUp, remove, rename, protect,
    deleteAllTemp, toggleVoiceArm, toggleSilent, dismissError: () => setError(null),
  };
}