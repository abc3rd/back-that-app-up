import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import { useSettings } from '@/hooks/useSettings';
import { FEATURES } from '@/lib/entitlements';
import { deleteAllTemporary, deleteAllRecordings, getStorageEstimate } from '@/lib/preroll/storage';

const fmt = (b) => (b ? `${(b / 1024 / 1024).toFixed(1)} MB` : '—');

export default function StorageSection() {
  const s = useSettings();
  const { toast } = useToast();
  const [est, setEst] = useState(null);
  const canRet = s.can(FEATURES.TEMP_RETENTION_DURATION);

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

  return (
    <SettingSection title="Storage" description="Local retention of captures">
      <SettingRow title="Temporary capture limit" description="Max unprotected spike captures kept">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => s.setMaxAuto(Math.max(1, s.maxAuto - 1))}>−</Button>
          <span className="w-8 text-center font-mono text-sm">{s.maxAuto}</span>
          <Button size="sm" variant="secondary" onClick={() => s.setMaxAuto(Math.min(50, s.maxAuto + 1))}>+</Button>
        </div>
      </SettingRow>
      <SettingRow title="Temporary retention" description="Auto-delete temp captures older than this" pro locked={!canRet}>
        <div className="flex items-center gap-2">
          <Slider value={[s.effTempRetentionMinutes]} min={0} max={120} step={5} onValueChange={(a) => s.setTempRetentionMinutes(a[0])} className="w-28" disabled={!canRet} />
          <span className="w-16 text-right font-mono text-sm">{s.effTempRetentionMinutes === 0 ? 'off' : `${s.effTempRetentionMinutes}m`}</span>
        </div>
      </SettingRow>
      <SettingRow title="Auto-delete oldest temporary" description="Beyond the limit, the oldest unprotected capture is removed">
        <span className="text-sm text-primary">On</span>
      </SettingRow>
      <SettingRow title="Protected captures" description="Manual & voice captures are never auto-deleted">
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