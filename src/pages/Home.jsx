import React from 'react';
import { X } from 'lucide-react';
import usePreRoll from '@/hooks/usePreRoll';
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

export default function Home() {
  const p = usePreRoll();
  const rewindLabel = REWIND_OPTIONS.find((o) => o.value === p.rewind)?.label ?? `${p.rewind} s`;

  return (
    <PullToRefresh onRefresh={p.refresh}>
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex max-w-md flex-col gap-12 px-6 pb-[max(4rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
          <Header listening={p.listening} capturing={p.capturing} />
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
          <SaveButton listening={p.listening} capturing={p.capturing} rewindLabel={rewindLabel} onSave={p.backThatAppUp} />
          <section className="flex flex-col gap-8 rounded-3xl border-gradient-neon p-6 glow-neon-soft">
            <VoiceTrigger enabled={p.voiceArm} supported={p.voiceSupported} heard={p.voiceHeard} onToggle={p.toggleVoiceArm} />
            <div className="h-px bg-border" />
            <ThresholdControl value={p.threshold} onChange={p.changeThreshold} />
            <RewindPicker value={p.rewind} onChange={p.changeRewind} />
            <div className="h-px bg-border" />
            <StealthToggle enabled={p.silentMode} onToggle={p.toggleSilent} />
          </section>
          <RecordingsList recordings={p.recordings} lastSavedId={p.lastSavedId} onDelete={p.remove} onRename={p.rename} />
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Audio stays in memory only. Nothing is written until a spike or a tap, and clips never leave this device.
          </p>
        </main>
      </div>
    </PullToRefresh>
  );
}