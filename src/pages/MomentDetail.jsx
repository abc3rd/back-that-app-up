import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Loader2, Pause, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ScreenHeader from '@/components/btau/ScreenHeader';
import PlaybackSpeedControl from '@/components/btau/PlaybackSpeedControl';
import TagEditor from '@/components/btau/TagEditor';

export default function MomentDetail() {
  const { id } = useParams();
  const audioRef = useRef(null);
  const [moment, setMoment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState(null);
  const [signing, setSigning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [tags, setTags] = useState([]);
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await base44.entities.Moment.get(id);
        if (!alive) return;
        setMoment(m);
        setTags(Array.isArray(m?.tags) ? m.tags : []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const ensureSigned = async () => {
    if (signedUrl || signing || !moment?.audio_uri) return signedUrl;
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

  const saveTags = async (next) => {
    setTags(next);
    setSavingTags(true);
    try {
      await base44.entities.Moment.update(moment.id, { tags: next });
    } finally {
      setSavingTags(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!moment) {
    return (
      <div className="px-6 py-20 text-center text-sm text-muted-foreground">
        Moment not found.
      </div>
    );
  }

  const ts = moment.timestamp ? new Date(moment.timestamp) : new Date(moment.created_date);
  const status = moment.status || 'pending';
  const transcribing = status === 'pending' || status === 'transcribing';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader title="Moment" />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-6 pt-6 pb-[max(7rem,env(safe-area-inset-bottom))]">
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
            <p className="truncate text-base font-semibold">{moment.name || format(ts, 'MMM d · HH:mm:ss')}</p>
            <p className="mt-0.5 font-mono text-xs text-foreground/70">{format(ts, 'MMM d, yyyy · HH:mm:ss')}</p>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {moment.duration_ms ? `${(moment.duration_ms / 1000).toFixed(1)}s` : ''} · {moment.trigger_type || 'capture'}
              {moment.location_label ? ` · 📍 ${moment.location_label}` : ''}
            </p>
          </div>
        </div>

        <PlaybackSpeedControl audioRef={audioRef} />

        <div className="rounded-xl bg-secondary/50 p-4 text-sm leading-relaxed text-foreground/80">
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

        <div className="border-t pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</p>
            {savingTags && <span className="text-xs text-muted-foreground">saving…</span>}
          </div>
          <TagEditor tags={tags} onChange={saveTags} />
        </div>
      </main>
    </div>
  );
}