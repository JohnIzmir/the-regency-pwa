'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushSubscribeToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSupported(false));
  }, []);

  async function subscribe() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission was not granted.');
        return;
      }

      const keyRes = await fetch('/api/push/vapid-public-key');
      if (!keyRes.ok) {
        toast.error('Push notifications are not configured yet.');
        return;
      }
      const { key } = await keyRes.json();

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) throw new Error('subscribe failed');

      setSubscribed(true);
      toast.success('Push notifications enabled.');
    } catch {
      toast.error('Could not enable push notifications.');
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      toast.success('Push notifications turned off.');
    } catch {
      toast.error('Could not disable push notifications.');
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-pub-muted">
        Push notifications aren&apos;t supported in this browser. On iPhone, add this site to your home
        screen first (Share → Add to Home Screen), then push notifications become available.
      </p>
    );
  }

  return (
    <Button
      variant={subscribed ? 'outline' : 'default'}
      onClick={subscribed ? unsubscribe : subscribe}
      isLoading={busy}
    >
      {subscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {subscribed ? 'Turn off push notifications' : 'Enable push notifications'}
    </Button>
  );
}
