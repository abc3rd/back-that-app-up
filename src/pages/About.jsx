import { Link } from 'react-router-dom';
import { Rewind, Mic, Shield, Cloud, Zap, Activity, Sparkles, Lock } from 'lucide-react';
import ScreenHeader from '@/components/btau/ScreenHeader';
import PublicFooter from '@/components/btau/PublicFooter';

const HOW = [
  { icon: Activity, title: 'Always listening', body: 'A rolling audio buffer stays in memory the moment you arm. Nothing is written to disk until you say so.' },
  { icon: Zap, title: 'Catch the moment', body: 'Tap save, speak a trigger word, or let a sound spike do it — the last few seconds are already captured.' },
  { icon: Sparkles, title: 'AI transcripts', body: 'Each saved moment is transcribed automatically so you can search and read along with playback.' },
  { icon: Cloud, title: 'Drive backup', body: 'Optional, automatic upload of your recordings and transcripts to your own Google Drive.' },
];

const FEATURES = [
  { icon: Lock, title: 'Privacy-first', body: 'Audio lives in memory only. Clips never leave your device unless you turn on backup.' },
  { icon: Mic, title: 'Voice arming', body: 'Hands-free arm and disarm with the Web Speech API.' },
  { icon: Rewind, title: 'Quick backup', body: 'A home-screen shortcut, a floating button, or the B key saves the moment instantly.' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader title="About" titleClassName="font-bold uppercase italic tracking-tight text-gradient-neon" />
      <main className="mx-auto flex max-w-md flex-col gap-10 px-6 pb-16 pt-6">
        <section className="flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gradient-neon">Back That App Up!</p>
          <h2 className="font-display text-3xl font-extrabold uppercase italic leading-tight tracking-tight">
            <span className="text-foreground">Back That</span> <span className="text-gradient-neon">App Up!</span>
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            An ambient, privacy-first audio capture tool that saves the moment <em>before</em> you hit record. Keep a rolling buffer on your device, catch the seconds that already happened, and let AI turn them into searchable text.
          </p>
        </section>

        <section className="rounded-3xl border-gradient-neon p-6 glow-neon-soft">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Mission</h3>
          <p className="text-sm leading-relaxed">
            The best moments are the ones you didn't plan for. Back That App Up keeps a quiet, always-on ear on your device so a spike, a word, or a tap is all it takes to rescue the last few seconds — without recording everything forever.
          </p>
        </section>

        <section className="flex flex-col gap-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">How it works</h3>
          {HOW.map((s, i) => (
            <div key={i} className="flex items-start gap-4">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">What makes it different</h3>
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-4">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <f.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-semibold">{f.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </div>
          ))}
        </section>

        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00F2FF] to-[#FF00FF] py-3 text-sm font-bold uppercase tracking-wider text-[#050508]"
        >
          <Rewind className="h-4 w-4" strokeWidth={2} /> Start listening
        </Link>

        <PublicFooter />
        <p className="text-center text-xs text-muted-foreground">v1.0</p>
      </main>
    </div>
  );
}