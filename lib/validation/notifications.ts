import { z } from 'zod';

export const NotificationPreferencesSchema = z.object({
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  frequency: z.enum(['immediate', 'daily', 'weekly', 'off']),
  notifyNewEvent: z.boolean(),
  notifyEventChanged: z.boolean(),
  notifyCancelled: z.boolean(),
  notifyFeatured: z.boolean(),
  notifyWeeklyReminder: z.boolean(),
});
export type NotificationPreferencesInput = z.infer<typeof NotificationPreferencesSchema>;

export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
export type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>;
