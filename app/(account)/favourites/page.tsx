import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { EventCard } from '@/components/entertainment/EventCard';

export const metadata: Metadata = { title: 'Your favourites | The Regency' };

export default async function FavouritesPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: favourites } = await supabase
    .from('favourites')
    .select('event_id, events(id, title, slug, starts_at, image_url, is_free_entry, is_featured, ticket_price, genre, event_categories(name))')
    .eq('user_id', user.id);

  const events = (favourites ?? [])
    .map((f) => f.events as unknown as {
      id: string; title: string; slug: string; starts_at: string; image_url: string | null;
      is_free_entry: boolean; is_featured: boolean; ticket_price: number | null; genre: string | null;
      event_categories: { name: string } | null;
    } | null)
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-pub-cream">Your favourites</h1>
        <p className="text-sm text-pub-muted">Events you&apos;ve saved to keep an eye on.</p>
      </div>

      {events.length === 0 ? (
        <p className="text-pub-muted">
          Nothing saved yet — tap the heart on any event to add it here.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {events.map((event) => (
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
                categoryName: event.event_categories?.name,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
