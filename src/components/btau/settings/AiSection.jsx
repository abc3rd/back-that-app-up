import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import { useSettings } from '@/hooks/useSettings';
import { FEATURES } from '@/lib/entitlements';

export default function AiSection() {
  const s = useSettings();
  const canTranscribe = s.can(FEATURES.AI_TRANSCRIPTION);
  const canSearch = s.can(FEATURES.AI_SEARCH);
  return (
    <SettingSection title="AI" description="Smart features for your captures">
      <SettingRow title="Transcription" description="Transcribe saved captures so you can search by spoken words" pro locked={!canTranscribe}>
        <Switch checked={s.effAiTranscription} onCheckedChange={s.setAiTranscription} disabled={!canTranscribe} />
      </SettingRow>
      <SettingRow title="Search inside recordings" description="Find moments by date, location, day, time, or spoken words" pro locked={!canSearch}>
        <span className="text-sm text-primary">{canSearch ? 'Enabled' : 'Pro'}</span>
      </SettingRow>
      <SettingRow title="Summary" description="Key points of a capture" pro locked>
        <Button size="sm" variant="secondary" disabled>Coming soon</Button>
      </SettingRow>
      <SettingRow title="Extract important moments" description="Highlight notable parts" pro locked>
        <Button size="sm" variant="secondary" disabled>Coming soon</Button>
      </SettingRow>
      <p className="text-sm text-muted-foreground">Transcription uploads a capture to cloud speech-to-text. Moment search runs on metadata and transcripts and stays on-device.</p>
    </SettingSection>
  );
}