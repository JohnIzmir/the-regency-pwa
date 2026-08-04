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

  await supabase.from('notification_preferences').update({ push_enabled: true }).eq('user_id', user.id);

  return NextResponse.json({ success: true });
}
