import React from 'react';
import { Minus, Plus } from 'lucide-react';

export default function MaxAutoControl({ value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm">Max auto captures</p>
        <p className="text-xs text-muted-foreground">Oldest unprotected spike capture is deleted beyond this</p>
      </div>
      <div className="flex items-center gap-2">
        <button aria-label="Decrease" onClick={() => onChange(Math.max(1, value - 1))} className="flex h-11 w-11 select-none items-center justify-center rounded-full bg-secondary text-foreground">
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-mono text-sm">{value}</span>
        <button aria-label="Increase" onClick={() => onChange(Math.min(50, value + 1))} className="flex h-11 w-11 select-none items-center justify-center rounded-full bg-secondary text-foreground">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}