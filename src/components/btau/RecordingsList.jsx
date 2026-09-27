import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import RecordingItem from './RecordingItem';

export default function RecordingsList({ recordings, lastSavedId, onDelete, onRename }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">Captures</h2>
        <span className="font-mono text-xs text-muted-foreground">{recordings.length}</span>
      </div>
      {recordings.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nothing saved yet. Spikes and manual saves will appear here.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {recordings.map((rec) => (
              <motion.div key={rec.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.35 }}>
                <RecordingItem rec={rec} fresh={rec.id === lastSavedId} onDelete={onDelete} onRename={onRename} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}