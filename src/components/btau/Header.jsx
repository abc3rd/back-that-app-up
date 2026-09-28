import React from 'react';

const TONE = {
  active: 'bg-primary',
  error: 'bg-destructive',
  idle: 'bg-muted-foreground/50',
};

export default function Header({ status = 'Paused', tone = 'idle', micActive = false }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-gradient-neon">Back That App Up!</p>
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Ambient pre-roll</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold uppercase italic leading-none tracking-tight">
          <span className="text-foreground">Back That</span>{' '}<span className="text-gradient-neon">App Up!</span>
        </h1>
      </div>
      <div className="mt-1 flex flex-col items-end gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${TONE[tone] || TONE.idle} ${tone === 'active' ? 'animate-pulse' : ''}`} />
          {status}
        </span>
        {micActive && (
          <span className="inline-flex items-center gap-1.5 text-xs text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Mic active
          </span>
        )}
      </div>
    </header>
  );
}