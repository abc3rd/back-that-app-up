import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Header({ listening, capturing }) {
  const navigate = useNavigate();
  const label = capturing ? 'Capturing' : listening ? 'Listening' : 'Idle';
  const dot = capturing ? 'bg-primary animate-pulse' : listening ? 'bg-primary' : 'bg-muted-foreground/50';
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-gradient-neon">Back That App Up!</p>
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Ambient pre-roll</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold uppercase italic leading-none tracking-tight">
          <span className="text-foreground">Back That</span>{' '}<span className="text-gradient-neon">App Up!</span>
        </h1>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button
          aria-label="Settings"
          onClick={() => navigate('/settings')}
          className="flex h-11 w-11 select-none items-center justify-center rounded-full border text-muted-foreground transition-colors hover:text-foreground"
        >
          <SettingsIcon className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {label}
        </span>
      </div>
    </header>
  );
}