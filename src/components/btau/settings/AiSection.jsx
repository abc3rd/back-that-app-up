import React from 'react';
import { Button } from '@/components/ui/button';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import { FEATURES } from '@/lib/entitlements';

const AI = [
  { id: FEATURES.AI_TRANSCRIPTION, title: 'Transcription', desc: 'Text from your captures' },
  { id: FEATURES.AI_SUMMARY, title: 'Summary', desc: 'Key points of a capture' },
  { id: FEATURES.AI_SEARCH, title: 'Search inside recordings', desc: 'Find moments by words' },
  { id: FEATURES.AI_MOMENTS, title: 'Extract important moments', desc: 'Highlight notable parts' },
];

export default function AiSection() {
  return (
    <SettingSection title="AI" description="Smart features (awaiting the ARC AI Router)">
      {AI.map((f) => (
        <SettingRow key={f.id} title={f.title} description={f.desc} pro locked>
          <Button size="sm" variant="secondary" disabled>Coming soon</Button>
        </SettingRow>
      ))}
      <p className="text-sm text-muted-foreground">AI features are feature-flagged and will not return fake results until the ARC AI Router exists.</p>
    </SettingSection>
  );
}