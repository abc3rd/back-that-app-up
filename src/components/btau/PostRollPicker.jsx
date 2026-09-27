import React from 'react';

export const POST_ROLL_OPTIONS = [
  { value: 5, label: '5 s' },
  { value: 10, label: '10 s' },
  { value: 15, label: '15 s' },
  { value: 30, label: '30 s' },
  { value: 60, label: '60 s' },
];

export default function PostRollPicker({ value, onChange }) {
  return (
    <div>
      <p className="text-sm">Post-roll</p>
      <p className="mb-4 text-sm text-muted-foreground">Audio kept after a trigger</p>
      <div className="grid grid-cols-5 gap-1 rounded-full bg-secondary p-1">
        {POST_ROLL_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`min-h-[44px] rounded-full py-3 text-sm transition-all duration-300 ${value === o.value ? 'bg-gradient-to-r from-[#00F2FF] to-[#FF00FF] text-[#050508] glow-neon-soft' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}