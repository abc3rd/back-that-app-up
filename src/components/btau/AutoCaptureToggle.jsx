import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Zap } from 'lucide-react';

export default function AutoCaptureToggle({ enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <Zap className="mt-0.5 h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        <div>
          <p className="text-sm">Auto Capture on Sound</p>
          <p className="text-sm text-muted-foreground">When off, levels still show but spikes don't record. Default off.</p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}