'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths, isSameMonth, isSameDay, format,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ApiEvent = {
  id: string;
  title: string;
  slug: string;
  starts_at: string;
  is_featured: boolean;
  is_free_entry: boolean;
};

export function EventCalendarView() {
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const rangeStart = startOfWeek(startOfMonth(monthAnchor), { weekStartsOn: 1 });
  const rangeEnd = endOfWeek(endOfMonth(monthAnchor), { weekStartsOn: 1 });
  const days = useMemo(() => eachDayOfInterval({ start: rangeStart, end: rangeEnd }), [rangeStart, rangeEnd]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      from: rangeStart.toISOString(),
      to: rangeEnd.toISOString(),
    });
    fetch(`/api/events?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setEvents(data.events ?? []))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthAnchor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ApiEvent[]>();
    for (const event of events) {
      const key = format(new Date(event.starts_at), 'yyyy-MM-dd');
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return map;
  }, [events]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-pub-cream">{format(monthAnchor, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonthAnchor((d) => subMonths(d, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonthAnchor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setMonthAnchor((d) => addMonths(d, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-pub-wood-light/30 bg-pub-wood-light/20 text-xs">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="bg-pub-surface2 p-2 text-center font-semibold text-pub-muted">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn(
                'min-h-[92px] bg-pub-surface p-1.5',
                !isSameMonth(day, monthAnchor) && 'opacity-40',
                isSameDay(day, new Date()) && 'ring-1 ring-inset ring-pub-gold'
              )}
            >
              <p className="mb-1 text-right text-pub-muted">{format(day, 'd')}</p>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <Link
                    key={event.id}
                    href={`/entertainment/${event.slug}`}
                    className={cn(
                      'block truncate rounded px-1 py-0.5 text-[11px]',
                      event.is_featured ? 'bg-pub-gold text-pub-bg' : 'bg-pub-green text-pub-cream'
                    )}
                    title={event.title}
                  >
                    {event.title}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-pub-muted">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {loading && <p className="mt-2 text-xs text-pub-muted">Loading…</p>}
    </div>
  );
}
