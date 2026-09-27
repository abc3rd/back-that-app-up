import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MomentItem from '@/components/btau/MomentItem';
import PullToRefresh from '@/components/PullToRefresh';
import { useTabScroll } from '@/hooks/useTabScroll';

export default function Moments() {
  const scrollRef = useRef(null);
  useTabScroll('/moments', scrollRef);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await base44.entities.Moment.filter({}, { sort: '-created_date', limit: 50 });
      setMoments(res.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Moment.subscribe((event) => {
      const rec = event?.data;
      if (!rec?.id) return;
      setMoments((prev) => {
        if (event.type === 'delete') return prev.filter((m) => m.id !== rec.id);
        const exists = prev.some((m) => m.id === rec.id);
        return exists ? prev.map((m) => (m.id === rec.id ? rec : m)) : [rec, ...prev];
      });
    });
    return () => unsubscribe();
  }, [load]);

  return (
    <PullToRefresh containerRef={scrollRef} onRefresh={load}>
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex max-w-md flex-col gap-6 px-6 pb-[max(7rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
          <h1 className="text-2xl font-bold uppercase italic tracking-tight text-gradient-neon">Moments</h1>
          <p className="text-sm text-muted-foreground">
            Every saved back-up, paired with its transcript. Tap play to listen and read along — the text appears here the moment transcription finishes.
          </p>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : moments.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No moments yet. Save a back-up on the Home screen and it will appear here with its transcript.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {moments.map((m) => (
                <MomentItem key={m.id} moment={m} />
              ))}
            </div>
          )}
        </main>
      </div>
    </PullToRefresh>
  );
}