import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import RecordingItem from './RecordingItem';

function Group({ title, items, lastSavedId, onDelete, onRename, onProtect, action }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-display text-lg">{title}</h3>
        <div className="flex items-center gap-3">
          {action}
          <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((rec) => (
            <motion.div key={rec.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.35 }}>
              <RecordingItem rec={rec} fresh={rec.id === lastSavedId} onDelete={onDelete} onRename={onRename} onProtect={onProtect} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function RecordingsList({ recordings, lastSavedId, onDelete, onRename, onProtect, onDeleteAllTemporary }) {
  const saved = recordings.filter((r) => r.protected || !r.temporary);
  const temp = recordings.filter((r) => r.temporary && !r.protected);
  const tempAction = temp.length > 0 ? (
    <button onClick={onDeleteAllTemporary} className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-primary">
      <Trash2 className="h-3 w-3" /> Clear
    </button>
  ) : null;

  if (recordings.length === 0) {
    return (
      <section>
        <h2 className="mb-4 font-display text-2xl">Library</h2>
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nothing saved yet. Triggers and manual saves will appear here.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 font-display text-2xl">Library</h2>
      <div className="flex flex-col gap-8">
        <Group title="Saved Moments" items={saved} lastSavedId={lastSavedId} onDelete={onDelete} onRename={onRename} onProtect={onProtect} />
        <Group title="Temporary Captures" items={temp} lastSavedId={lastSavedId} onDelete={onDelete} onRename={onRename} onProtect={onProtect} action={tempAction} />
      </div>
    </section>
  );
}