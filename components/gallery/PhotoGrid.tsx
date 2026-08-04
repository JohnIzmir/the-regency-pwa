'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { Lightbox, type LightboxPhoto } from '@/components/gallery/Lightbox';

export function PhotoGrid({
  initialPhotos,
  initialCursor,
  sort,
}: {
  initialPhotos: LightboxPhoto[];
  initialCursor: string | null;
  sort: 'newest' | 'popular';
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    const params = new URLSearchParams({ cursor, sort });
    const res = await fetch(`/api/photos?${params.toString()}`);
    const data = await res.json();
    setPhotos((prev) => [...prev, ...(data.photos ?? [])]);
    setCursor(data.nextCursor ?? null);
    setLoading(false);
  }, [cursor, loading, sort]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (photos.length === 0) {
    return <p className="text-pub-muted">No photos yet — be the first to share one from a night out.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setActiveIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-md bg-pub-surface2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.caption ?? 'Gallery photo'}
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Heart className="h-3.5 w-3.5" />
              {photo.likeCount}
            </div>
          </button>
        ))}
      </div>

      <div ref={sentinelRef} className="h-10" />
      {loading && <p className="text-center text-xs text-pub-muted">Loading more…</p>}

      {activeIndex !== null && photos[activeIndex] && (
        <Lightbox
          photo={photos[activeIndex]}
          onClose={() => setActiveIndex(null)}
          onPrev={activeIndex > 0 ? () => setActiveIndex((i) => (i ?? 0) - 1) : undefined}
          onNext={activeIndex < photos.length - 1 ? () => setActiveIndex((i) => (i ?? 0) + 1) : undefined}
        />
      )}
    </>
  );
}
