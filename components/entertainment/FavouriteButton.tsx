'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { toggleFavourite } from '@/lib/actions/gallery';

export function FavouriteButton({ eventId, initiallyFavourited = false }: { eventId: string; initiallyFavourited?: boolean }) {
  const [favourited, setFavourited] = useState(initiallyFavourited);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFavourite(eventId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setFavourited(result.data.favourited);
      toast.success(result.data.favourited ? 'Saved to your favourites.' : 'Removed from favourites.');
    });
  }

  return (
    <Button variant="outline" onClick={handleClick} isLoading={isPending}>
      <Heart className={favourited ? 'h-4 w-4 fill-pub-gold text-pub-gold' : 'h-4 w-4'} />
      {favourited ? 'Favourited' : 'Add to favourites'}
    </Button>
  );
}
