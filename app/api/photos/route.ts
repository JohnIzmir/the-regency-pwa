import { NextResponse, type NextRequest } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const PAGE_SIZE = 24;

/**
 * GET /api/photos?cursor=&sort=newest|popular&q=
 * Cursor-based pagination for the gallery's infinite scroll — the first
 * page is rendered server-side in app/(public)/gallery/page.tsx; this
 * route serves every page after that.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const sort = searchParams.get('sort') ?? 'newest';
  const q = searchParams.get('q');

  const supabase = createClient();
  let query = supabase
    .from('photos')
    .select('id, thumbnail_path, caption, uploaded_at, profiles(full_name)')
    .eq('status', 'approved')
    .limit(PAGE_SIZE);

  if (q) query = query.ilike('caption', `%${q}%`);

  if (sort === 'newest') {
    query = query.order('uploaded_at', { ascending: false });
    if (cursor) query = query.lt('uploaded_at', cursor);
  } else {
    // "popular" sort still needs a stable secondary key for cursor paging;
    // uploaded_at is used as the tiebreaker cursor.
    query = query.order('uploaded_at', { ascending: false });
    if (cursor) query = query.lt('uploaded_at', cursor);
  }

  const { data: photos, error } = await query;
  if (error) {
    return NextResponse.json({ error: { code: 'query_failed', message: 'Could not load photos.' } }, { status: 500 });
  }

  // gallery-photos is a private bucket (moderation queue lives here too),
  // so even approved photos are served through short-lived signed URLs
  // rather than a public bucket URL — same pattern as /admin/gallery.
  const serviceClient = createServiceRoleClient();
  const withUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const [{ data: signed }, { count: likeCount }] = await Promise.all([
        serviceClient.storage.from('gallery-photos').createSignedUrl(photo.thumbnail_path, 3600),
        supabase.from('photo_likes').select('id', { count: 'exact', head: true }).eq('photo_id', photo.id),
      ]);
      return {
        id: photo.id,
        caption: photo.caption,
        uploadedAt: photo.uploaded_at,
        uploaderName: (photo.profiles as unknown as { full_name: string } | null)?.full_name ?? 'Unknown',
        url: signed?.signedUrl ?? '',
        likeCount: likeCount ?? 0,
      };
    })
  );

  if (sort === 'popular') {
    withUrls.sort((a, b) => b.likeCount - a.likeCount);
  }

  const nextCursor = photos && photos.length === PAGE_SIZE ? photos[photos.length - 1]?.uploaded_at ?? null : null;

  return NextResponse.json({ photos: withUrls, nextCursor });
}
