import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatEventDate, formatEventTime } from '@/lib/utils';

export type EventCardData = {
  id: string;
  title: string;
  slug: string;
  startsAt: string;
  imageUrl: string | null;
  isFreeEntry: boolean;
  isFeatured: boolean;
  ticketPrice: number | null;
  genre: string | null;
  categoryName?: string | null;
};

export function EventCard({ event }: { event: EventCardData }) {
  return (
    <Link href={`/entertainment/${event.slug}`}>
      <Card className="group h-full overflow-hidden transition-transform hover:-translate-y-1 hover:border-pub-gold">
        <div className="relative h-44 w-full bg-pub-surface2">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-pub-muted">No image yet</div>
          )}
          <div className="absolute left-2 top-2 flex gap-1.5">
            {event.isFeatured && <Badge>Featured</Badge>}
            {event.isFreeEntry && <Badge variant="secondary">Free Entry</Badge>}
          </div>
        </div>
        <div className="space-y-1 p-4">
          <p className="text-xs uppercase tracking-wide text-pub-gold">
            {event.categoryName ?? event.genre ?? 'Event'}
          </p>
          <h3 className="font-display text-lg font-semibold text-pub-cream group-hover:text-pub-gold-light">
            {event.title}
          </h3>
          <p className="text-sm text-pub-muted">
            {formatEventDate(event.startsAt)} · {formatEventTime(event.startsAt)}
          </p>
          {!event.isFreeEntry && event.ticketPrice && (
            <p className="text-sm text-pub-gold">£{event.ticketPrice.toFixed(2)}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
