import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Header({ listening, capturing }) {
  const navigate = useNavigate();
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
      <div className="mt-1 flex items-center gap-2">
        <button
          aria-label="Settings"
          onClick={() => navigate('/settings')}
          className="flex h-9 w-9 select-none items-center justify-center rounded-full border text-muted-foreground transition-colors hover:text-foreground"
        >
          <SettingsIcon className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {label}
        </span>
      </div>
    </header>
  );
}