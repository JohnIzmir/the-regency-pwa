'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { LikeButton } from '@/components/gallery/LikeButton';

export type LightboxPhoto = {
  id: string;
  url: string;
  caption: string | null;
  uploaderName: string;
  uploadedAt: string;
  likeCount: number;
};

export function Lightbox({
  photo,
  onClose,
  onPrev,
  onNext,
}: {
  photo: LightboxPhoto;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button onClick={onClose} className="absolute right-4 top-4 text-white hover:text-pub-gold" aria-label="Close">
        <X className="h-7 w-7" />
      </button>

      {onPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 text-white hover:text-pub-gold"
          aria-label="Previous"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      {onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 text-white hover:text-pub-gold"
          aria-label="Next"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      <div className="max-h-[85vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.caption ?? 'Gallery photo'} className="max-h-[75vh] w-full rounded-lg object-contain" />
        <div className="mt-3 flex items-center justify-between text-pub-cream">
          <div>
            {photo.caption && <p>{photo.caption}</p>}
            <p className="text-xs text-pub-muted">
              {photo.uploaderName} · {new Date(photo.uploadedAt).toLocaleDateString('en-GB')}
            </p>
          </div>
          <LikeButton photoId={photo.id} initialCount={photo.likeCount} />
        </div>
      </div>
    </div>
  );
}
