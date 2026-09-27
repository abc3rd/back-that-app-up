import React, { useEffect, useState } from 'react';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import { useSettings } from '@/hooks/useSettings';
import { FEATURES } from '@/lib/entitlements';
import { ResponsiveSelect } from '@/components/ui/responsive-select';
import { STANDARD_RATE, HIGH_RATE } from '@/lib/preroll/PreRollEngine';

export default function AudioSection() {
  const s = useSettings();
  const canHigh = s.can(FEATURES.HIGH_QUALITY);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices(list.filter((d) => d.kind === 'audioinput'));
      } catch {}
    };
    load();
  }, []);

  const rate = s.effQuality === 'high' ? HIGH_RATE : STANDARD_RATE;

  return (
    <SettingSection title="Audio" description="Recording quality and input source">
      <SettingRow title="Quality" description={canHigh ? 'Standard or high' : 'Standard (high is Pro)'} pro locked={!canHigh}>
        <div className="flex rounded-full bg-secondary p-1">
          <button onClick={() => s.setQuality('standard')} className={`rounded-full px-3 py-1 text-sm ${s.effQuality === 'standard' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}>Standard</button>
          <button onClick={() => s.setQuality('high')} className={`rounded-full px-3 py-1 text-sm ${s.effQuality === 'high' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}>High</button>
        </div>
      </SettingRow>
      <SettingRow title="Input device" description="Microphone source (where the browser permits)">
        <ResponsiveSelect
          value={s.inputDeviceId || 'default'}
          onValueChange={(v) => s.setInputDeviceId(v === 'default' ? '' : v)}
          placeholder="Default"
          triggerClassName="w-44"
          options={[{ value: 'default', label: 'Default' }, ...devices.map((d) => ({ value: d.deviceId, label: d.label || 'Microphone' }))]}
        />
      </SettingRow>
      <SettingRow title="Input level meter" description="Live levels show on the recorder screen">
        <span className="text-sm text-muted-foreground">On Home</span>
      </SettingRow>
      <SettingRow title="Format" description="WAV (PCM 16-bit)">
        <span className="font-mono text-sm">{rate} Hz</span>
      </SettingRow>
    </SettingSection>
  );
}