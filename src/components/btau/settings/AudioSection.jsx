import React, { useEffect, useState } from 'react';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import { useSettings } from '@/hooks/useSettings';
import { FEATURES } from '@/lib/entitlements';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
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
          <button onClick={() => s.setQuality('standard')} className={`rounded-full px-3 py-1 text-xs ${s.effQuality === 'standard' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}>Standard</button>
          <button onClick={() => s.setQuality('high')} className={`rounded-full px-3 py-1 text-xs ${s.effQuality === 'high' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}>High</button>
        </div>
      </SettingRow>
      <SettingRow title="Input device" description="Microphone source (where the browser permits)">
        <Select value={s.inputDeviceId || 'default'} onValueChange={(v) => s.setInputDeviceId(v === 'default' ? '' : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Default" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            {devices.map((d) => <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</SelectItem>)}
          </SelectContent>
        </Select>
      </SettingRow>
      <SettingRow title="Input level meter" description="Live levels show on the recorder screen">
        <span className="text-xs text-muted-foreground">On Home</span>
      </SettingRow>
      <SettingRow title="Format" description="WAV (PCM 16-bit)">
        <span className="font-mono text-xs">{rate} Hz</span>
      </SettingRow>
    </SettingSection>
  );
}