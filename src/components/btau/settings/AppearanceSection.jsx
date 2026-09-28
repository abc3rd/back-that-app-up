import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import SettingSection from './SettingSection';
import SettingRow from './SettingRow';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/useSettings';

const THEMES = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function AppearanceSection() {
  const s = useSettings();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const active = mounted ? theme : 'system';

  return (
    <SettingSection title="Appearance & Alerts" description="Theme and stealth feedback">
      <SettingRow title="Theme" description="Light, dark, or follow your device">
        <div className="flex rounded-full bg-secondary p-1">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`rounded-full px-3 py-1 text-sm ${active === t.value ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </SettingRow>
      <SettingRow title="Sound" description="Play an audible cue with status alerts">
        <Switch checked={s.sound} onCheckedChange={s.setSound} />
      </SettingRow>
      <SettingRow title="Vibration" description="Vibrate briefly when a capture starts">
        <Switch checked={s.vibration} onCheckedChange={s.setVibration} />
      </SettingRow>
      <SettingRow title="Notifications" description="Show the running-status reminder. Off keeps the app fully silent.">
        <Switch checked={s.notifications} onCheckedChange={s.setNotifications} />
      </SettingRow>
    </SettingSection>
  );
}