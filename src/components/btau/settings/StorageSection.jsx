import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import ProTag from './ProTag';
import { useSettings } from '@/hooks/useSettings';
import { FEATURES } from '@/lib/entitlements';
import { deleteAllTemporary, deleteAllRecordings, getStorageEstimate } from '@/lib/preroll/storage';
import StorageDashboard from '@/components/btau/StorageDashboard';

const fmt = (b) => (b ? `${(b / 1024 / 1024).toFixed(1)} MB` : '—');

const RETENTION = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 },
];
const LIMITS = [
  { label: 'Off', value: 0 },
  { label: '100 MB', value: 100 },
  { label: '250 MB', value: 250 },
  { label: '500 MB', value: 500 },
  { label: '1 GB', value: 1024 },
];

const pill = (active) => `rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`;

export default function StorageSection() {
  const s = useSettings();
  const { toast } = useToast();
  const [est, setEst] = useState(null);
  const [customHours, setCustomHours] = useState('');
  const canLong = s.can(FEATURES.TEMP_RETENTION_DURATION);

  const loadEst = async () => setEst(await getStorageEstimate());
  useEffect(() => { loadEst(); }, []);

  const clearTemp = async () => {
    const n = await deleteAllTemporary();
    toast({ description: n ? `Deleted ${n} temporary capture${n === 1 ? '' : 's'}` : 'No temporary captures' });
    loadEst();
  };
  const wipeAll = async () => {
    const n = await deleteAllRecordings();
    toast({ description: `Deleted all ${n} recording${n === 1 ? '' : 's'}` });
    loadEst();
  };

  const isPreset = RETENTION.some((o) => o.value === s.tempRetentionHours);
  const applyCustom = () => {
    const v = Math.max(1, Math.round(Number(customHours) || s.effTempRetentionHours || 1));
    s.setTempRetentionHours(v);
  };

  return (
    <SettingSection title="Storage & retention" description="Rolling buffer limits and cleanup">
      <StorageDashboard />

      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm">Temporary retention</p>
          {!canLong && <ProTag locked />}
        </div>
        <p className="mb-3 text-sm text-muted-foreground">Temporary audio is deleted once it is older than this. Saved captures are never removed automatically.</p>
        <div className="flex flex-wrap gap-2">
          {RETENTION.map((o) => (
            <button key={o.value} onClick={() => s.setTempRetentionHours(o.value)} className={pill(s.effTempRetentionHours === o.value)}>
              {o.label}
            </button>
          ))}
          <button onClick={applyCustom} className={pill(!isPreset)}>Custom</button>
        </div>
        {!isPreset && (
          <div className="mt-3 flex items-center gap-2">
            <Input value={customHours} onChange={(e) => setCustomHours(e.target.value)} inputMode="numeric" placeholder={String(s.effTempRetentionHours)} className="w-24" />
            <span className="text-sm text-muted-foreground">hours ({s.effTempRetentionHours}h active)</span>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm">Maximum storage</p>
          {s.effMaxStorageBytes > 250 * 1024 * 1024 && <ProTag locked={!canLong} />}
        </div>
        <p className="mb-3 text-sm text-muted-foreground">The oldest temporary audio is removed when this limit is reached. Saved captures are kept.</p>
        <div className="flex flex-wrap gap-2">
          {LIMITS.map((o) => (
            <button key={o.value} onClick={() => s.setMaxStorageMB(o.value)} className={pill(s.maxStorageMB === o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <SettingRow title="Location tagging" description="Tag captures with GPS location for AI moment search">
        <Switch checked={s.locationTagging} onCheckedChange={s.setLocationTagging} />
      </SettingRow>
      <SettingRow title="Temporary capture limit" description="Max unprotected spike captures kept">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => s.setMaxAuto(Math.max(1, s.maxAuto - 1))}>−</Button>
          <span className="w-8 text-center font-mono text-sm">{s.maxAuto}</span>
          <Button size="sm" variant="secondary" onClick={() => s.setMaxAuto(Math.min(50, s.maxAuto + 1))}>+</Button>
        </div>
      </SettingRow>
      <SettingRow title="Saved captures" description="Manual & voice captures are never removed by automatic cleanup">
        <span className="text-sm text-primary">Guaranteed</span>
      </SettingRow>
      <SettingRow title="Storage used" description={est ? `${fmt(est.usage)} of ${fmt(est.quota)}` : 'Calculating…'}>
        <span className="font-mono text-sm">{est ? fmt(est.usage) : '—'}</span>
      </SettingRow>
      <div className="flex flex-col gap-2 pt-2">
        <Button variant="secondary" onClick={clearTemp}>Delete temporary captures</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete all recordings</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all recordings?</AlertDialogTitle>
              <AlertDialogDescription>This permanently removes every saved moment and temporary capture on this device. This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={wipeAll}>Delete all</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SettingSection>
  );
}