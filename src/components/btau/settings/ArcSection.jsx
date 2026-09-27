import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import { useSettings } from '@/hooks/useSettings';
import { FEATURES } from '@/lib/entitlements';
import { arc } from '@/lib/arc';
import { useToast } from '@/components/ui/use-toast';

export default function ArcSection() {
  const s = useSettings();
  const { toast } = useToast();
  const account = arc.accountStatus();
  const device = arc.thisDevice();
  const authorized = arc.authorizedDevices();
  const canArc = s.can(FEATURES.ARC_SYNC);
  const [pairCode, setPairCode] = useState('');

  const pair = async () => {
    try { await arc.pairDevice(pairCode); } catch (e) { toast({ variant: 'destructive', description: e.message }); }
  };
  const transfer = async () => {
    try { await arc.transferTo(); } catch (e) { toast({ variant: 'destructive', description: e.message }); }
  };

  return (
    <SettingSection title="ARC & Devices" description="Local-first storage with optional multi-device sync">
      <SettingRow title="ARC account" description={account.connected ? account.email : 'Not connected'}>
        <span className="text-xs text-muted-foreground">{account.connected ? 'Linked' : 'Local-only'}</span>
      </SettingRow>
      <SettingRow title="This device" description={device.id}>
        <span className="text-xs text-muted-foreground">{device.name}</span>
      </SettingRow>
      <div>
        <p className="text-sm">Authorized devices</p>
        {authorized.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">No other devices linked.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-xs">{authorized.map((d) => <li key={d.id}>{d.name}</li>)}</ul>
        )}
      </div>
      <SettingRow title="Device pairing" description="Pair a new device (requires ARC)">
        <div className="flex gap-1">
          <Input value={pairCode} onChange={(e) => setPairCode(e.target.value)} placeholder="Pair code" className="w-28" />
          <Button size="sm" variant="secondary" onClick={pair}>Pair</Button>
        </div>
      </SettingRow>
      <SettingRow title="Local-only mode" description="Keep all data on this device">
        <Switch checked={s.localOnly} onCheckedChange={s.setLocalOnly} />
      </SettingRow>
      <SettingRow title="ARC synchronization" description="Sync captures across devices" pro locked={!canArc}>
        <Switch checked={s.arcEnabled && canArc} onCheckedChange={s.setArcEnabled} disabled={!canArc} />
      </SettingRow>
      <SettingRow title="Device-to-device transfer" description="Send a capture to another device">
        <Button size="sm" variant="secondary" onClick={transfer}>Transfer</Button>
      </SettingRow>
      <p className="text-xs text-muted-foreground">ARC backend is not yet connected. All data stays local.</p>
    </SettingSection>
  );
}