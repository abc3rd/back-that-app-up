import React from 'react';
import { motion } from 'framer-motion';

export default function LevelMeter({ db, threshold, active }) {
  const pct = active ? Math.min(100, Math.max(0, db)) : 0;
  const over = active && db >= threshold;
  return (
    <div className="w-full">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Ambient level</span>
        <span className={`font-mono text-3xl tabular-nums transition-colors ${over ? 'text-primary' : ''}`}>
          {active ? db.toFixed(1) : '—'}
          <span className="ml-1 text-sm text-muted-foreground">dB</span>
        </span>
      </div>
      <div className="relative">
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className={`h-full rounded-full ${over ? 'bg-primary' : 'bg-foreground/80'}`}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.12, ease: 'linear' }}
          />
        </div>
        <div className="absolute -top-1.5 flex -translate-x-1/2 flex-col items-center" style={{ left: `${threshold}%` }}>
          <div className="h-4 w-px bg-primary" />
          <span className="mt-1 font-mono text-[10px] text-primary">{threshold}</span>
        </div>
      </div>
    </div>
  );
}