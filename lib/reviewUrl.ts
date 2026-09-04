/**
 * Where the "Leave us a review" buttons link to.
 *
 * Set NEXT_PUBLIC_GOOGLE_REVIEW_URL to your Business Profile's "Get more
 * reviews" short link (business.google.com → your listing → Get more
 * reviews) once you have it — that takes customers straight to the review
 * box in one tap. Until then this falls back to a plain Google Maps
 * search for the pub, which works with no setup but lands the customer
 * on the listing page rather than the review box directly.
 */
export function getReviewUrl(venue: { address_line1?: string; city?: string; postcode?: string } | null) {
  if (process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL) return process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL;
  const query = `The Regency, ${venue?.address_line1 ?? '22-24 Lower Church Road'}, ${venue?.city ?? 'Weston-super-Mare'}, ${venue?.postcode ?? 'BS23 2AG'}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
