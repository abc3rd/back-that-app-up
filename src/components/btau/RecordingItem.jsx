import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Download, Pause, Play, Trash2 } from 'lucide-react';

export default function RecordingItem({ rec, fresh, onDelete }) {
  const audioRef = useRef(null);
  const [url, setUrl] = useState();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const u = URL.createObjectURL(rec.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [rec.blob]);

  const toggle = () => (playing ? audioRef.current.pause() : audioRef.current.play());

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors duration-700 ${fresh ? 'border-primary/50 bg-primary/5' : 'bg-card'}`}>
      <audio ref={audioRef} src={url} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      <button onClick={toggle} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{format(rec.timestamp, 'MMM d · HH:mm:ss')}</p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
          {(rec.durationMs / 1000).toFixed(1)}s · {Math.round(rec.sizeBytes / 1024)} KB · {rec.peakDb.toFixed(0)} dB · {rec.reason === 'button' ? 'manual' : 'spike'}
        </p>
      </div>
      <a href={url} download={rec.name} className="p-2 text-muted-foreground transition-colors hover:text-foreground">
        <Download className="h-4 w-4" />
      </a>
      <button onClick={() => onDelete(rec.id)} className="p-2 text-muted-foreground transition-colors hover:text-primary">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}