import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { NotificationPreferencesForm } from '@/components/notifications/NotificationPreferencesForm';
import { PushSubscribeToggle } from '@/components/notifications/PushSubscribeToggle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Notification preferences | The Regency' };

export default async function NotificationsPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-pub-cream">Notifications</h1>
        <p className="text-sm text-pub-muted">Choose how and when we let you know what&apos;s on.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Push notifications</CardTitle>
          <CardDescription>Get an alert on this device — no app install needed.</CardDescription>
        </CardHeader>
        <CardContent>
          <PushSubscribeToggle />
        </CardContent>
      </Card>

      {prefs && (
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesForm initial={prefs} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
