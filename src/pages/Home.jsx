import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import usePreRoll from '@/hooks/usePreRoll';
import { useTabScroll } from '@/hooks/useTabScroll';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/btau/Header';
import ArmControl from '@/components/btau/ArmControl';
import LevelMeter from '@/components/btau/LevelMeter';
import SaveButton from '@/components/btau/SaveButton';
import ThresholdControl from '@/components/btau/ThresholdControl';
import RewindPicker, { REWIND_OPTIONS } from '@/components/btau/RewindPicker';
import RecordingsList from '@/components/btau/RecordingsList';
import VoiceTrigger from '@/components/btau/VoiceTrigger';
import StealthToggle from '@/components/btau/StealthToggle';
import PullToRefresh from '@/components/PullToRefresh';
import AutoCaptureToggle from '@/components/btau/AutoCaptureToggle';
import PostRollPicker from '@/components/btau/PostRollPicker';
import MaxAutoControl from '@/components/btau/MaxAutoControl';
import MomentSearch from '@/components/btau/MomentSearch';
import PublicFooter from '@/components/btau/PublicFooter';
import QuickBackupButton from '@/components/btau/QuickBackupButton';
import useQuickBackup from '@/hooks/useQuickBackup';
import { useToast } from '@/components/ui/use-toast';
import { needsOnboarding } from '@/lib/deviceSetup';

export default function Home() {
  const scrollRef = useRef(null);
  useTabScroll('/', scrollRef);
  const p = usePreRoll();
  const [highlightId, setHighlightId] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (needsOnboarding()) navigate('/onboarding', { replace: true });
  }, []);
  const rewindLabel = REWIND_OPTIONS.find((o) => o.value === p.rewind)?.label ?? `${p.rewind} s`;
  const { toast } = useToast();
  useQuickBackup({ listening: p.listening, onSave: p.backThatAppUp, toast });
  const statusLabel = p.error ? 'Needs attention' : p.capturing ? 'Capturing' : p.listening ? 'Active' : 'Paused';
  const statusTone = p.error ? 'error' : p.listening ? 'active' : 'idle';

  return (
    <>
    <PullToRefresh containerRef={scrollRef} onRefresh={p.refresh}>
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex max-w-md flex-col gap-12 px-6 pb-[max(7rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
          <Header status={statusLabel} tone={statusTone} micActive={p.listening} />
          {p.error && (
            <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm">
              <p className="flex-1">{p.error}</p>
              <button aria-label="Dismiss error" onClick={p.dismissError} className="select-none text-muted-foreground transition-colors hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <section className="flex flex-col items-center gap-10">
            <ArmControl listening={p.listening} onArm={p.arm} onDisarm={p.disarm} />
            <LevelMeter db={p.db} threshold={p.threshold} active={p.listening} />
          </section>
          <SaveButton listening={p.listening} capturing={p.capturing} captureKind={p.captureKind} rewindLabel={rewindLabel} postRoll={p.postRoll} onSave={p.backThatAppUp} />
          <section className="flex flex-col gap-8 rounded-3xl border-gradient-neon p-6 glow-neon-soft">
            <VoiceTrigger enabled={p.voiceArm} supported={p.voiceSupported} heard={p.voiceHeard} onToggle={p.toggleVoiceArm} />
            <div className="h-px bg-border" />
            <ThresholdControl value={p.threshold} onChange={p.changeThreshold} />
            <RewindPicker value={p.rewind} onChange={p.changeRewind} />
            <PostRollPicker value={p.postRoll} onChange={p.changePostRoll} />
            <div className="h-px bg-border" />
            <AutoCaptureToggle enabled={p.autoCapture} onToggle={p.toggleAutoCapture} />
            {p.autoCapture && <MaxAutoControl value={p.maxAuto} onChange={p.changeMaxAuto} />}
            <div className="h-px bg-border" />
            <StealthToggle enabled={p.silentMode} onToggle={p.toggleSilent} />
          </section>
          <MomentSearch recordings={p.recordings} onHighlight={setHighlightId} />
          <RecordingsList recordings={p.recordings} transcriptionOn={p.aiTranscriptionOn} lastSavedId={p.lastSavedId} highlightId={highlightId} onDelete={p.remove} onRename={p.rename} onProtect={p.protect} onDeleteAllTemporary={p.deleteAllTemp} />
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Audio stays in memory only. Nothing is written until a spike or a tap, and clips never leave this device.
          </p>
          <PublicFooter />
        </main>
      </div>
    </PullToRefresh>
    <QuickBackupButton listening={p.listening} onSave={p.backThatAppUp} />
    </>
  );
}