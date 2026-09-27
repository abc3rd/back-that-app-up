import React from 'react';

export default function Header({ listening, capturing }) {
  const label = capturing ? 'Capturing' : listening ? 'Listening' : 'Idle';
  const dot = capturing ? 'bg-primary animate-pulse' : listening ? 'bg-emerald-400' : 'bg-muted-foreground/50';
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Ambient pre-roll</p>
        <h1 className="mt-2 font-display text-4xl leading-none tracking-tight">
          Back That <em className="text-primary">App</em> Up!
        </h1>
      </div>
      <span className="mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </span>
    </header>
  );
}