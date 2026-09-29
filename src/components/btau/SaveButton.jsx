import React from 'react';
import { motion } from 'framer-motion';
import { Rewind } from 'lucide-react';

const HINTS = {
  button: (rewindLabel, postRoll) => `Saving now — last ${rewindLabel}, then ${postRoll}s more`,
  voice: () => 'Voice command heard — saving the moment…',
  spike: () => 'Sound spike detected — saving the moment…',
};

export default function SaveButton({ listening, capturing, captureKind, rewindLabel, postRoll, onSave }) {
  const hint = capturing
    ? (HINTS[captureKind] || (() => 'Saving the moment…'))(rewindLabel, postRoll)
    : listening
      ? `Saves the last ${rewindLabel} and keeps listening`
      : 'Arm listening to enable';
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        whileTap={{ scale: 0.98 }}
        disabled={!listening}
        onClick={onSave}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#00F2FF] to-[#FF00FF] py-5 font-display text-2xl font-bold text-[#050508] shadow-[0_0_24px_rgba(0,242,255,0.4)] transition-opacity duration-300 disabled:opacity-25"
      >
        <Rewind className="h-5 w-5" strokeWidth={1.75} />
        Back That App Up!
      </motion.button>
      <p className="text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}