import React, { useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';

// Keyword search across moment transcripts. The actual server query lives in
// the parent (Moments page) so results stay in sync with the live list; this
// component only captures the query and reports it upward.
export default function TranscriptSearchBar({ onSearch, busy }) {
  const [query, setQuery] = useState('');

  const submit = () => {
    const q = query.trim();
    if (q) onSearch(q);
  };

  const clear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="Search transcripts…"
          className="h-12 w-full rounded-full border border-input bg-secondary pl-9 pr-9 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        {query && (
          <button
            aria-label="Clear search"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        aria-label="Search transcripts"
        onClick={submit}
        disabled={busy || !query.trim()}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#00F2FF] to-[#FF00FF] text-[#050508] disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      </button>
    </div>
  );
}