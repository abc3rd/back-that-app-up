import { useEffect } from 'react';
import { useTheme } from 'next-themes';

// Keeps the Android status-bar color in sync with the active theme so the
// browser chrome matches the app surface in both light and dark modes.
export default function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute('content', resolvedTheme === 'light' ? '#ffffff' : '#0a0a12');
  }, [resolvedTheme]);

  return null;
}