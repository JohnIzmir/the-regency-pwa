import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: event } = await supabase
    .from('events')
    .select('title, starts_at, genre')
    .eq('id', params.id)
    .single();

  const title = event?.title ?? 'The Regency';
  const dateLabel = event
    ? new Date(event.starts_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 64,
          background: 'linear-gradient(135deg, #14100d 0%, #1f3d2e 100%)',
          color: '#f2e8d8',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, color: '#c9a15a', letterSpacing: 4, textTransform: 'uppercase' }}>
          The Regency
        </div>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, marginTop: 16, maxWidth: 900 }}>{title}</div>
        {dateLabel && (
          <div style={{ display: 'flex', fontSize: 32, marginTop: 24, color: '#a89a86' }}>{dateLabel}</div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
