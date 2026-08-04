'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { NotificationPreferencesSchema, type NotificationPreferencesInput } from '@/lib/validation/notifications';

type ActionResult = { success: true } | { success: false; error: string };

export async function updateNotificationPreferences(
  input: NotificationPreferencesInput
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = NotificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid preferences.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('notification_preferences')
    .update({
      push_enabled: parsed.data.pushEnabled,
      email_enabled: parsed.data.emailEnabled,
      frequency: parsed.data.frequency,
      notify_new_event: parsed.data.notifyNewEvent,
      notify_event_changed: parsed.data.notifyEventChanged,
      notify_cancelled: parsed.data.notifyCancelled,
      notify_featured: parsed.data.notifyFeatured,
      notify_weekly_reminder: parsed.data.notifyWeeklyReminder,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: 'Could not save preferences.' };
  }

  revalidatePath('/notifications');
  return { success: true };
}
