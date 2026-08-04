import { z } from 'zod';

// Matches event_categories.slug seeded in 02-database-schema.sql
export const EVENT_CATEGORY_SLUGS = [
  'live-band',
  'singer',
  'karaoke',
  'quiz-night',
  'theme-night',
  'special-event',
  'charity-event',
  'sports-screening',
] as const;

// Base object schema — kept separate from the refined version below so
// callers can still use .partial() / .omit() / .shape, which ZodEffects
// (the type .refine() returns) does not support.
export const EventObjectSchema = z.object({
  title: z.string().trim().min(3, 'Give the event a title.').max(150),
  description: z.string().trim().max(4000).default(''),
  categoryId: z.string().uuid('Choose a category.'),
  genre: z.string().trim().max(100).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  startsAt: z.string().datetime({ message: 'Choose a start date and time.' }),
  endsAt: z.string().datetime().optional().nullable(),
  ticketPrice: z
    .number()
    .min(0, 'Ticket price cannot be negative.')
    .max(1000)
    .optional()
    .nullable(),
  isFreeEntry: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'cancelled', 'archived']).default('draft'),
  notifySubscribers: z.boolean().default(true),
});

export const EventSchema = EventObjectSchema.refine(
  (data) => !data.endsAt || new Date(data.endsAt) > new Date(data.startsAt),
  { message: 'End time must be after the start time.', path: ['endsAt'] }
).refine((data) => data.isFreeEntry || (data.ticketPrice ?? 0) > 0, {
  message: 'Set a ticket price, or mark the event as free entry.',
  path: ['ticketPrice'],
});
export type EventInput = z.infer<typeof EventObjectSchema>;

export const RecurrenceRuleSchema = z.object({
  freq: z.literal('weekly'),
  interval: z.number().int().min(1).max(4).default(1),
  byweekday: z
    .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
    .min(1, 'Choose at least one day.'),
  until: z.string().date().optional(),
  occurrenceCount: z.number().int().min(1).max(52).default(12),
});
export type RecurrenceRuleInput = z.infer<typeof RecurrenceRuleSchema>;

export const ModeratePhotoSchema = z.object({
  photoId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().trim().max(300).optional(),
});
export type ModeratePhotoInput = z.infer<typeof ModeratePhotoSchema>;

export const UpdateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['user', 'editor', 'admin', 'super_admin']),
});
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
