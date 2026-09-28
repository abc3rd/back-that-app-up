import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckSquare, Download, Loader2, Square, Trash2, X } from 'lucide-react';
import RecordingItem from './RecordingItem';
import { buildZip, downloadBlob } from '@/lib/preroll/zip';
import { useToast } from '@/components/ui/use-toast';

function Group({ title, items, lastSavedId, highlightId, onDelete, onRename, onProtect, action, selectMode, selected, onToggleSelect }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-display text-lg">{title}</h3>
        <div className="flex items-center gap-3">
          {action}
          <span className="font-mono text-sm text-muted-foreground">{items.length}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((rec) => (
            <motion.div key={rec.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.35 }}>
              <RecordingItem rec={rec} fresh={rec.id === lastSavedId} highlight={rec.id === highlightId} onDelete={onDelete} onRename={onRename} onProtect={onProtect} selectMode={selectMode} selected={selected.has(rec.id)} onToggleSelect={onToggleSelect} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function RecordingsList({ recordings, lastSavedId, highlightId, onDelete, onRename, onProtect, onDeleteAllTemporary }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [zipping, setZipping] = useState(false);

  const q = filter.trim().toLowerCase();
  const matches = (r) => {
    if (!q) return true;
    const hay = [r.label, r.triggerType, r.location?.place, r.location?.locality, ...(r.tags || []), r.transcript, new Date(r.timestamp).toLocaleString()].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  };
  const saved = recordings.filter((r) => (r.protected || !r.temporary) && matches(r));
  const temp = recordings.filter((r) => r.temporary && !r.protected && matches(r));
  const tempAction = temp.length > 0 ? (
    <button onClick={onDeleteAllTemporary} className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-primary">
      <Trash2 className="h-3 w-3" /> Clear
    </button>
  ) : null;

  const toggleSelect = (id) => setSelected((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const selectAllVisible = () => setSelected(new Set([...saved, ...temp].map((r) => r.id)));
  const exitSelect = () => { setSelectMode(false); setSelected(new Set()); };

  const downloadZip = async () => {
    const recs = recordings.filter((r) => selected.has(r.id) && r.blob);
    if (!recs.length) { toast({ description: 'Select at least one recording' }); return; }
    setZipping(true);
    try {
      const files = recs.map((r) => ({ name: r.name || `${r.id}.wav`, data: r.blob }));
      const blob = await buildZip(files);
      downloadBlob(blob, `btau_moments_${Date.now()}.zip`);
      toast({ description: `Downloaded ${recs.length} recording${recs.length === 1 ? '' : 's'} as a zip` });
      exitSelect();
    } catch (e) {
      toast({ variant: 'destructive', description: 'Zip download failed' });
    } finally {
      setZipping(false);
    }
  };

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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">Library</h2>
        {selectMode ? (
          <div className="flex items-center gap-2">
            <button onClick={selectAllVisible} className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-primary">Select all</button>
            <button onClick={exitSelect} className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectMode(true)} className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-primary">
              <CheckSquare className="h-3 w-3" /> Select
            </button>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter moments"
                className="h-11 w-44 rounded-full border border-input bg-secondary pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </div>
      {selectMode && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button onClick={downloadZip} disabled={zipping} className="flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download ZIP
          </button>
        </div>
      )}
      <div className="flex flex-col gap-8">
        <Group title="Saved Moments" items={saved} lastSavedId={lastSavedId} highlightId={highlightId} onDelete={onDelete} onRename={onRename} onProtect={onProtect} selectMode={selectMode} selected={selected} onToggleSelect={toggleSelect} />
        <Group title="Temporary Captures" items={temp} lastSavedId={lastSavedId} highlightId={highlightId} onDelete={onDelete} onRename={onRename} onProtect={onProtect} action={tempAction} selectMode={selectMode} selected={selected} onToggleSelect={toggleSelect} />
      </div>
    </section>
  );
}