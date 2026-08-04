'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { toggleLike } from '@/lib/actions/gallery';

export function LikeButton({ photoId, initialCount }: { photoId: string; initialCount: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  function handleClick() {
    // Optimistic update — reverted if the Server Action reports failure
    // (e.g. not signed in).
    setLiked((prev) => !prev);
    setCount((prev) => (liked ? prev - 1 : prev + 1));

    startTransition(async () => {
      const result = await toggleLike(photoId);
      if (!result.success) {
        setLiked((prev) => !prev);
        setCount((prev) => (liked ? prev + 1 : prev - 1));
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike this photo' : 'Like this photo'}
      className="flex items-center gap-1 text-sm text-pub-cream hover:text-pub-gold disabled:opacity-50"
    >
      <Heart className={cn('h-4 w-4', liked && 'fill-pub-gold text-pub-gold')} />
      {count}
    </button>
  );
}
