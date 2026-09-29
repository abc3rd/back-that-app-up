import React, { useEffect, useState } from 'react';
import { Check, Download, Mic, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isInstalled } from '@/lib/deviceSetup';

const installHint = () => {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua)) {
    return 'Open this page in Safari, tap the Share button, then choose “Add to Home Screen”.';
  }
  if (/Android/.test(ua)) {
    return 'Open the browser menu (⋮) and tap “Install app” or “Add to Home screen”.';
  }
  return 'Use the install icon in your browser’s address bar to add the app to this device.';
};

export default function DeviceSetup({ onDone }) {
  const [installed, setInstalled] = useState(isInstalled);
  const [mic, setMic] = useState('unknown');

  const checkMic = async () => {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' });
      setMic(status.state === 'granted' ? 'granted' : status.state === 'denied' ? 'denied' : 'pending');
    } catch {
      setMic('unknown');
    }
  };

  useEffect(() => {
    const onInstalled = () => setInstalled(true);
    window.addEventListener('appinstalled', onInstalled);
    checkMic();
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  const allowMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMic('granted');
    } catch {
      setMic('denied');
    }
  };

  const rows = [
    {
      key: 'install',
      done: installed,
      icon: Download,
      title: installed ? 'Installed on this device' : 'Install on this device',
      body: installed ? 'It opens full screen, like a native app.' : installHint(),
      action: installed ? null : (
        <Button variant="secondary" size="sm" onClick={() => setInstalled(isInstalled())}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Check again
        </Button>
      ),
    },
    {
      key: 'mic',
      done: mic === 'granted',
      icon: Mic,
      title: mic === 'granted' ? 'Microphone ready' : 'Allow the microphone',
      body:
        mic === 'granted'
          ? 'The app can hear the moments worth keeping.'
          : mic === 'denied'
          ? 'Microphone is blocked. Allow it for this app in your device settings, then try again.'
          : 'Needed to listen. Nothing is recorded until a moment happens.',
      action:
        mic === 'granted' ? null : (
          <Button size="sm" onClick={allowMic}>
            {mic === 'denied' ? 'Try again' : 'Allow'}
          </Button>
        ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">Set up on this device</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Two quick steps so it’s ready before you start listening.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {rows.map(({ key, done, icon: Icon, title, body, action }) => (
              <div key={key} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    done ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
                  {action && <div className="mt-3">{action}</div>}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            You can change these later in your device settings.
          </p>
        </div>

        <Button className="min-h-[44px] w-full" onClick={onDone}>Continue</Button>
      </div>
    </div>
  );
}