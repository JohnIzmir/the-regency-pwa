import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { EventRowActions } from '@/components/admin/EventRowActions';
import { formatEventDate, formatEventTime } from '@/lib/utils';

export const metadata = { title: 'Manage events | The Regency' };

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'muted' | 'destructive'> = {
  draft: 'muted',
  published: 'secondary',
  cancelled: 'destructive',
  archived: 'muted',
};

export default async function AdminEventsPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from('events')
    .select('id, title, starts_at, status, is_featured, is_free_entry, ticket_price, event_categories(name)')
    .order('starts_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-pub-cream">Events</h1>
        <Link href="/admin/events/new" className={buttonVariants()}>
          + Add event
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-pub-wood-light/30">
        <table className="w-full text-left text-sm">
          <thead className="bg-pub-surface2 text-xs uppercase tracking-wide text-pub-muted">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((event) => (
              <tr key={event.id} className="border-t border-pub-wood-light/20 hover:bg-pub-surface2/50">
                <td className="px-4 py-3 font-medium text-pub-cream">
                  {event.title}
                  {event.is_featured && (
                    <Badge variant="default" className="ml-2">
                      Featured
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-pub-muted">
                  {(event.event_categories as unknown as { name: string } | null)?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-pub-muted">
                  {formatEventDate(event.starts_at)} · {formatEventTime(event.starts_at)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[event.status] ?? 'muted'}>{event.status}</Badge>
                </td>
                <td className="px-4 py-3 text-pub-muted">
                  {event.is_free_entry ? 'Free' : event.ticket_price ? `£${event.ticket_price}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <EventRowActions eventId={event.id} startsAt={event.starts_at} />
                </td>
              </tr>
            ))}
            {(!events || events.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-pub-muted">
                  No events yet. Add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
