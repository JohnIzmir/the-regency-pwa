import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EventForm } from '@/components/admin/EventForm';

export const metadata = { title: 'Edit event | The Regency' };

function toLocalInputValue(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: event }, { data: categories }] = await Promise.all([
    supabase.from('events').select('*').eq('id', params.id).single(),
    supabase.from('event_categories').select('id, name').order('name'),
  ]);

  if (!event) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-pub-cream">Edit event</h1>
      <EventForm
        mode="edit"
        eventId={event.id}
        categories={categories ?? []}
        defaultValues={{
          title: event.title,
          description: event.description,
          categoryId: event.category_id,
          genre: event.genre ?? '',
          imageUrl: event.image_url,
          startsAt: toLocalInputValue(event.starts_at),
          endsAt: toLocalInputValue(event.ends_at),
          ticketPrice: event.ticket_price != null ? String(event.ticket_price) : '',
          isFreeEntry: event.is_free_entry,
          isFeatured: event.is_featured,
          status: event.status,
          notifySubscribers: event.notify_subscribers,
        }}
      />
    </div>
  );
}
