import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Download, Pause, Pencil, Play, Trash2 } from 'lucide-react';

export default function RecordingItem({ rec, fresh, onDelete, onRename }) {
  const audioRef = useRef(null);
  const [url, setUrl] = useState();
  const [playing, setPlaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const label = rec.label || format(rec.timestamp, 'MMM d · HH:mm:ss');

  useEffect(() => {
    const u = URL.createObjectURL(rec.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [rec.blob]);

  const toggle = () => (playing ? audioRef.current.pause() : audioRef.current.play());
  const startEdit = () => { setDraft(label); setEditing(true); };
  const commit = () => {
    const v = draft.trim();
    if (v && v !== label) onRename?.(rec.id, v);
    setEditing(false);
  };

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors duration-700 ${fresh ? 'border-primary/60 bg-primary/10 glow-cyan' : 'bg-card'}`}>
      <audio ref={audioRef} src={url} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      <button aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} className="flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full bg-foreground text-background">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            className="w-full rounded bg-secondary px-2 py-1 text-sm font-medium outline-none ring-1 ring-ring"
          />
        ) : (
          <p className="truncate text-sm font-medium">{label}</p>
        )}
        <p className="mt-0.5 font-mono text-xs text-foreground/70">{format(rec.timestamp, 'MMM d, yyyy · HH:mm:ss')}</p>
        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
          {(rec.durationMs / 1000).toFixed(1)}s · {Math.round(rec.sizeBytes / 1024)} KB · {rec.peakDb.toFixed(0)} dB · {rec.reason === 'button' ? 'manual' : 'spike'}
        </p>
      </div>
      <button aria-label="Rename clip" onClick={startEdit} className="select-none p-2 text-muted-foreground transition-colors hover:text-foreground">
        <Pencil className="h-4 w-4" />
      </button>
      <a href={url} download={rec.name} aria-label={`Download ${rec.name}`} className="select-none p-2 text-muted-foreground transition-colors hover:text-foreground">
        <Download className="h-4 w-4" />
      </a>
      <button aria-label="Delete recording" onClick={() => onDelete(rec.id)} className="select-none p-2 text-muted-foreground transition-colors hover:text-primary">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}