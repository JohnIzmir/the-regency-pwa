/**
 * Fires the `send-push` Supabase Edge Function so subscribed customers get
 * a push notification (and/or email, per their preferences) when an event
 * goes live, changes, or is cancelled. See supabase/functions/send-push
 * for the receiving side.
 *
 * Requires FUNCTION_SECRET to be set both here (Vercel env vars) and as a
 * Supabase secret (`supabase secrets set FUNCTION_SECRET=...`) — they must
 * match, since that's how the Edge Function authenticates the caller.
 *
 * Deliberately fire-and-forget: a customer never seeing a push shouldn't
 * mean the admin can't save an event, so failures here are logged, not
 * thrown.
 */

export type NotifyType = 'new_event' | 'event_changed' | 'event_cancelled' | 'featured_event';

function functionsBaseUrl(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  // https://<ref>.supabase.co -> https://<ref>.supabase.co/functions/v1
  // (this is the URL Supabase's own dashboard shows for each deployed
  // function — the <ref>.functions.supabase.co form used elsewhere in
  // this project, e.g. the cron jobs in DEPLOYMENT.md, is a different,
  // separate address and was silently failing here)
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1`;
}

export async function triggerPushNotification(eventId: string, type: NotifyType): Promise<void> {
  const base = functionsBaseUrl();
  const secret = process.env.FUNCTION_SECRET;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!base || !secret || !anonKey) {
    // Not configured yet (Edge Function/secrets not deployed) — skip
    // quietly rather than breaking event creation/editing.
    console.warn('[send-push] Skipped: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or FUNCTION_SECRET not set.');
    return;
  }

  try {
    const res = await fetch(`${base}/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
        // Supabase's own gateway requires a valid Authorization header on
        // every Edge Function call before the function's code even runs —
        // separate from and in addition to the x-webhook-secret check
        // inside send-push itself. The anon key satisfies the gateway;
        // it's already public (shipped to every browser), so this isn't
        // a new secret being exposed.
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ eventId, type }),
    });
    if (!res.ok) {
      console.error(`[send-push] Edge Function returned ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error('[send-push] Failed to reach Edge Function:', err);
  }
}
