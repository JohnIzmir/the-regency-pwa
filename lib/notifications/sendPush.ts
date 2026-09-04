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
  // https://<ref>.supabase.co -> https://<ref>.functions.supabase.co
  return supabaseUrl.replace('.supabase.co', '.functions.supabase.co');
}

export async function triggerPushNotification(eventId: string, type: NotifyType): Promise<void> {
  const base = functionsBaseUrl();
  const secret = process.env.FUNCTION_SECRET;

  if (!base || !secret) {
    // Not configured yet (Edge Function/secrets not deployed) — skip
    // quietly rather than breaking event creation/editing.
    console.warn('[send-push] Skipped: NEXT_PUBLIC_SUPABASE_URL or FUNCTION_SECRET not set.');
    return;
  }

  try {
    const res = await fetch(`${base}/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
      body: JSON.stringify({ eventId, type }),
    });
    if (!res.ok) {
      console.error(`[send-push] Edge Function returned ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error('[send-push] Failed to reach Edge Function:', err);
  }
}
