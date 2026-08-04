import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { AddToCalendarButton } from '@/components/entertainment/AddToCalendarButton';
import { ShareButtons } from '@/components/entertainment/ShareButtons';
import { CountdownTimer } from '@/components/entertainment/CountdownTimer';
import { GoogleMap } from '@/components/shared/GoogleMap';
import { FavouriteButton } from '@/components/entertainment/FavouriteButton';
import { formatEventDate, formatEventTime } from '@/lib/utils';

async function getEvent(slug: string) {
  const supabase = createClient();
  const { data: event } = await supabase
    .from('events')
    .select('*, event_categories(name)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (event) {
    // Fire-and-forget — a failed view-count bump should never break the page.
    void supabase.rpc('increment_event_view_count', { target_event_id: event.id });
  }

  return event;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const event = await getEvent(params.slug);
  if (!event) return { title: 'Event not found | The Regency' };

  return {
    title: `${event.title} | The Regency`,
    description: event.description?.slice(0, 160) || `${event.title} at The Regency, Weston-super-Mare.`,
    openGraph: {
      title: event.title,
      images: [`/api/og/event/${event.id}`],
    },
  };
}

export const revalidate = 120;

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = await getEvent(params.slug);
  if (!event) notFound();

  const categoryName = (event.event_categories as unknown as { name: string } | null)?.name;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theregencyws.co.uk';
  const eventUrl = `${siteUrl}/entertainment/${event.slug}`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="relative mb-6 h-72 w-full overflow-hidden rounded-lg bg-pub-surface2 sm:h-96">
        {event.image_url ? (
          <Image src={event.image_url} alt={event.title} fill className="object-cover" priority />
        ) : (
          <div className="flex h-full items-center justify-center text-pub-muted">No image yet</div>
        )}
        <div className="absolute left-4 top-4 flex gap-2">
          {event.is_featured && <Badge>Featured</Badge>}
          {event.is_free_entry && <Badge variant="secondary">Free Entry</Badge>}
        </div>
      </div>

      <p className="text-sm uppercase tracking-[0.3em] text-pub-gold">{categoryName ?? event.genre ?? 'Event'}</p>
      <h1 className="mt-1 font-display text-4xl font-bold text-pub-cream">{event.title}</h1>
      <p className="mt-2 text-lg text-pub-muted">
        {formatEventDate(event.starts_at)} · {formatEventTime(event.starts_at)}
        {!event.is_free_entry && event.ticket_price ? ` · £${event.ticket_price.toFixed(2)}` : ''}
      </p>

      <div className="my-6">
        <CountdownTimer startsAt={event.starts_at} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AddToCalendarButton eventId={event.id} />
        <ShareButtons url={eventUrl} title={event.title} />
        <FavouriteButton eventId={event.id} />
      </div>

      {event.description && (
        <div className="prose prose-invert mt-8 max-w-none text-pub-cream">
          <p className="whitespace-pre-line leading-relaxed">{event.description}</p>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-3 font-display text-xl font-semibold text-pub-cream">Find us</h2>
        <GoogleMap query="The Regency, 22-24 Lower Church Road, Weston-super-Mare, BS23 2AG" />
      </div>
    </main>
  );
}
