import Image from 'next/image';
import { Star } from 'lucide-react';
import { getGoogleReviews } from '@/lib/google/places';

function StarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < rounded ? 'h-4 w-4 fill-pub-gold text-pub-gold' : 'h-4 w-4 text-pub-wood-light'}
        />
      ))}
    </div>
  );
}

/**
 * Live Google reviews, pulled server-side via the Places API — see
 * lib/google/places.ts for setup requirements. Renders nothing until
 * GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID are configured, so it's
 * safe to ship before that setup is finished.
 */
export async function GoogleReviews() {
  const data = await getGoogleReviews();
  if (!data || data.reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-pub-cream">What people say</h2>
          <div className="mt-2 flex items-center gap-2">
            <StarRow rating={data.rating} />
            <span className="text-sm text-pub-muted">
              {data.rating.toFixed(1)} · {data.userRatingCount} Google reviews
            </span>
          </div>
        </div>
        <a
          href={data.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-pub-gold hover:underline"
        >
          Read all our reviews on Google →
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {data.reviews.slice(0, 3).map((review) => (
          <div key={review.time} className="flex flex-col gap-3 rounded-lg border border-pub-wood-light/30 bg-pub-surface p-5">
            <div className="flex items-center gap-3">
              {review.profile_photo_url ? (
                <Image
                  src={review.profile_photo_url}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-pub-surface2" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-medium text-pub-cream">{review.author_name}</p>
                <p className="text-xs text-pub-muted">{review.relative_time_description}</p>
              </div>
            </div>
            <StarRow rating={review.rating} />
            <p className="line-clamp-5 text-sm text-pub-cream/90">{review.text}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-pub-muted">Reviews sourced from Google.</p>
    </section>
  );
}
