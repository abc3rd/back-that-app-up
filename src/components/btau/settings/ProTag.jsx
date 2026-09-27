import React from 'react';
import { Lock } from 'lucide-react';

export default function ProTag({ locked }) {
  return (
    <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${locked ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent'}`}>
      {locked && <Lock className="h-2.5 w-2.5" />} Pro
    </span>
  );
}