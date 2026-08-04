import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { code: 'unauthenticated', message: 'Sign in first.' } }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : null;

  const query = supabase.from('push_subscriptions').delete().eq('user_id', user.id);
  const { error } = endpoint ? await query.eq('endpoint', endpoint) : await query;

  if (error) {
    return NextResponse.json({ error: { code: 'db_error', message: 'Could not remove subscription.' } }, { status: 500 });
  }

  const { count } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (!count) {
    await supabase.from('notification_preferences').update({ push_enabled: false }).eq('user_id', user.id);
  }

  return NextResponse.json({ success: true });
}
