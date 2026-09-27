import React from 'react';
import { Slider } from '@/components/ui/slider';

const hint = (t) => (t <= 55 ? 'More sensitive' : t >= 90 ? 'Less sensitive' : 'Balanced');

export default function ThresholdControl({ value, onChange }) {
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-sm">Trigger threshold</p>
          <p className="text-xs text-muted-foreground">{hint(value)}</p>
        </div>
        <span className="font-mono text-lg tabular-nums">{value} dB</span>
      </div>
      <Slider min={40} max={100} step={1} value={[value]} onValueChange={([v]) => onChange(v)} />
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>40</span>
        <span>100</span>
      </div>
    </div>
  );
}