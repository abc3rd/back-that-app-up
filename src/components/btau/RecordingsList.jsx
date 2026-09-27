import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import RecordingItem from './RecordingItem';

export default function RecordingsList({ recordings, lastSavedId, onDelete, onRename, onProtect, onDeleteAllTemporary }) {
  const tempCount = recordings.filter((r) => r.temporary && !r.protected).length;
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">Captures</h2>
        <div className="flex items-center gap-3">
          {tempCount > 0 && (
            <button onClick={onDeleteAllTemporary} className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-primary">
              <Trash2 className="h-3 w-3" /> Clear {tempCount} temp
            </button>
          )}
          <span className="font-mono text-xs text-muted-foreground">{recordings.length}</span>
        </div>
      </div>
      {recordings.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nothing saved yet. Triggers and manual saves will appear here.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {recordings.map((rec) => (
              <motion.div key={rec.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.35 }}>
                <RecordingItem rec={rec} fresh={rec.id === lastSavedId} onDelete={onDelete} onRename={onRename} onProtect={onProtect} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}