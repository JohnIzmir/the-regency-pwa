import { CalendarPlus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function AddToCalendarButton({ eventId }: { eventId: string }) {
  return (
    <a href={`/api/events/${eventId}/ics`} download className={buttonVariants({ variant: 'outline' })}>
      <CalendarPlus className="h-4 w-4" />
      Add to calendar
    </a>
  );
}
