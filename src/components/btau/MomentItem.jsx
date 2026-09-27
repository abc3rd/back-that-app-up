import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Pause, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MomentItem({ moment }) {
  const audioRef = useRef(null);
  const [signedUrl, setSignedUrl] = useState(null);
  const [signing, setSigning] = useState(false);
  const [playing, setPlaying] = useState(false);

  const ensureSigned = async () => {
    if (signedUrl || signing) return signedUrl;
    setSigning(true);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: moment.audio_uri });
      setSignedUrl(signed_url);
      return signed_url;
    } finally {
      setSigning(false);
    }
  };

  const toggle = async () => {
    if (playing) {
      audioRef.current?.pause();
      return;
    }
    const url = signedUrl || (await ensureSigned());
    if (!url || !audioRef.current) return;
    if (!audioRef.current.src) audioRef.current.src = url;
    audioRef.current.play().catch(() => {});
  };

  const ts = moment.timestamp ? new Date(moment.timestamp) : new Date(moment.created_date);
  const status = moment.status || 'pending';
  const transcribing = status === 'pending' || status === 'transcribing';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-4">
        <audio
          ref={audioRef}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        <button
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={toggle}
          className="flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full bg-foreground text-background"
        >
          {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{moment.name || format(ts, 'MMM d · HH:mm:ss')}</p>
          <p className="mt-0.5 font-mono text-sm text-foreground/70">{format(ts, 'MMM d, yyyy · HH:mm:ss')}</p>
          <p className="mt-0.5 truncate font-mono text-sm text-muted-foreground">
            {moment.duration_ms ? `${(moment.duration_ms / 1000).toFixed(1)}s` : ''} · {moment.trigger_type || 'capture'}
            {moment.location_label ? ` · 📍 ${moment.location_label}` : ''}
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-secondary/50 p-3 text-sm leading-relaxed text-foreground/80">
        {transcribing ? (
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing…
          </span>
        ) : moment.transcript ? (
          <p>{moment.transcript}</p>
        ) : status === 'failed' ? (
          <p className="text-destructive">Transcription failed</p>
        ) : (
          <p className="text-muted-foreground">No transcript yet.</p>
        )}
      </div>
    </div>
  );
}