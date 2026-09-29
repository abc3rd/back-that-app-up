import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { getRecordingsStats } from '@/lib/preroll/storage';
import { offloadToDropbox } from '@/lib/preroll/cloud';

const fmt = (b) => {
  if (!b) return '0 KB';
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export default function DropboxOffloadButton() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);

  const load = async () => setStats(await getRecordingsStats());
  useEffect(() => { load(); }, []);

  const savedCount = stats?.savedCount || 0;

  const run = async () => {
    setBusy(true);
    setProgress({ done: 0, total: savedCount });
    try {
      const r = await offloadToDropbox(setProgress);
      await load();
      const failedNote = r.failed ? ` · ${r.failed} could not be uploaded` : '';
      toast({
        description: r.uploaded
          ? `Moved ${r.uploaded} recording${r.uploaded === 1 ? '' : 's'} (${fmt(r.bytes)}) to Dropbox${failedNote}`
          : 'Nothing was offloaded',
      });
    } catch {
      toast({ variant: 'destructive', description: 'Offload failed — reconnect Dropbox and try again' });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div>
      <p className="text-sm">Saved recordings on this device</p>
      <p className="mb-3 text-sm text-muted-foreground">
        {stats ? `${savedCount} saved capture${savedCount === 1 ? '' : 's'} · ${fmt(stats.savedBytes)}` : 'Calculating…'}
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="secondary" className="w-full" disabled={busy || !savedCount}>
            {busy ? `Offloading ${progress?.done ?? 0}/${progress?.total ?? 0}…` : 'Offload saved recordings to Dropbox'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Offload {savedCount} recording{savedCount === 1 ? '' : 's'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Each saved capture is uploaded to your Dropbox under “Back That App Up”, then removed from this device to free up space.
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