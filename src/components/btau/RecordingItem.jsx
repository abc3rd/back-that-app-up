import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Download, Pause, Pencil, Play, Shield, Trash2 } from 'lucide-react';
import PlaybackSpeedControl from '@/components/btau/PlaybackSpeedControl';

const TRIGGER_LABEL = { voice: 'voice', button: 'manual', spike: 'spike' };

export default function RecordingItem({ rec, fresh, highlight, onDelete, onRename, onProtect }) {
  const audioRef = useRef(null);
  const rootRef = useRef(null);
  const [url, setUrl] = useState();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const label = rec.label || format(rec.timestamp, 'MMM d · HH:mm:ss');
  const triggerLabel = TRIGGER_LABEL[rec.triggerType] || rec.reason || 'capture';
  const isTemporary = rec.temporary && !rec.protected;
  const hasMarker = rec.triggerOffsetMs && rec.durationMs;

  useEffect(() => {
    const u = URL.createObjectURL(rec.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [rec.blob]);

  useEffect(() => {
    if (highlight && rootRef.current) rootRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlight]);

  const toggle = () => (playing ? audioRef.current.pause() : audioRef.current.play());
  const startEdit = () => { setDraft(label); setEditing(true); };
  const commit = () => {
    const v = draft.trim();
    if (v && v !== label) onRename?.(rec.id, v);
    setEditing(false);
  };

  return (
    <div ref={rootRef} className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors duration-700 ${highlight ? 'border-accent glow-magenta' : fresh ? 'border-primary/60 bg-primary/10 glow-cyan' : 'bg-card'}`}>
      <div className="flex items-center gap-4">
        <audio
          ref={audioRef}
          src={url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => { const a = e.currentTarget; if (a.duration) setProgress(a.currentTime / a.duration); }}
        />
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
          <p className="mt-0.5 font-mono text-sm text-foreground/70">{format(rec.timestamp, 'MMM d, yyyy · HH:mm:ss')}</p>
          <p className="mt-0.5 truncate font-mono text-sm text-muted-foreground">
            {(rec.durationMs / 1000).toFixed(1)}s · {Math.round(rec.sizeBytes / 1024)} KB · {rec.peakDb.toFixed(0)} dB · {triggerLabel}{isTemporary ? ' · temporary' : ''}
          </p>
          {(rec.location?.locality || (rec.tags && rec.tags.length > 0)) && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {rec.location?.locality ? `📍 ${rec.location.locality}` : ''}
              {rec.tags && rec.tags.length > 0 ? ` · ${rec.tags.join(' · ')}` : ''}
            </p>
          )}
        </div>
        {isTemporary && (
          <button aria-label="Keep capture" title="Keep (protect)" onClick={() => onProtect?.(rec.id)} className="flex min-h-[44px] min-w-[44px] items-center justify-center select-none text-muted-foreground transition-colors hover:text-primary">
            <Shield className="h-4 w-4" />
          </button>
        )}
        <button aria-label="Rename clip" onClick={startEdit} className="flex min-h-[44px] min-w-[44px] items-center justify-center select-none text-muted-foreground transition-colors hover:text-foreground">
          <Pencil className="h-4 w-4" />
        </button>
        <a href={url} download={rec.name} aria-label={`Download ${rec.name}`} className="flex min-h-[44px] min-w-[44px] items-center justify-center select-none text-muted-foreground transition-colors hover:text-foreground">
          <Download className="h-4 w-4" />
        </a>
        <button aria-label="Delete recording" onClick={() => onDelete(rec.id)} className="flex min-h-[44px] min-w-[44px] items-center justify-center select-none text-muted-foreground transition-colors hover:text-primary">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <PlaybackSpeedControl audioRef={audioRef} />
        {hasMarker && (
          <div className="relative h-1.5 flex-1 ml-4 rounded-full bg-secondary">
            <div className="absolute h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
            <div
              className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-accent glow-magenta"
              style={{ left: `${(rec.triggerOffsetMs / rec.durationMs) * 100}%` }}
              title="Trigger"
            />
          </div>
        )}
      </div>
    </div>
  );
}