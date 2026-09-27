import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

export default function ArmControl({ listening, onArm, onDisarm }) {
  return (
    <div className="relative flex h-56 w-56 items-center justify-center">
      <AnimatePresence>
        {listening && [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-6 rounded-full border border-primary/60"
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1.35, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, delay: i, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={listening ? onDisarm : onArm}
        className={`relative flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full border transition-colors duration-500 ${listening ? 'border-primary/70 bg-primary/10 text-primary glow-cyan' : 'border-border bg-card text-foreground hover:border-foreground/30'}`}
      >
        {listening ? <Mic className="h-8 w-8" strokeWidth={1.5} /> : <MicOff className="h-8 w-8" strokeWidth={1.5} />}
        <span className="text-xs uppercase tracking-[0.24em]">{listening ? 'Tap to stop' : 'Arm'}</span>
      </motion.button>
    </div>
  );
}