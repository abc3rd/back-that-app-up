import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTabStack } from '@/hooks/useTabStack';
import { Home as HomeIcon, Settings as SettingsIcon, Voicemail } from 'lucide-react';

const TABS = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/moments', label: 'Moments', icon: Voicemail },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

function activeTabPath(pathname) {
  const match = TABS.find(
    (t) => pathname === t.path || (t.path !== '/' && pathname.startsWith(t.path + '/'))
  );
  return match ? match.path : '/';
}

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reset } = useTabStack();
  const [pulsePath, setPulsePath] = useState(null);
  const activePath = activeTabPath(location.pathname);

  const handleTabPress = (t) => {
    if (activePath !== t.path) {
      navigate(t.path);
      return;
    }
    // Re-selecting the active tab: confirm with haptics + a brief icon scale.
    if (typeof navigator !== 'undefined' && navigator.vibrate && localStorage.getItem('btau.silent') !== '1') navigator.vibrate(10);
    setPulsePath(t.path);
    window.setTimeout(() => setPulsePath((p) => (p === t.path ? null : p)), 250);
    if (location.pathname !== t.path) {
      // On a nested sub-route: pop back to the tab root.
      navigate(t.path);
    } else {
      // Already at the tab root: scroll to top.
      reset(t.path);
    }
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch">
        {TABS.map((t) => {
          const isActive = activePath === t.path;
          const Icon = t.icon;
          return (
            <button
              key={t.path}
              onClick={() => handleTabPress(t)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <motion.div
                animate={{ scale: pulsePath === t.path ? 1.3 : 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </motion.div>
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}