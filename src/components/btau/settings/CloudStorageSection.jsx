import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { base44 } from '@/api/base44Client';
import { getDropboxAccount, connectDropbox, disconnectDropbox } from '@/lib/preroll/cloud';
import DropboxOffloadButton from './DropboxOffloadButton';

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
    <SettingSection title="Cloud storage" description="Back up saved recordings to your own cloud account">
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
                : 'No account connected yet'
            }
          >
            {account ? (
              <Button size="sm" variant="secondary" onClick={handleDisconnect}>Disconnect</Button>
            ) : (
              <Button size="sm" onClick={handleConnect} disabled={loading}>Connect</Button>
            )}
          </SettingRow>
          {account && (
            <>
              <SettingRow
                title="Automatic offload"
                description="Move saved recordings to Dropbox as soon as they are backed up, and whenever you open the app"
              >
                <Switch checked={s.autoOffload} onCheckedChange={s.setAutoOffload} />
              </SettingRow>
              <DropboxOffloadButton />
            </>
          )}
        </>
      )}
    </SettingSection>
  );
}