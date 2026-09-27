import { useEffect } from 'react';

// Quick-access backup — two ways to "catch the previous back-up" fast:
// 1) PWA home-screen icon shortcut deep-links to /?action=backup. On launch it
//    saves the current pre-roll buffer when the engine is armed, or nudges the
//    user to arm first (a cold start has no buffer to save yet).
// 2) Pressing "B" saves instantly while the app is open and listening.
// Both only fire while listening — that is the only time a buffer exists.
export default function useQuickBackup({ listening, onSave, toast }) {
  // Deep link: ?action=backup (set by the manifest "Back up now" shortcut).
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
      toast?.({ description: 'Arm listening, then tap Back up now to save the moment' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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