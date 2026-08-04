// supabase/functions/send-push/index.ts
//
// Called synchronously from lib/actions/events.ts (createEvent/updateEvent)
// right after a published, notify_subscribers=true event is created,
// changed, or cancelled. Not on a cron — this is the "immediate" half of
// the notification system; weekly-digest/daily-digest handle the batched
// half. Deploy with: supabase functions deploy send-push
//
// Invoked as:
//   POST /functions/v1/send-push
//   { "eventId": "...", "type": "new_event" | "event_changed" | "event_cancelled" | "featured_event" }
//   Header: x-webhook-secret: <FUNCTION_SECRET>

import webpush from 'npm:web-push@3.6.7';
import { serviceClient, corsHeaders } from '../_shared/db.ts';

type NotifyType = 'new_event' | 'event_changed' | 'event_cancelled' | 'featured_event';

const PREFERENCE_COLUMN: Record<NotifyType, string> = {
  new_event: 'notify_new_event',
  event_changed: 'notify_event_changed',
  event_cancelled: 'notify_cancelled',
  featured_event: 'notify_featured',
};

const TITLE: Record<NotifyType, string> = {
  new_event: 'New event added',
  event_changed: 'Event updated',
  event_cancelled: 'Event cancelled',
  featured_event: 'Featured event',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== Deno.env.get('FUNCTION_SECRET')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const { eventId, type } = (await req.json()) as { eventId: string; type: NotifyType };
  if (!eventId || !PREFERENCE_COLUMN[type]) {
    return new Response(JSON.stringify({ error: 'invalid payload' }), { status: 400 });
  }

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@theregencyws.co.uk',
    Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );

  const supabase = serviceClient();

  const { data: event } = await supabase
    .from('events')
    .select('id, title, slug, starts_at')
    .eq('id', eventId)
    .single();

  if (!event) {
    return new Response(JSON.stringify({ error: 'event not found' }), { status: 404 });
  }

  const preferenceColumn = PREFERENCE_COLUMN[type];
  const { data: recipients } = await supabase
    .from('notification_preferences')
    .select('user_id, push_enabled, email_enabled')
    .eq('frequency', 'immediate')
    .eq(preferenceColumn, true)
    .or('push_enabled.eq.true,email_enabled.eq.true');

  const title = TITLE[type];
  const body = `${event.title} — ${new Date(event.starts_at).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })}`;
  const url = `/entertainment/${event.slug}`;

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients ?? []) {
    if (recipient.push_enabled) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth_key')
        .eq('user_id', recipient.user_id);

      for (const sub of subscriptions ?? []) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth_key },
            },
            JSON.stringify({ title, body, data: { url } })
          );
          sent += 1;
          await supabase.from('notifications_log').insert({
            user_id: recipient.user_id,
            type,
            channel: 'push',
            title,
            body,
            related_event_id: event.id,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
        } catch (err) {
          failed += 1;
          const statusCode = (err as { statusCode?: number })?.statusCode;
          // 404/410 means the browser unsubscribed or the endpoint expired
          // — clean it up so we stop retrying it forever.
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
          await supabase.from('notifications_log').insert({
            user_id: recipient.user_id,
            type,
            channel: 'push',
            title,
            body,
            related_event_id: event.id,
            status: 'failed',
          });
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
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'The Regency <notifications@theregencyws.co.uk>',
              to: profile.email,
              subject: title,
              html: `<p>Hi ${profile.full_name},</p><p>${body}</p><p><a href="${Deno.env.get('SITE_URL')}${url}">View event</a></p>`,
            }),
          });

          await supabase.from('notifications_log').insert({
            user_id: recipient.user_id,
            type,
            channel: 'email',
            title,
            body,
            related_event_id: event.id,
            status: res.ok ? 'sent' : 'failed',
            sent_at: res.ok ? new Date().toISOString() : null,
          });
        }
      }
    }
  }

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
});
