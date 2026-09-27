import React from 'react';
import ScreenHeader from '@/components/btau/ScreenHeader';
import PublicFooter from '@/components/btau/PublicFooter';

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader title="About" />
      <main className="mx-auto flex max-w-md flex-col gap-8 px-6 pt-6 pb-[max(7rem,env(safe-area-inset-bottom))]">
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Back That App Up! is an ambient, privacy-first audio capture tool that records the moments you wish you had hit record for. It keeps a rolling buffer of the audio happening around your device and, the instant a loud spike occurs or you say the wake phrase, it saves the preceding minutes so the moment is never lost. Nothing is written until a trigger fires, and saved clips stay on your device by default.
          </p>
          <p>
            It is built for journalists who need to capture quotes on the fly, podcasters and musicians chasing spontaneous ideas, students and meeting attendees who want a reliable record of what was just said, and anyone who has ever missed a great line because they were not recording. Optional voice arming lets you start listening hands-free, automatic spike detection catches surprises without a tap, and AI transcription turns saved clips into searchable text so you can find a moment by the words spoken in it.
          </p>
          <p>
            Back That App Up! is built by an independent team focused on ambient, on-device audio tools. Cloud backup to Google Drive is available for the clips you choose to protect, and every capture carries rich metadata — time, trigger type, and location — so your library stays organized. The result is a calm, always-listening safety net for the audio you did not know you needed.
          </p>
        </div>
        <PublicFooter />
      </main>
    </div>
  );
}