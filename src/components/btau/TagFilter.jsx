import React from 'react';

export default function TagFilter({ tags = [], active, onSelect }) {
  const list = Array.isArray(tags) ? tags : [];
  if (list.length === 0) return null;

  const chip = (label, value, isActive) => (
    <button
      key={label}
      onClick={() => onSelect(value)}
      className={`min-h-[32px] rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
        isActive
          ? 'bg-gradient-to-r from-[#00F2FF] to-[#FF00FF] text-[#050508]'
          : 'bg-secondary text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {chip('All', null, active == null)}
      {list.map((t) => chip(`#${t}`, t, active === t))}
    </div>
  );
}