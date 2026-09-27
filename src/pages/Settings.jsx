import React from 'react';
import BackButton from '@/components/BackButton';
import CaptureSection from '@/components/btau/settings/CaptureSection';
import TriggersSection from '@/components/btau/settings/TriggersSection';
import StorageSection from '@/components/btau/settings/StorageSection';
import AudioSection from '@/components/btau/settings/AudioSection';
import ArcSection from '@/components/btau/settings/ArcSection';
import AiSection from '@/components/btau/settings/AiSection';
import SubscriptionSection from '@/components/btau/settings/SubscriptionSection';
import AccountSection from '@/components/btau/settings/AccountSection';
import PaywallModal from '@/components/btau/settings/PaywallModal';
import BottomTabBar from '@/components/btau/BottomTabBar';

export default function Settings() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/80 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <BackButton />
        <h1 className="font-display text-2xl">Settings</h1>
      </header>
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
      <BottomTabBar />
    </div>
  );
}