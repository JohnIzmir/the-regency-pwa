export function GoogleMap({ query, className }: { query: string; className?: string }) {
  // No API key required — this is the free "maps embed via search" iframe
  // (google.com/maps?q=...&output=embed), sufficient for a "find us" map.
  // Swap to the Maps Embed API (needs NEXT_PUBLIC_GOOGLE_MAPS_KEY) for
  // richer styling if that's ever worth the billing setup.
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <iframe
      title="The Regency location"
      src={src}
      className={className ?? 'h-80 w-full rounded-lg border border-pub-wood-light/30'}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
