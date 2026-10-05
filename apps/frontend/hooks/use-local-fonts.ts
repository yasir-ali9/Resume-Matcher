'use client';

import { useState, useSyncExternalStore } from 'react';
import { getLocalFontName } from '@/lib/types/resume-fonts';

type FontAccessWindow = Window & {
  queryLocalFonts?: () => Promise<{ family: string }[]>;
};

const subscribe = () => () => {};
const serverSupport = () => null;
const browserSupport = () =>
  window.isSecureContext && typeof (window as FontAccessWindow).queryLocalFonts === 'function';

export function useLocalFonts() {
  const supported = useSyncExternalStore<boolean | null>(subscribe, browserSupport, serverSupport);
  const [loading, setLoading] = useState(false);
  const [families, setFamilies] = useState<string[]>([]);
  const [status, setStatus] = useState<'loaded' | 'denied' | 'failed' | null>(null);

  // Invoke directly from a click: the browser requires transient user activation.
  const loadFonts = async () => {
    const fontWindow = window as FontAccessWindow;
    if (!window.isSecureContext || !fontWindow.queryLocalFonts || loading) return;
    setLoading(true);
    setStatus(null);
    try {
      const fonts = await fontWindow.queryLocalFonts();
      const names = fonts
        .map((font) => font.family)
        .filter((name) => getLocalFontName(`local:${name}`));
      setFamilies([...new Set(names)].sort((a, b) => a.localeCompare(b)));
      setStatus('loaded');
    } catch (error) {
      const name = typeof error === 'object' && error !== null && 'name' in error ? error.name : '';
      setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'failed');
    } finally {
      setLoading(false);
    }
  };

  return { supported, loading, families, status, loadFonts };
}
