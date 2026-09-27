import React from 'react';
import { Switch } from '@/components/ui/switch';
import { BellOff } from 'lucide-react';

export default function StealthToggle({ enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <BellOff className="mt-0.5 h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        <div>
          <p className="text-sm">Stealth mode</p>
          <p className="text-sm text-muted-foreground">Hide the running-status reminder notification</p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}