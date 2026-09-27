import { useEffect, useState } from 'react';

// Quick-access backup — two ways to "catch the previous back-up" fast:
// 1) PWA home-screen icon shortcut / Siri voice command deep-links to
//    /?action=backup. On launch it saves the current pre-roll buffer when the
//    engine is armed. If the buffer is not armed yet (cold start), it waits for
//    the auto-listen arm to come online, then saves.
// 2) Pressing "B" saves instantly while the app is open and listening.
// Both only fire while listening — that is the only time a buffer exists.
export default function useQuickBackup({ listening, onSave, toast }) {
  const [pending, setPending] = useState(false);

  // Deep link: ?action=backup (set by the manifest "Back up now" shortcut or Siri).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') !== 'backup') return;
    params.delete('action');
    const rest = params.toString();
    window.history.replaceState({}, '', rest ? `/?${rest}` : '/');
    if (listening) {
      onSave?.();
      toast?.({ description: 'Backed up the last moment' });
    } else {
      // Auto-listen (on after setup / always on for Pro) will arm shortly; save once it does.
      setPending(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save once the buffer comes online after a deep-link launch.
  useEffect(() => {
    if (!pending || !listening) return;
    setPending(false);
    onSave?.();
    toast?.({ description: 'Backed up the last moment' });
  }, [pending, listening, onSave, toast]);

  // Give up after a short window if the listener never came online.
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => {
      setPending(false);
      toast?.({ description: 'Arm listening, then tap Back up now to save the moment' });
    }, 6000);
    return () => clearTimeout(t);
  }, [pending, toast]);

  // Keyboard shortcut: press B to save (only while listening).
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (e.key === 'b' || e.key === 'B') {
        if (!listening) return;
        e.preventDefault();
        onSave?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listening, onSave]);
}