import React, { useEffect, useState } from 'react';
import { Smartphone, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { getDropboxAccount, connectDropbox, disconnectDropbox } from '@/lib/preroll/cloud';
import CloudOffloadButton from './CloudOffloadButton';

const DESTINATIONS = [
  { value: 'device', label: 'This device', hint: 'Recordings stay on this device only', icon: Smartphone },
  { value: 'cloud', label: 'Cloud', hint: 'Pushed to your connected account', icon: Cloud },
];

export default function CloudStorageSection() {
  const s = useSettings();
  const { toast } = useToast();
  const [authed, setAuthed] = useState(true);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  const check = async () => setAccount(await getDropboxAccount());

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (ok) => {
      setAuthed(ok);
      if (ok) await check();
      setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    const url = await connectDropbox();
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        check();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await disconnectDropbox();
    setAccount(null);
    toast({ description: 'Dropbox disconnected' });
  };

  return (
    <SettingSection
      title="Where recordings are saved"
      description="Keep captures on this device, or push them straight to your own cloud account"
    >
      {!authed ? (
        <Button variant="secondary" onClick={() => base44.auth.redirectToLogin()}>Sign in to use cloud storage</Button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {DESTINATIONS.map(({ value, label, hint, icon: Icon }) => {
              const active = (value === 'cloud') === s.autoOffload;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => s.setAutoOffload(value === 'cloud')}
                  className={cn(
                    'min-h-[44px] rounded-lg border p-3 text-left transition-colors',
                    active ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/40',
                  )}
                >
                  <Icon className={cn('mb-2 h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="text-sm font-medium">{label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                </button>
              );
            })}
          </div>

          {s.autoOffload && (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cloud account</p>

              <SettingRow
                title="Dropbox"
                description={
                  loading
                    ? 'Checking connection…'
                    : account
                    ? `Connected${account.name ? ` as ${account.name}` : ''}${account.email ? ` · ${account.email}` : ''}`
                    : 'Quick setup — link your account in one tap'
                }
              >
                {account ? (
                  <Button size="sm" variant="secondary" onClick={handleDisconnect}>Disconnect</Button>
                ) : (
                  <Button size="sm" onClick={handleConnect} disabled={loading}>Connect</Button>
                )}
              </SettingRow>

              <SettingRow title="Google Drive" description="Needs your own Google OAuth app — setup later">
                <span className="text-xs text-muted-foreground">Not available yet</span>
              </SettingRow>

              <SettingRow title="OneDrive" description="Needs your own Microsoft OAuth app — setup later">
                <span className="text-xs text-muted-foreground">Not available yet</span>
              </SettingRow>

              {account && <CloudOffloadButton />}
            </div>
          )}
        </>
      )}
    </SettingSection>
  );
}