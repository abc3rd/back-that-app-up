import React, { useRef } from 'react';
import ScreenHeader from '@/components/btau/ScreenHeader';
import { useTabScroll } from '@/hooks/useTabScroll';
import CaptureSection from '@/components/btau/settings/CaptureSection';
import TriggersSection from '@/components/btau/settings/TriggersSection';
import StorageSection from '@/components/btau/settings/StorageSection';
import AudioSection from '@/components/btau/settings/AudioSection';
import ArcSection from '@/components/btau/settings/ArcSection';
import AiSection from '@/components/btau/settings/AiSection';
import SubscriptionSection from '@/components/btau/settings/SubscriptionSection';
import AccountSection from '@/components/btau/settings/AccountSection';
import PaywallModal from '@/components/btau/settings/PaywallModal';

export default function Settings() {
  const scrollRef = useRef(null);
  useTabScroll('/settings', scrollRef);
  return (
    <div ref={scrollRef} className="h-screen overflow-y-auto overscroll-y-none no-scrollbar bg-background text-foreground">
      <ScreenHeader title="Settings" />
      <main className="mx-auto max-w-md px-6 pt-8 pb-[max(7rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-6">
          <SubscriptionSection />
          <CaptureSection />
          <TriggersSection />
          <StorageSection />
          <AudioSection />
          <ArcSection />
          <AiSection />
          <AccountSection />
        </div>
      </main>
      <PaywallModal />
    </div>
  );
}