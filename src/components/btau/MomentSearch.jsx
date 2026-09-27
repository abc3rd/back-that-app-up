import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Mic, Search, Sparkles } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { FEATURES } from '@/lib/entitlements';

// Natural-language / voice moment retrieval. Sends lightweight capture metadata
// (no audio) to the searchMoments backend function, which runs InvokeLLM and
// returns ranked matches. Selecting a match highlights it in the library.
export default function MomentSearch({ recordings, onHighlight }) {
  const s = useSettings();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const supported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const runSearch = async (q) => {
    if (!q.trim()) return;
    if (!s.can(FEATURES.AI_SEARCH)) { s.openPaywall(FEATURES.AI_SEARCH); return; }
    setBusy(true);
    setResult(null);
    try {
      const corpus = recordings.map((r) => ({
        id: r.id,
        label: r.label,
        iso: new Date(r.timestamp).toISOString(),
        trigger: r.triggerType,
        durationSec: +(r.durationMs / 1000).toFixed(1),
        peakDb: r.peakDb,
        location: r.location?.locality || r.location?.place || null,
        tags: r.tags || [],
        transcript: r.transcript || null,
      }));
      const res = await base44.functions.invoke('searchMoments', { query: q, recordings: corpus });
      const data = res.data.result || { summary: 'No response.', matches: [] };
      const valid = (data.matches || [])
        .filter((m) => recordings.some((x) => x.id === m.id))
        .map((m) => {
          const r = recordings.find((x) => x.id === m.id);
          return { ...m, label: r?.label, timestamp: r?.timestamp, location: r?.location?.locality };
        });
      setResult({ summary: data.summary, matches: valid });
      if (valid[0]) onHighlight?.(valid[0].id);
    } catch (e) {
      setResult({ summary: 'Moment search failed. Try again.', matches: [] });
    } finally {
      setBusy(false);
    }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e) => {
      const text = Array.from(e.results).map((x) => x[0].transcript).join(' ').trim();
      if (text) { setQuery(text); runSearch(text); }
    };
    try { r.start(); recRef.current = r; } catch {}
  };
  const stopVoice = () => { try { recRef.current?.stop(); } catch {} setListening(false); };

  return (
    <section className="flex flex-col gap-3 rounded-3xl border-gradient-neon p-6 glow-neon-soft">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg">Ask for a moment</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Say or type what you remember — “the loud spike at the park yesterday”, “voice capture from this morning” — and the AI finds it in your library.
      </p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runSearch(query); }}
            placeholder="Describe the moment…"
            className="h-12 w-full rounded-full border border-input bg-secondary pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        {supported && (
          <button
            aria-label={listening ? 'Stop voice search' : 'Search by voice'}
            onClick={listening ? stopVoice : startVoice}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${listening ? 'border-primary text-primary glow-cyan' : 'border-border text-muted-foreground'}`}
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
        <button
          aria-label="Search moments"
          onClick={() => runSearch(query)}
          disabled={busy || !query.trim()}
          className="flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#00F2FF] to-[#FF00FF] px-5 text-sm font-semibold text-[#050508] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Find
        </button>
      </div>
      {result && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{result.summary}</p>
          {result.matches.length > 0 && (
            <div className="flex flex-col gap-2">
              {result.matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onHighlight?.(m.id)}
                  className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/60"
                >
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className="text-sm text-muted-foreground">{m.reason}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}