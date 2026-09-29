import React from 'react';
import { Activity, Mic, MousePointerClick } from 'lucide-react';
import { triggerTag } from '@/lib/preroll/triggers';

const TONE = {
  button: 'border-primary/50 bg-primary/10 text-primary',
  voice: 'border-accent/50 bg-accent/10 text-accent',
  spike: 'border-foreground/25 bg-foreground/5 text-foreground/80',
};

const ICON = { button: MousePointerClick, voice: Mic, spike: Activity };

// Shows at a glance which of the three capture paths produced a moment.
export default function TriggerBadge({ type, fallback }) {
  const Icon = ICON[type] || Activity;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${TONE[type] || TONE.spike}`}>
      <Icon className="h-3 w-3" />
      {triggerTag(type, fallback)}
    </span>
  );
}