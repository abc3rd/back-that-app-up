import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { base44 } from '@/api/base44Client';
import { getDropboxAccount, connectDropbox, disconnectDropbox } from '@/lib/preroll/cloud';
import CloudOffloadButton from './CloudOffloadButton';

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
      title="Cloud storage"
      description="Saved recordings are pushed to your cloud account automatically, then cleared from this device"
    >
      {!authed ? (
        <Button variant="secondary" onClick={() => base44.auth.redirectToLogin()}>Sign in to connect</Button>
      ) : (
        <>
          <SettingRow
            title="Dropbox"
            description={
              loading
                ? 'Checking connection…'
                : account
                ? `Connected${account.name ? ` as ${account.name}` : ''}${account.email ? ` · ${account.email}` : ''}`
                : 'Link your own Dropbox account'
            }
          >
            {account ? (
              <Button size="sm" variant="secondary" onClick={handleDisconnect}>Disconnect</Button>
            ) : (
              <Button size="sm" onClick={handleConnect} disabled={loading}>Connect</Button>
            )}
          </SettingRow>

          <SettingRow title="Google Drive" description="Uses the Google account already connected to this app">
            <span className="text-sm text-muted-foreground">Linked</span>
          </SettingRow>

          <SettingRow
            title="Automatic offload"
            description="Push each recording to the cloud as soon as it is saved, and remove the on-device copy"
          >
            <Switch checked={s.autoOffload} onCheckedChange={s.setAutoOffload} />
          </SettingRow>

          <CloudOffloadButton />
        </>
      )}
    </SettingSection>
  );
}