// supabase/functions/weekly-digest/index.ts
//
// Triggered every Monday 08:00 by pg_cron (see 0001_init.sql, section 15).
// Sends "This week's entertainment is now available" to every user whose
// notification_preferences.frequency = 'weekly' and notify_weekly_reminder
// = true. Deploy with: supabase functions deploy weekly-digest

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

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: events } = await supabase
    .from('events')
    .select('id, title, starts_at')
    .eq('status', 'published')
    .gte('starts_at', now.toISOString())
    .lte('starts_at', weekEnd.toISOString())
    .order('starts_at', { ascending: true });

  if (!events || events.length === 0) {
    return new Response(JSON.stringify({ skipped: 'no events this week' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const title = "This week's entertainment is now available";
  const body =
    events.length === 1
      ? events[0].title
      : `${events[0].title} and ${events.length - 1} more this week.`;

  const { data: recipients } = await supabase
    .from('notification_preferences')
    .select('user_id, push_enabled, email_enabled')
    .eq('frequency', 'weekly')
    .eq('notify_weekly_reminder', true)
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

    if (recipient.email_enabled) {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', recipient.user_id)
          .single();

        if (profile) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'The Regency <notifications@theregencyws.co.uk>',
              to: profile.email,
              subject: title,
              html: `<p>Hi ${profile.full_name},</p><p>${body}</p><ul>${events
                .map((e) => `<li>${e.title} — ${new Date(e.starts_at).toLocaleString('en-GB')}</li>`)
                .join('')}</ul><p><a href="${Deno.env.get('SITE_URL')}/entertainment">See the full list</a></p>`,
            }),
          });
        }
      }
    }

    await supabase.from('notifications_log').insert({
      user_id: recipient.user_id,
      type: 'weekly_reminder',
      channel: recipient.push_enabled ? 'push' : 'email',
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
