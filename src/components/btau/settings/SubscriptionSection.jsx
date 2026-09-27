import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import SettingSection from './SettingSection';
import { useSettings } from '@/hooks/useSettings';
import { PLAN } from '@/lib/entitlements';

const FREE = ['Core recorder', '30-second pre-roll', '10-second post-roll', 'Voice trigger (default phrase)', 'Manual trigger', 'Basic local recording'];
const PRO = ['Extended / custom pre & post roll', 'Custom & multiple voice phrases', 'Advanced automatic triggers', 'Advanced retention controls', 'High-quality recording', 'ARC multi-device', 'Eligible AI features'];

export default function SubscriptionSection() {
  const s = useSettings();
  return (
    <SettingSection title="Subscription" description={s.isPro ? 'Pro preview active' : 'Free plan'}>
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-2xl border p-4 ${!s.isPro ? 'border-primary bg-primary/5' : 'border-border'}`}>
          <p className="text-sm font-medium">Free</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {FREE.map((f) => <li key={f} className="flex gap-1"><Check className="h-3 w-3 text-primary" /> {f}</li>)}
          </ul>
        </div>
        <div className={`rounded-2xl border p-4 ${s.isPro ? 'border-accent bg-accent/5' : 'border-border'}`}>
          <p className="text-sm font-medium">Pro</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {PRO.map((f) => <li key={f} className="flex gap-1"><Check className="h-3 w-3 text-accent" /> {f}</li>)}
          </ul>
        </div>
      </div>
      <div className="flex gap-2">
        {s.isPro ? (
          <Button variant="secondary" onClick={() => s.setPlan(PLAN.FREE)}>Switch to Free</Button>
        ) : (
          <Button onClick={() => s.setPlan(PLAN.PRO)}>Enable Pro preview</Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">Billing is not yet connected. This preview toggle unlocks Pro features locally without payment.</p>
    </SettingSection>
  );
}