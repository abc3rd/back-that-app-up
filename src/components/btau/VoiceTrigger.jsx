import React from 'react';
import { Switch } from '@/components/ui/switch';
import { MicVocal } from 'lucide-react';

export default function VoiceTrigger({ enabled, supported, heard, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <MicVocal className={`mt-0.5 h-5 w-5 ${heard ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.5} />
        <div>
          <p className="text-sm">Voice arm</p>
          <p className="text-xs text-muted-foreground">
            {supported ? <>Say “Back That App Up” to start hands-free</> : 'Not supported in this browser'}
          </p>
        </div>
      </div>
      <Switch checked={enabled && supported} disabled={!supported} onCheckedChange={onToggle} className={heard ? 'data-[state=checked]:bg-primary' : ''} />
    </div>
  );
}