import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PushSubscriptionSchema } from '@/lib/validation/notifications';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { code: 'unauthenticated', message: 'Sign in first.' } }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = PushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'invalid_body', message: 'Invalid subscription payload.' } }, { status: 400 });
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth_key: parsed.data.keys.auth,
      user_agent: request.headers.get('user-agent'),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );

  if (error) {
    return NextResponse.json({ error: { code: 'db_error', message: 'Could not save subscription.' } }, { status: 500 });
  }

  // upsert (not update) so this still works even if a user's
  // notification_preferences row is ever missing for some reason — a
  // plain update would silently do nothing in that case, which is what
  // was happening here before: the subscription saved fine, but
  // push_enabled quietly never got flipped to true, so send-push found
  // no eligible recipients even for genuinely subscribed users.
  const { error: prefsError } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id, push_enabled: true }, { onConflict: 'user_id' });

  if (prefsError) {
    console.error('[push/subscribe] Could not enable push_enabled:', prefsError);
    return NextResponse.json(
      { error: { code: 'db_error', message: 'Subscription saved, but could not enable notifications. Try again.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
