/**
 * Server-only fetch for The Regency's live Google Business rating and
 * reviews, via the Places API "Place Details" endpoint. Requires two
 * environment variables to be set (see .env.example / DEPLOYMENT.md):
 *
 *   GOOGLE_PLACES_API_KEY — an API key with the "Places API" enabled on
 *     a Google Cloud project with billing set up.
 *   GOOGLE_PLACE_ID — The Regency's Place ID, found via Google's Place
 *     ID Finder tool (developers.google.com/maps/documentation/places/web-service/place-id).
 *
 * Google only ever returns up to 5 reviews per place (their own "most
 * relevant" selection, not all reviews, and not something we can change),
 * and their terms require attributing content to Google rather than
 * presenting it as if collected independently — see the attribution line
 * rendered in GoogleReviews.tsx.
 *
 * Results are cached for 6 hours (Next.js fetch cache) since review
 * content doesn't change minute to minute and every call costs money
 * against the Google Cloud project's billing.
 */

export interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface GooglePlaceReviews {
  name: string;
  rating: number;
  userRatingCount: number;
  reviews: GoogleReview[];
  mapsUrl: string;
}

export async function getGoogleReviews(): Promise<GooglePlaceReviews | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,rating,user_ratings_total,reviews,url');
  url.searchParams.set('reviews_sort', 'newest');
  url.searchParams.set('key', apiKey);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 21600 } });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 'OK' || !data.result) return null;

    return {
      name: data.result.name,
      rating: data.result.rating ?? 0,
      userRatingCount: data.result.user_ratings_total ?? 0,
      reviews: (data.result.reviews ?? []) as GoogleReview[],
      mapsUrl: data.result.url ?? 'https://www.google.com/maps',
    };
  } catch {
    return null;
  }
}
