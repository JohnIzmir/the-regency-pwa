import Link from 'next/link';
import Image from 'next/image';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { buttonVariants } from '@/components/ui/button';
import { EventCard } from '@/components/entertainment/EventCard';
import { GoogleMap } from '@/components/shared/GoogleMap';
import { TrustBadges } from '@/components/shared/TrustBadges';

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();

  const [{ data: events }, { data: venue }, { data: photos }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, slug, starts_at, image_url, is_free_entry, is_featured, ticket_price, genre, event_categories(name)')
      .eq('status', 'published')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(3),
    supabase.from('venue_info').select('*').single(),
    supabase
      .from('photos')
      .select('id, thumbnail_path, caption')
      .eq('status', 'approved')
      .order('uploaded_at', { ascending: false })
      .limit(6),
  ]);

  const serviceClient = createServiceRoleClient();
  const galleryPreview = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await serviceClient.storage.from('gallery-photos').createSignedUrl(photo.thumbnail_path, 3600);
      return { ...photo, url: data?.signedUrl ?? '' };
    })
  );

  const fullAddress = venue
    ? `${venue.address_line1}, ${venue.city}, ${venue.postcode}`
    : '22-24 Lower Church Road, Weston-super-Mare, BS23 2AG';

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center gap-6 overflow-hidden px-4 text-center">
        <Image
          src="/images/hero-bar.jpg"
          alt="The bar at The Regency, Weston-super-Mare"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-pub-bg/70 via-pub-bg/60 to-pub-bg" />
        <div className="relative flex flex-col items-center gap-6">
          <h1 className="max-w-3xl font-display text-6xl font-bold tracking-wide text-pub-gold-light drop-shadow-lg sm:text-7xl">
            The Regency
          </h1>
          <p className="font-display text-xl italic text-pub-gold drop-shadow">
            A proper local.
          </p>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-pub-cream/80">
            {fullAddress}
          </p>
          <p className="max-w-xl text-lg text-pub-cream/90 drop-shadow">
            Live bands, singers, karaoke, quiz nights, theme nights and sports screenings — Weston-super-Mare&apos;s
            home for a proper night out, every week.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/entertainment" className={buttonVariants({ size: 'lg' })}>
              See what&apos;s on
            </Link>
            <a href={`tel:${venue?.phone ?? '01934633406'}`} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Call us
            </a>
          </div>
        </div>
      </section>

      <TrustBadges />

      {/* Upcoming entertainment */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl font-bold text-pub-cream">Upcoming Entertainment</h2>
          <Link href="/entertainment" className="text-sm text-pub-gold hover:underline">
            View all →
          </Link>
        </div>
        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
                  categoryName: (event.event_categories as unknown as { name: string } | null)?.name,
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-pub-muted">New events coming soon — check back shortly.</p>
        )}
      </section>

      {/* A taste of the place */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 font-display text-3xl font-bold text-pub-cream">Inside The Regency</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { src: '/images/tap-closeup.jpg', alt: 'Close-up of a hand pump at the bar' },
            { src: '/images/free-beer-tomorrow.jpg', alt: "'Free beer tomorrow' sign above the bar" },
            { src: '/images/games-area.jpg', alt: 'Games area' },
            { src: '/images/pool-table.jpg', alt: 'Pool table room' },
          ].map((img) => (
            <div key={img.src} className="relative aspect-square overflow-hidden rounded-md bg-pub-surface2">
              <Image src={img.src} alt={img.alt} fill className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* Gallery preview */}
      {galleryPreview.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-3xl font-bold text-pub-cream">From our nights out</h2>
            <Link href="/gallery" className="text-sm text-pub-gold hover:underline">
              View gallery →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {galleryPreview.map((photo) => (
              <div key={photo.id} className="relative aspect-square overflow-hidden rounded-md bg-pub-surface2">
                {photo.url && (
                  <Image src={photo.url} alt={photo.caption ?? 'Gallery photo'} fill className="object-cover" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Opening hours + Find us */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-2xl font-bold text-pub-cream">Opening Hours</h2>
          <dl className="space-y-1 text-pub-muted">
            {Object.entries(venue?.opening_hours ?? {}).map(([day, hours]) => (
              <div key={day} className="flex justify-between border-b border-pub-wood-light/20 py-1.5 text-sm">
                <dt>{DAY_LABELS[day] ?? day}</dt>
                <dd>
                  {(hours as { open: string; close: string }).open} – {(hours as { open: string; close: string }).close}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="mb-4 font-display text-2xl font-bold text-pub-cream">Find Us</h2>
          <GoogleMap query={fullAddress} />
        </div>
      </section>

      {/* Register CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-24 text-center">
        <h2 className="font-display text-2xl font-bold text-pub-cream">Never miss a night out</h2>
        <p className="mt-2 text-pub-muted">
          Create a free account to get notified about new events, save your favourites, and share photos.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/register" className={buttonVariants({ size: 'lg' })}>
            Create free account
          </Link>
        </div>
      </section>
    </>
  );
}
