import React, { useEffect, useState } from 'react';
import { HardDrive } from 'lucide-react';
import SettingSection from './SettingSection';
import { getRecordingsStats, getStorageEstimate } from '@/lib/preroll/storage';

const fmt = (b) => {
  if (!b) return '0 KB';
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export default function SavedStorageSection() {
  const [stats, setStats] = useState(null);
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getRecordingsStats();
      const q = await getStorageEstimate();
      if (!alive) return;
      setStats(s);
      setQuota(q);
    })();
    return () => { alive = false; };
  }, []);

  const savedBytes = stats?.savedBytes || 0;
  const savedCount = stats?.savedCount || 0;
  const totalBytes = stats?.totalBytes || 0;
  const share = totalBytes ? Math.round((savedBytes / totalBytes) * 100) : 0;
  const avg = savedCount ? savedBytes / savedCount : 0;
  const devicePct = quota?.quota ? Math.min(100, Math.round((quota.usage / quota.quota) * 100)) : null;

  return (
    <SettingSection title="Saved recordings" description="How much space your kept captures take up on this device">
      <div className="rounded-2xl border border-border bg-secondary/40 p-4">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-semibold uppercase tracking-wide">Saved on device</span>
        </div>
        <p className="mt-2 font-mono text-3xl text-gradient-neon">{stats ? fmt(savedBytes) : '—'}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {stats
            ? savedCount
              ? `${savedCount} saved capture${savedCount === 1 ? '' : 's'}`
              : 'No saved captures yet'
            : 'Calculating…'}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary" style={{ width: `${share}%` }} />
          <div className="h-full bg-accent/60" style={{ width: `${100 - share}%` }} />
        </div>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Saved {fmt(savedBytes)}</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent/60" /> Temp {fmt(stats?.tempBytes || 0)}</span>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Average per saved capture</dt>
            <dd className="font-mono">{savedCount ? fmt(avg) : '—'}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Share of app storage</dt>
            <dd className="font-mono">{totalBytes ? `${share}%` : '—'}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Device storage used</dt>
            <dd className="font-mono">{devicePct === null ? '—' : `${devicePct}%`}</dd>
          </div>
        </dl>
      </div>

      <p className="text-sm text-muted-foreground">
        Saved captures are never removed by automatic cleanup. Delete them from the Recordings list when you no longer need them.
      </p>
    </SettingSection>
  );
}