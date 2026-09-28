import React from 'react';

export const POST_ROLL_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 15, label: '15 s' },
  { value: 30, label: '30 s' },
  { value: 60, label: '1 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
];

export default function PostRollPicker({ value, onChange }) {
  return (
    <div>
      <p className="text-sm">Post-capture</p>
      <p className="mb-4 text-sm text-muted-foreground">Audio kept after you tap capture (Off stops immediately)</p>
      <div className="flex flex-wrap gap-1 rounded-2xl bg-secondary p-1">
        {POST_ROLL_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`min-h-[44px] flex-1 basis-[30%] rounded-full px-2 py-3 text-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${value === o.value ? 'bg-gradient-to-r from-[#00F2FF] to-[#FF00FF] text-[#050508] glow-neon-soft' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}