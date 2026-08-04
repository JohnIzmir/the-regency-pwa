import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { EventCard } from '@/components/entertainment/EventCard';
import { EventFilters } from '@/components/entertainment/EventFilters';
import { EventCalendarView } from '@/components/entertainment/EventCalendarView';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'What’s On | The Regency',
  description: 'Live bands, singers, karaoke, quiz nights, theme nights and sports screenings at The Regency.',
};

export const revalidate = 60;

export default async function EntertainmentPage({
  searchParams,
}: {
  searchParams: { view?: string; q?: string; category?: string; free?: string };
}) {
  const view = searchParams.view === 'calendar' ? 'calendar' : 'list';
  const supabase = createClient();

  const { data: categories } = await supabase.from('event_categories').select('id, name, slug').order('name');

  let categoryId: string | null = null;
  if (searchParams.category) {
    const match = categories?.find((c) => c.slug === searchParams.category);
    categoryId = match?.id ?? null;
  }

  let query = supabase
    .from('events')
    .select('id, title, slug, starts_at, image_url, is_free_entry, is_featured, ticket_price, genre, event_categories(name)')
    .eq('status', 'published')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(60);

  if (categoryId) query = query.eq('category_id', categoryId);
  if (searchParams.free === 'true') query = query.eq('is_free_entry', true);
  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`);

  const { data: events } = view === 'list' ? await query : { data: [] };

  const paramsWithView = (v: string) => {
    const p = new URLSearchParams();
    if (searchParams.q) p.set('q', searchParams.q);
    if (searchParams.category) p.set('category', searchParams.category);
    if (searchParams.free) p.set('free', searchParams.free);
    p.set('view', v);
    return `/entertainment?${p.toString()}`;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-pub-gold">What&apos;s On</p>
          <h1 className="font-display text-3xl font-bold text-pub-cream">Upcoming Entertainment</h1>
        </div>
        <div className="flex gap-2 rounded-md border border-pub-wood-light/40 p-1">
          <Link
            href={paramsWithView('list')}
            className={cn('rounded px-3 py-1.5 text-sm', view === 'list' ? 'bg-pub-gold text-pub-bg' : 'text-pub-cream')}
          >
            List
          </Link>
          <Link
            href={paramsWithView('calendar')}
            className={cn('rounded px-3 py-1.5 text-sm', view === 'calendar' ? 'bg-pub-gold text-pub-bg' : 'text-pub-cream')}
          >
            Calendar
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <EventFilters categories={categories ?? []} />
      </div>

      {view === 'calendar' ? (
        <EventCalendarView />
      ) : (
        <>
          {(!events || events.length === 0) && (
            <p className="text-pub-muted">No upcoming events match your search — check back soon.</p>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(events ?? []).map((event) => (
              <EventCard
                key={event.id}
                event={{
                  id: event.id,
                  title: event.title,
                  slug: event.slug,
                  startsAt: event.starts_at,
                  imageUrl: event.image_url,
                  isFreeEntry: event.is_free_entry,
                  isFeatured: event.is_featured,
                  ticketPrice: event.ticket_price,
                  genre: event.genre,
                  categoryName: (event.event_categories as unknown as { name: string } | null)?.name,
                }}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
