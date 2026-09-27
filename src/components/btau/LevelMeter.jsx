import React from 'react';
import { motion } from 'framer-motion';

export default function LevelMeter({ db, threshold, active }) {
  const pct = active ? Math.min(100, Math.max(0, db)) : 0;
  const over = active && db >= threshold;
  return (
    <div className="w-full">
      <div className="mb-3 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Ambient level</span>
          {active && (
            <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              LIVE
            </span>
          )}
        </div>
        <span className={`font-mono text-5xl leading-none tabular-nums transition-colors ${over ? 'text-primary' : ''}`}>
          {active ? db.toFixed(1) : '—'}
          <span className="ml-1 text-base text-muted-foreground">dB</span>
        </span>
      </div>
      <div className="relative">
        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r from-[#00F2FF] to-[#FF00FF] ${over ? 'glow-magenta' : ''}`}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.08, ease: 'linear' }}
          />
        </div>
        <div className="absolute -top-1.5 flex -translate-x-1/2 flex-col items-center" style={{ left: `${threshold}%` }}>
          <div className="h-5 w-0.5 bg-primary" />
          <span className="mt-1 font-mono text-xs text-primary">{threshold}</span>
        </div>
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
        <span>0</span>
        <span>50</span>
        <span>100 dB</span>
      </div>
    </div>
  );
}