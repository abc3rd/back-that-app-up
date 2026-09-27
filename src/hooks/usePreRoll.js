import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import PreRollEngine from '@/lib/preroll/PreRollEngine';
import { deleteRecording, listRecordings, saveRecording } from '@/lib/preroll/storage';

const stored = (key, fallback) => Number(localStorage.getItem(key)) || fallback;

export default function usePreRoll() {
  const engineRef = useRef(null);
  const wakeRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [db, setDb] = useState(0);
  const [threshold, setThreshold] = useState(() => stored('btau.threshold', 75));
  const [rewind, setRewind] = useState(() => stored('btau.rewind', 10));
  const [recordings, setRecordings] = useState([]);
  const [lastSavedId, setLastSavedId] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => setRecordings(await listRecordings()), []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => () => engineRef.current?.stop(), []);

  const handleCapture = useCallback(async ({ blob, durationMs, peakDb, reason }) => {
    const ts = Date.now();
    const rec = { id: String(ts), name: `btau_${format(ts, 'yyyy-MM-dd_HH-mm-ss')}.wav`, timestamp: ts, durationMs, sizeBytes: blob.size, peakDb, reason, blob };
    await saveRecording(rec);
    setCapturing(false);
    setLastSavedId(rec.id);
    refresh();
  }, [refresh]);

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
    navigator.wakeLock?.request('screen').then((l) => { wakeRef.current = l; }).catch(() => {});
  };

  const disarm = () => {
    engineRef.current?.stop();
    engineRef.current = null;
    wakeRef.current?.release();
    setListening(false);
    setCapturing(false);
    setDb(0);
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

  const backThatAppUp = () => engineRef.current?.saveNow();
  const remove = async (id) => { await deleteRecording(id); refresh(); };

  return { listening, capturing, db, threshold, rewind, recordings, lastSavedId, error, arm, disarm, changeThreshold, changeRewind, backThatAppUp, remove, dismissError: () => setError(null) };
}