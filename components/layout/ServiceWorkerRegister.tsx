'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Non-fatal — push notifications and offline support just won't
        // be available; the rest of the app works fine without it.
      });
    }
  }, []);

  return null;
}
