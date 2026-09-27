import React, { useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const ref = useRef(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e) => {
    if (ref.current && ref.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    } else {
      pulling.current = false;
    }
  };

  const onTouchMove = (e) => {
    if (!pulling.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, 80));
  };

  const onTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull > 50) {
      setRefreshing(true);
      setPull(40);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const showIndicator = pull > 10 || refreshing;

  return (
    <div
      ref={ref}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="h-screen overflow-y-auto overscroll-none"
    >
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center pt-2"
        style={{ transform: `translateY(${pull}px)`, opacity: showIndicator ? 1 : 0, transition: pulling.current ? 'none' : 'opacity 0.2s ease' }}
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" style={{ transform: `rotate(${Math.min(pull * 2, 180)}deg)` }} />
        )}
      </div>
      <div style={{ transform: `translateY(${pull}px)`, transition: pulling.current ? 'none' : 'transform 0.2s ease' }}>
        {children}
      </div>
    </div>
  );
}