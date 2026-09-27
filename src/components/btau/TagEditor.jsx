import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function TagEditor({ tags = [], onChange }) {
  const [input, setInput] = useState('');
  const list = Array.isArray(tags) ? tags.filter(Boolean) : [];

  const add = () => {
    const v = input.trim().replace(/^#/, '');
    if (!v) { setInput(''); return; }
    if (list.some((t) => t.toLowerCase() === v.toLowerCase())) { setInput(''); return; }
    onChange([...list, v]);
    setInput('');
  };

  const remove = (t) => onChange(list.filter((x) => x !== t));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {list.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary"
        >
          #{t}
          <button
            aria-label={`Remove tag ${t}`}
            onClick={() => remove(t)}
            className="select-none transition-colors hover:text-primary/60"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <div className="inline-flex items-center gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Add tag"
          className="w-24 rounded-full bg-secondary px-2.5 py-1 text-xs outline-none ring-1 ring-ring placeholder:text-muted-foreground"
        />
        <button
          aria-label="Add tag"
          onClick={add}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}