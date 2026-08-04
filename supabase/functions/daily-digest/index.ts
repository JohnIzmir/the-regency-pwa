// supabase/functions/daily-digest/index.ts
//
// Triggered daily at 08:00 by pg_cron. Bundles anything new or changed
// in the last 24 hours for users on notification_preferences.frequency
// = 'daily'. Skips silently if nothing happened — no "nothing new today"
// spam. Deploy with: supabase functions deploy daily-digest

import webpush from 'npm:web-push@3.6.7';
import { serviceClient, corsHeaders } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== Deno.env.get('FUNCTION_SECRET')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@theregencyws.co.uk',
    Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );

  const supabase = serviceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: newEvents } = await supabase
    .from('events')
    .select('id, title, starts_at')
    .eq('status', 'published')
    .gte('created_at', since)
    .order('starts_at', { ascending: true });

  if (!newEvents || newEvents.length === 0) {
    return new Response(JSON.stringify({ skipped: 'nothing new in the last 24h' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const title = newEvents.length === 1 ? 'New event added' : `${newEvents.length} new events added`;
  const body = newEvents.map((e) => e.title).join(', ');

  const { data: recipients } = await supabase
    .from('notification_preferences')
    .select('user_id, push_enabled, email_enabled')
    .eq('frequency', 'daily')
    .eq('notify_new_event', true)
    .or('push_enabled.eq.true,email_enabled.eq.true');

  let sent = 0;

  for (const recipient of recipients ?? []) {
    if (recipient.push_enabled) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth_key')
        .eq('user_id', recipient.user_id);

      for (const sub of subscriptions ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            JSON.stringify({ title, body, data: { url: '/entertainment' } })
          );
          sent += 1;
        } catch (err) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
    }

    await supabase.from('notifications_log').insert({
      user_id: recipient.user_id,
      type: 'new_event',
      channel: 'push',
      title,
      body,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify({ recipientCount: recipients?.length ?? 0, sent }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
});
