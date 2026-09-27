import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import { useSettings } from '@/hooks/useSettings';
import { FEATURES } from '@/lib/entitlements';

export default function TriggersSection() {
  const s = useSettings();
  const canCustom = s.can(FEATURES.CUSTOM_PHRASE);
  const canMulti = s.can(FEATURES.MULTIPLE_PHRASES);
  const canAuto = s.can(FEATURES.AUTO_CAPTURE);
  const canSust = s.can(FEATURES.SUSTAINED_DURATION);
  const canSpikeCd = s.can(FEATURES.SPIKE_COOLDOWN);
  const [newPhrase, setNewPhrase] = useState('');

  const addPhrase = () => {
    const v = newPhrase.trim();
    if (!v) return;
    s.setCustomPhrases([...s.customPhrases, v]);
    setNewPhrase('');
  };
  const removePhrase = (i) => s.setCustomPhrases(s.customPhrases.filter((_, idx) => idx !== i));

  return (
    <SettingSection title="Triggers" description="What starts a saved capture">
      <SettingRow title="Voice arm" description="Listen for a spoken phrase">
        <Switch checked={s.voiceArm} onCheckedChange={s.setVoiceArm} />
      </SettingRow>
      <SettingRow title="Trigger phrase" description={canCustom ? 'Custom phrase' : '“Back That App Up” (default)'} pro locked={!canCustom}>
        <Input value={s.effPhrase} disabled={!canCustom} onChange={(e) => s.setPhrase(e.target.value)} className="w-44" />
      </SettingRow>
      <SettingRow title="Multiple trigger phrases" description="Add extra voice triggers" pro locked={!canMulti}>
        <div className="w-44">
          {canMulti ? (
            <>
              <div className="mb-2 flex flex-wrap gap-1">
                {s.customPhrases.map((p, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-sm">
                    {p}
                    <button onClick={() => removePhrase(i)} aria-label="Remove phrase"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <Input value={newPhrase} onChange={(e) => setNewPhrase(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPhrase()} placeholder="add phrase" />
                <Button size="sm" onClick={addPhrase}><Plus className="h-4 w-4" /></Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Pro feature</p>
          )}
        </div>
      </SettingRow>
      <SettingRow title="Sound spike auto capture" description="Record when sound crosses the threshold" pro locked={!canAuto}>
        <Switch checked={s.effAutoCapture} onCheckedChange={s.setAutoCapture} />
      </SettingRow>
      <SettingRow title="Adjustable dB threshold" description={`Trigger level: ${s.threshold} dB`}>
        <div className="flex items-center gap-2">
          <Slider value={[s.threshold]} min={40} max={100} step={1} onValueChange={(a) => s.setThreshold(a[0])} className="w-28" />
          <span className="w-10 text-right font-mono text-sm">{s.threshold}</span>
        </div>
      </SettingRow>
      <SettingRow title="Sustained sound duration" description="Sound must hold above threshold" pro locked={!canSust}>
        <div className="flex items-center gap-2">
          <Slider value={[s.effSustainedDuration]} min={0} max={3000} step={100} onValueChange={(a) => s.setSustainedDuration(a[0])} className="w-28" disabled={!canSust} />
          <span className="w-14 text-right font-mono text-sm">{s.effSustainedDuration}ms</span>
        </div>
      </SettingRow>
      <SettingRow title="Spike cooldown" description="Gap between automatic spike captures" pro locked={!canSpikeCd}>
        <div className="flex items-center gap-2">
          <Slider value={[s.effSpikeCooldown]} min={1} max={30} step={1} onValueChange={(a) => s.setSpikeCooldown(a[0])} className="w-28" disabled={!canSpikeCd} />
          <span className="w-10 text-right font-mono text-sm">{s.effSpikeCooldown}s</span>
        </div>
      </SettingRow>
    </SettingSection>
  );
}