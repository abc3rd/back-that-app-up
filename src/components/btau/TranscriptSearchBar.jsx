import React, { useEffect, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';

// Keyword filter across moment transcripts. Typing filters as you go (debounced);
// the actual server query lives in the parent (Moments page) so results stay in
// sync with the live list — this component only captures the query and reports it up.
export default function TranscriptSearchBar({ onSearch, busy }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(() => onSearch(q), 300);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  return (
    <div className="relative">
      {busy ? (
        <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
      ) : (
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search transcripts…"
        aria-label="Search transcripts"
        className="h-12 w-full rounded-full border border-input bg-secondary pl-9 pr-10 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}