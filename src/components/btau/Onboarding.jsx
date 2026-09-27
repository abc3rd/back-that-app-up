import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Radio, ShieldCheck, Save, Search, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  {
    icon: Sparkles,
    title: 'Welcome to Back That App Up!',
    body: 'Ever missed a great moment because you hit record too late? This app is always listening — and saves the seconds just before something happens.',
  },
  {
    icon: Radio,
    title: 'Like a dashcam, but for sound',
    body: 'It keeps a short rolling buffer of recent audio in memory. When there is a loud sound, a voice command, or you tap save, it keeps the last few seconds — automatically.',
  },
  {
    icon: ShieldCheck,
    title: 'Allow microphone & alerts',
    body: 'To listen, the app needs microphone access. A small notification shows it is running. You will be asked for these the first time you arm it.',
  },
  {
    icon: Mic,
    title: 'Tap the mic to start listening',
    body: 'Tap the big circular button. The sound meter lights up while it listens. Leave it running while you work, talk, or play — nothing is saved until a moment happens.',
  },
  {
    icon: Save,
    title: 'Save the moment three ways',
    body: '• Tap “Back That App Up” to save the last few seconds right now.\n• It can auto-save on loud sounds (turn it on in Settings).\n• Say your phrase to save hands-free.',
  },
  {
    icon: Search,
    title: 'Ask for any moment later',
    body: 'Search in plain words: “Tuesday morning”, “the meeting downtown”, or “when they said budget”. It matches dates, locations, days of the week, and spoken words.',
  },
  {
    icon: ShieldCheck,
    title: 'It stays on your device',
    body: 'Audio lives in memory only until you save. Saved clips stay on your phone. Turn on transcription in Settings if you want spoken-word search.',
  },
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const total = STEPS.length;
  const isLast = step === total - 1;
  const S = STEPS[step];
  const Icon = S.icon;

  const go = (next) => {
    if (next === step) return;
    setDir(next > step ? 1 : -1);
    setStep(Math.max(0, Math.min(total - 1, next)));
  };

  const finish = () => {
    localStorage.setItem('btau.onboarded', '1');
    onDone?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to step ${i + 1}`}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-primary' : i < step ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-border'}`}
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) go(step + 1);
                else if (info.offset.x > 50) go(step - 1);
              }}
              initial={(d) => ({ opacity: 0, x: d > 0 ? 60 : -60 })}
              animate={{ opacity: 1, x: 0 }}
              exit={(d) => ({ opacity: 0, x: d > 0 ? -60 : 60 })}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex w-full min-h-[18rem] cursor-grab flex-col items-center justify-center gap-6 rounded-3xl border border-primary/30 bg-card p-8 text-center shadow-sm active:cursor-grabbing"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/30 bg-primary/10 glow-neon-soft">
                <Icon className="h-9 w-9 text-primary" strokeWidth={1.75} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{S.title}</h2>
              <p className="max-w-xs whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{S.body}</p>
            </motion.div>
          </AnimatePresence>
          <p className="mt-4 text-xs text-muted-foreground/70">Swipe or use the arrows</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="flex min-h-[44px] items-center gap-1 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-sm font-mono text-muted-foreground">{step + 1} / {total}</span>
          {isLast ? (
            <button
              onClick={finish}
              className="flex min-h-[44px] items-center gap-1 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground glow-cyan transition-colors hover:bg-primary/90"
            >
              Start listening <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => go(step + 1)}
              className="flex min-h-[44px] items-center gap-1 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground glow-cyan transition-colors hover:bg-primary/90"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
        <button onClick={finish} className="mx-auto mt-3 text-sm text-muted-foreground underline-offset-4 hover:underline">
          Skip for now
        </button>
      </div>
    </div>
  );
}