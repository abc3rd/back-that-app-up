import React, { useState } from 'react';

const SPEEDS = [1, 1.5, 2];

export default function PlaybackSpeedControl({ audioRef }) {
  const [rate, setRate] = useState(1);

  const apply = (r) => {
    setRate(r);
    if (audioRef?.current) audioRef.current.playbackRate = r;
  };

  return (
    <div className="flex items-center gap-1">
      {SPEEDS.map((s) => (
        <button
          key={s}
          onClick={() => apply(s)}
          aria-pressed={rate === s}
          className={`min-h-[28px] rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
            rate === s
              ? 'bg-gradient-to-r from-[#00F2FF] to-[#FF00FF] text-[#050508]'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          {s}×
        </button>
      ))}
    </div>
  );
}