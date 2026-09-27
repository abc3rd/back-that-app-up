import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Check, Lock } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { PLAN, FEATURE_META } from '@/lib/entitlements';

const PRO = ['Extended / custom pre & post roll', 'Custom & multiple voice phrases', 'Advanced automatic triggers', 'Advanced retention controls', 'High-quality recording', 'ARC multi-device', 'Eligible AI features'];

export default function PaywallModal() {
  const s = useSettings();
  const open = !!s.paywallFeature;
  const featureLabel = s.paywallFeature && FEATURE_META[s.paywallFeature] ? FEATURE_META[s.paywallFeature] : 'this feature';
  return (
    <Dialog open={open} onOpenChange={(o) => !o && s.closePaywall()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lock className="h-4 w-4 text-accent" /> Pro feature</DialogTitle>
          <DialogDescription>{featureLabel} is part of Back That App Up Pro.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {PRO.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-accent" /> {f}</li>)}
        </ul>
        <DialogFooter>
          <Button variant="secondary" onClick={s.closePaywall}>Maybe later</Button>
          <Button onClick={() => { s.setPlan(PLAN.PRO); s.closePaywall(); }}>Enable Pro preview</Button>
        </DialogFooter>
        <p className="text-sm text-muted-foreground">Billing is not yet connected. Preview unlocks Pro locally without payment.</p>
      </DialogContent>
    </Dialog>
  );
}