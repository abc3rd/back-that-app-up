import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import RewindPicker from '@/components/btau/RewindPicker';
import PostRollPicker from '@/components/btau/PostRollPicker';
import { useSettings } from '@/hooks/useSettings';

export default function CaptureSection() {
  const s = useSettings();
  return (
    <SettingSection title="Capture" description="How the rolling buffer turns into a saved capture">
      <SettingRow title={s.isPro ? 'Always-on listening (Pro)' : 'Auto-listen on launch'} description={s.isPro ? 'Pro tier keeps the pre-roll buffer armed whenever the app is open' : 'Start the always-on pre-roll buffer automatically when you open the app (dashcam mode)'}>
        <Switch checked={s.effAutoListen} onCheckedChange={s.setAutoListen} disabled={s.isPro} />
      </SettingRow>
      <div>
        <p className="text-sm">Pre-roll duration</p>
        <p className="mb-3 text-sm text-muted-foreground">Recent audio kept before a trigger</p>
        <RewindPicker value={s.effRewind} onChange={s.setRewind} />
      </div>
      <div>
        <p className="text-sm">Post-roll duration</p>
        <p className="mb-3 text-sm text-muted-foreground">Audio kept after a trigger</p>
        <PostRollPicker value={s.effPostRoll} onChange={s.setPostRoll} />
      </div>
      <SettingRow title="Extend on second trigger" description="A second trigger during post-roll extends the capture">
        <Switch checked={s.extendOnSecondTrigger} onCheckedChange={s.setExtendOnSecondTrigger} />
      </SettingRow>
      <SettingRow title="Trigger cooldown" description="Minimum gap between voice triggers">
        <div className="flex items-center gap-2">
          <Slider value={[s.triggerCooldown]} min={0} max={10} step={1} onValueChange={(a) => s.setTriggerCooldown(a[0])} className="w-28" />
          <span className="w-10 text-right font-mono text-sm">{s.triggerCooldown}s</span>
        </div>
      </SettingRow>
      <SettingRow title="Prevent overlapping captures" description="One capture at a time (always enforced)">
        <Switch checked={s.preventOverlaps} onCheckedChange={s.setPreventOverlaps} />
      </SettingRow>
    </SettingSection>
  );
}