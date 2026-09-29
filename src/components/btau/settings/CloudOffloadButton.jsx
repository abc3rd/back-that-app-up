import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { getRecordingsStats } from '@/lib/preroll/storage';
import { offloadToCloud, resolveCloudTarget, CLOUD_LABELS } from '@/lib/preroll/cloud';

const fmt = (b) => {
  if (!b) return '0 KB';
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export default function CloudOffloadButton() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);

  const load = async () => {
    setStats(await getRecordingsStats());
    setTarget(await resolveCloudTarget());
  };
  useEffect(() => { load(); }, []);

  const label = CLOUD_LABELS[target] || 'cloud storage';
  const savedCount = stats?.savedCount || 0;

  const run = async () => {
    setBusy(true);
    setProgress({ done: 0, total: savedCount });
    try {
      const r = await offloadToCloud(setProgress);
      await load();
      const failedNote = r.failed ? ` · ${r.failed} could not be uploaded` : '';
      toast({
        description: r.uploaded
          ? `Moved ${r.uploaded} recording${r.uploaded === 1 ? '' : 's'} (${fmt(r.bytes)}) to ${CLOUD_LABELS[r.target] || label}${failedNote}`
          : 'Nothing was offloaded',
      });
    } catch {
      toast({ variant: 'destructive', description: 'Offload failed — check your cloud connection and try again' });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div>
      <p className="text-sm">Saved recordings on this device</p>
      <p className="mb-3 text-sm text-muted-foreground">
        {stats
          ? `${savedCount} saved capture${savedCount === 1 ? '' : 's'} · ${fmt(stats.savedBytes)} · backing up to ${label}`
          : 'Calculating…'}
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="secondary" className="w-full" disabled={busy || !savedCount}>
            {busy ? `Offloading ${progress?.done ?? 0}/${progress?.total ?? 0}…` : `Back up all saved recordings to ${label}`}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move {savedCount} recording{savedCount === 1 ? '' : 's'} to {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Each saved capture is uploaded to {label} under “Back That App Up”, then removed from this device to free up space.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={run}>Offload</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}