import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function escapeIcs(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function toIcsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/** GET /api/events/[id]/ics — downloadable "Add to Calendar" file. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: event } = await supabase
    .from('events')
    .select('id, title, description, starts_at, ends_at')
    .eq('id', params.id)
    .eq('status', 'published')
    .single();

  if (!event) {
    return NextResponse.json({ error: { code: 'not_found', message: 'Event not found.' } }, { status: 404 });
  }

  const { data: venue } = await supabase.from('venue_info').select('*').single();
  const location = venue
    ? `${venue.name}, ${venue.address_line1}, ${venue.city}, ${venue.postcode}`
    : 'The Regency';

  const dtEnd = event.ends_at ?? new Date(new Date(event.starts_at).getTime() + 3 * 60 * 60_000).toISOString();

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Regency//Entertainment//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@theregencyws.co.uk`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(event.starts_at)}`,
    `DTEND:${toIcsDate(dtEnd)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description ?? '')}`,
    `LOCATION:${escapeIcs(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, '-')}.ics"`,
    },
  });
}
