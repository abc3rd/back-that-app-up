import React, { useEffect, useState } from 'react';
import { HardDrive } from 'lucide-react';
import { getRecordingsStats, getStorageEstimate } from '@/lib/preroll/storage';

const fmt = (b) => {
  if (!b) return '0 KB';
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export default function StorageDashboard() {
  const [stats, setStats] = useState(null);
  const [quota, setQuota] = useState(null);

  const load = async () => {
    setStats(await getRecordingsStats());
    setQuota(await getStorageEstimate());
  };
  useEffect(() => { load(); }, []);

  const total = stats?.totalBytes || 0;
  const usage = quota?.usage || 0;
  const quotaBytes = quota?.quota || 0;
  const pct = quotaBytes ? Math.min(100, Math.round((usage / quotaBytes) * 100)) : 0;
  const savedPct = total ? Math.round((stats.savedBytes / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-primary" />
        <h4 className="font-display text-sm font-semibold uppercase tracking-wide">Device storage</h4>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-2xl text-gradient-neon">{fmt(total)}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {stats ? `${stats.count} recording${stats.count === 1 ? '' : 's'} on this device` : 'Calculating…'}
          </p>
        </div>
        {quotaBytes > 0 && (
          <div className="text-right">
            <p className="font-mono text-sm">{pct}% used</p>
            <p className="text-sm text-muted-foreground">{fmt(usage)} / {fmt(quotaBytes)}</p>
          </div>
        )}
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${savedPct}%` }} />
        <div className="relative -mt-2 h-2">
          <div className="h-full rounded-r-full bg-accent/60" style={{ width: `${100 - savedPct}%`, marginLeft: `${savedPct}%` }} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Saved {fmt(stats?.savedBytes || 0)}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent/60" /> Temp {fmt(stats?.tempBytes || 0)}</span>
      </div>
    </div>
  );
}