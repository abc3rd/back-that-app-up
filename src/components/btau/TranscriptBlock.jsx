import React from 'react';
import { Loader2 } from 'lucide-react';

// Visual-voicemail style transcript, always shown under a capture.
export default function TranscriptBlock({ transcript, status, enabled = true }) {
  if (status === 'transcribing' || status === 'pending') {
    return (
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing…
      </span>
    );
  }
  if (transcript) return <p>{transcript}</p>;
  if (status === 'failed') return <p className="text-muted-foreground">Transcription failed — the audio is saved.</p>;
  if (!enabled) return <p className="text-muted-foreground">Turn on Transcription in Settings to read your captures.</p>;
  return <p className="text-muted-foreground">No speech detected.</p>;
}