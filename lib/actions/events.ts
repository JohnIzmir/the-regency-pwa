'use server';

import { revalidatePath } from 'next/cache';
import { addDays } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/session';
import { EventSchema, EventObjectSchema, RecurrenceRuleSchema, type EventInput, type RecurrenceRuleInput } from '@/lib/validation/events';
import { slugify } from '@/lib/utils';

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Generates a unique slug by appending -2, -3, ... on collision. */
async function uniqueSlug(base: string): Promise<string> {
  const supabase = createClient();
  const root = slugify(base) || 'event';
  let candidate = root;
  let suffix = 2;

  while (true) {
    const { data } = await supabase.from('events').select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
}

export async function createEvent(input: EventInput): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = EventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid event.' };
  }

  const supabase = createClient();
  const slug = await uniqueSlug(parsed.data.title);

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      category_id: parsed.data.categoryId,
      genre: parsed.data.genre ?? null,
      image_url: parsed.data.imageUrl ?? null,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt ?? null,
      ticket_price: parsed.data.ticketPrice ?? null,
      is_free_entry: parsed.data.isFreeEntry,
      is_featured: parsed.data.isFeatured,
      status: parsed.data.status,
      notify_subscribers: parsed.data.notifySubscribers,
      created_by: admin.id,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: 'Could not create event. Check the details and try again.' };
  }

  revalidatePath('/admin/events');
  revalidatePath('/entertainment');
  return { success: true, data: { id: data.id } };
}

/**
 * Creates a weekly recurring series: one `event_series` template row plus
 * N materialized `events` rows (default 12 weeks), each independently
 * editable afterwards without touching the rest of the series — same
 * pattern Google Calendar uses. `firstOccurrenceStartsAt` sets the date
 * and time of the very first occurrence; later ones are +7*interval days.
 */
export async function createRecurringSeries(
  base: Omit<EventInput, 'startsAt' | 'endsAt'>,
  recurrence: RecurrenceRuleInput,
  firstOccurrenceStartsAt: string,
  durationMinutes?: number
): Promise<ActionResult<{ seriesId: string; eventIds: string[] }>> {
  const admin = await requireAdmin();

  const parsedBase = EventObjectSchema.safeParse({ ...base, startsAt: firstOccurrenceStartsAt });
  const parsedRecurrence = RecurrenceRuleSchema.safeParse(recurrence);

  if (!parsedBase.success) {
    return { success: false, error: parsedBase.error.issues[0]?.message ?? 'Invalid event details.' };
  }
  if (!parsedRecurrence.success) {
    return { success: false, error: parsedRecurrence.error.issues[0]?.message ?? 'Invalid recurrence rule.' };
  }

  const supabase = createClient();

  const { data: series, error: seriesError } = await supabase
    .from('event_series')
    .insert({
      title: parsedBase.data.title,
      category_id: parsedBase.data.categoryId,
      recurrence_rule: parsedRecurrence.data,
      default_start_time: new Date(firstOccurrenceStartsAt).toISOString().slice(11, 19),
      active: true,
      created_by: admin.id,
    })
    .select('id')
    .single();

  if (seriesError || !series) {
    return { success: false, error: 'Could not create the recurring series.' };
  }

  const eventIds: string[] = [];
  const intervalDays = 7 * parsedRecurrence.data.interval;

  for (let i = 0; i < parsedRecurrence.data.occurrenceCount; i += 1) {
    const startsAt = addDays(new Date(firstOccurrenceStartsAt), i * intervalDays).toISOString();
    const computedEndsAt = durationMinutes
      ? new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString()
      : null;

    const slug = await uniqueSlug(`${parsedBase.data.title}-${startsAt.slice(0, 10)}`);

    const { data: occurrence, error: occurrenceError } = await supabase
      .from('events')
      .insert({
        series_id: series.id,
        title: parsedBase.data.title,
        slug,
        description: parsedBase.data.description,
        category_id: parsedBase.data.categoryId,
        genre: parsedBase.data.genre ?? null,
        image_url: parsedBase.data.imageUrl ?? null,
        starts_at: startsAt,
        ends_at: computedEndsAt,
        ticket_price: parsedBase.data.ticketPrice ?? null,
        is_free_entry: parsedBase.data.isFreeEntry,
        is_featured: false,
        status: parsedBase.data.status,
        notify_subscribers: parsedBase.data.notifySubscribers,
        created_by: admin.id,
      })
      .select('id')
      .single();

    if (occurrenceError || !occurrence) {
      return { success: false, error: `Series created, but occurrence ${i + 1} failed. Check /admin/events.` };
    }
    eventIds.push(occurrence.id);
  }

  revalidatePath('/admin/events');
  revalidatePath('/entertainment');
  return { success: true, data: { seriesId: series.id, eventIds } };
}

export async function updateEvent(id: string, input: Partial<EventInput>): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = EventObjectSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid event.' };
  }

  const supabase = createClient();
  const updates: Record<string, unknown> = { updated_by: admin.id };
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.categoryId !== undefined) updates.category_id = parsed.data.categoryId;
  if (parsed.data.genre !== undefined) updates.genre = parsed.data.genre;
  if (parsed.data.imageUrl !== undefined) updates.image_url = parsed.data.imageUrl;
  if (parsed.data.startsAt !== undefined) updates.starts_at = parsed.data.startsAt;
  if (parsed.data.endsAt !== undefined) updates.ends_at = parsed.data.endsAt;
  if (parsed.data.ticketPrice !== undefined) updates.ticket_price = parsed.data.ticketPrice;
  if (parsed.data.isFreeEntry !== undefined) updates.is_free_entry = parsed.data.isFreeEntry;
  if (parsed.data.isFeatured !== undefined) updates.is_featured = parsed.data.isFeatured;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.notifySubscribers !== undefined) updates.notify_subscribers = parsed.data.notifySubscribers;

  // NOTE: when status becomes 'cancelled' or key fields (starts_at, status)
  // change on a published, notify_subscribers=true event, Stage 3 wires
  // this up to enqueue push/email notifications via the `send-push` Edge
  // Function. Left as a deliberate seam here, not implemented yet.

  const { error } = await supabase.from('events').update(updates).eq('id', id);
  if (error) {
    return { success: false, error: 'Could not update event.' };
  }

  revalidatePath('/admin/events');
  revalidatePath('/entertainment');
  revalidatePath(`/entertainment/${id}`);
  return { success: true, data: undefined };
}

export async function duplicateEvent(id: string, newStartsAt: string): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const supabase = createClient();

  const { data: original, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !original) {
    return { success: false, error: 'Original event not found.' };
  }

  const slug = await uniqueSlug(`${original.title}-${newStartsAt.slice(0, 10)}`);

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: original.title,
      slug,
      description: original.description,
      category_id: original.category_id,
      genre: original.genre,
      image_url: original.image_url,
      starts_at: newStartsAt,
      ends_at: null,
      ticket_price: original.ticket_price,
      is_free_entry: original.is_free_entry,
      is_featured: false,
      status: 'draft',
      notify_subscribers: original.notify_subscribers,
      created_by: admin.id,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: 'Could not duplicate event.' };
  }

  revalidatePath('/admin/events');
  return { success: true, data: { id: data.id } };
}

/**
 * Draft events with no attached photos are hard-deleted. Anything that's
 * ever been published (or has photos/comments hanging off it) is
 * soft-deleted to 'archived' instead, preserving history and the audit
 * trail — matches the spec's "Archive Old Events" requirement.
 */
export async function deleteEvent(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createClient();

  const { data: event } = await supabase.from('events').select('status').eq('id', id).single();
  if (!event) return { success: false, error: 'Event not found.' };

  const { count: photoCount } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id);

  if (event.status === 'draft' && !photoCount) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return { success: false, error: 'Could not delete event.' };
  } else {
    const { error } = await supabase.from('events').update({ status: 'archived' }).eq('id', id);
    if (error) return { success: false, error: 'Could not archive event.' };
  }

  revalidatePath('/admin/events');
  revalidatePath('/entertainment');
  return { success: true, data: undefined };
}
