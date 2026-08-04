import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/events?from=&to=&category=&featured=&q=&free=
 * Backs the client-side calendar month navigation and search/filter
 * controls on /entertainment — everything else on that page is fetched
 * directly in the Server Component on first load.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');
  const q = searchParams.get('q');
  const free = searchParams.get('free');

  const supabase = createClient();

  // `category` arrives as a slug (nice URLs); resolve it to the FK id
  // events.category_id actually stores, rather than trying to filter
  // through the embedded event_categories join (PostgREST only supports
  // filtering an embedded resource when it's an inner join, which would
  // also exclude events whose category lookup fails).
  let categoryId: string | null = null;
  if (category) {
    const { data: categoryRow } = await supabase
      .from('event_categories')
      .select('id')
      .eq('slug', category)
      .maybeSingle();
    categoryId = categoryRow?.id ?? null;
  }

  let query = supabase
    .from('events')
    .select('id, title, slug, starts_at, ends_at, image_url, is_free_entry, is_featured, ticket_price, genre, event_categories(name, slug)')
    .eq('status', 'published')
    .order('starts_at', { ascending: true })
    .limit(200);

  if (from) query = query.gte('starts_at', from);
  if (to) query = query.lte('starts_at', to);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (featured === 'true') query = query.eq('is_featured', true);
  if (free === 'true') query = query.eq('is_free_entry', true);
  if (q) query = query.ilike('title', `%${q}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: { code: 'query_failed', message: 'Could not load events.' } }, { status: 500 });
  }

  return NextResponse.json({ events: data });
}
