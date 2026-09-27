import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import PreRollEngine from '@/lib/preroll/PreRollEngine';
import { deleteRecording, listRecordings, saveRecording } from '@/lib/preroll/storage';

const stored = (key, fallback) => Number(localStorage.getItem(key)) || fallback;
const PHRASE = 'back that app up';

export default function usePreRoll() {
  const engineRef = useRef(null);
  const wakeRef = useRef(null);
  const recRef = useRef(null);
  const listeningRef = useRef(false);
  const voiceArmRef = useRef(false);

  const [listening, setListening] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [db, setDb] = useState(0);
  const [threshold, setThreshold] = useState(() => stored('btau.threshold', 75));
  const [rewind, setRewind] = useState(() => stored('btau.rewind', 10));
  const [recordings, setRecordings] = useState([]);
  const [lastSavedId, setLastSavedId] = useState(null);
  const [error, setError] = useState(null);
  const [voiceHeard, setVoiceHeard] = useState(false);
  const [voiceSupported] = useState(() => typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
  const [voiceArm, setVoiceArm] = useState(false);

  useEffect(() => { listeningRef.current = listening; }, [listening]);
  useEffect(() => { voiceArmRef.current = voiceArm; }, [voiceArm]);

  const refresh = useCallback(async () => setRecordings(await listRecordings()), []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => () => { engineRef.current?.stop(); recRef.current?.stop(); }, []);

  const handleCapture = useCallback(async ({ blob, durationMs, peakDb, reason }) => {
    const ts = Date.now();
    const rec = { id: String(ts), name: `btau_${format(ts, 'yyyy-MM-dd_HH-mm-ss')}.wav`, label: format(ts, 'MMM d · HH:mm:ss'), timestamp: ts, durationMs, sizeBytes: blob.size, peakDb, reason, blob };
    await saveRecording(rec);
    setCapturing(false);
    setLastSavedId(rec.id);
    refresh();
  }, [refresh]);

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
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join(' ').toLowerCase();
      if (text.includes(PHRASE)) {
        setVoiceHeard(true);
        setTimeout(() => setVoiceHeard(false), 1500);
        stopRec();
        arm();
      }
    };
    rec.onerror = () => {};
    rec.onend = () => {
      if (voiceArmRef.current && !listeningRef.current) {
        try { rec.start(); } catch {}
      }
    };
    try { rec.start(); recRef.current = rec; } catch {}
  }, [stopRec]);

  const arm = async () => {
    setError(null);
    const engine = new PreRollEngine({ onLevel: setDb, onCapture: handleCapture, onCaptureStart: () => setCapturing(true) });
    try {
      await engine.start(rewind, threshold);
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Microphone access was denied. Allow it in your device settings to start listening.' : err.message);
      return;
    }
    engineRef.current = engine;
    setListening(true);
    stopRec();
    navigator.wakeLock?.request('screen').then((l) => { wakeRef.current = l; }).catch(() => {});
  };

  const disarm = () => {
    engineRef.current?.stop();
    engineRef.current = null;
    wakeRef.current?.release();
    setListening(false);
    setCapturing(false);
    setDb(0);
    if (voiceArmRef.current) startRec();
  };

  const changeThreshold = (v) => {
    setThreshold(v);
    localStorage.setItem('btau.threshold', v);
    if (engineRef.current) engineRef.current.threshold = v;
  };

  const changeRewind = (v) => {
    setRewind(v);
    localStorage.setItem('btau.rewind', v);
    engineRef.current?.setRewind(v);
  };

  const toggleVoiceArm = () => {
    const next = !voiceArm;
    setVoiceArm(next);
    voiceArmRef.current = next;
    if (next) startRec(); else stopRec();
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

  return { listening, capturing, db, threshold, rewind, recordings, lastSavedId, error, voiceArm, voiceSupported, voiceHeard, refresh, arm, disarm, changeThreshold, changeRewind, backThatAppUp, remove, rename, toggleVoiceArm, dismissError: () => setError(null) };
}