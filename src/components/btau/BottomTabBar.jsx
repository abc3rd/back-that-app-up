import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Settings as SettingsIcon, Voicemail } from 'lucide-react';

const TABS = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/moments', label: 'Moments', icon: Voicemail },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = TABS.some((t) => t.path === location.pathname) ? location.pathname : '/';
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch">
        {TABS.map((t) => {
          const isActive = activePath === t.path;
          const Icon = t.icon;
          return (
            <button
              key={t.path}
              onClick={() => navigate(t.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}