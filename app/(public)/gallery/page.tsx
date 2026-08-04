import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { PhotoGrid } from '@/components/gallery/PhotoGrid';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Photo Gallery | The Regency' };

const PAGE_SIZE = 24;

export const revalidate = 60;

export default async function GalleryPage({ searchParams }: { searchParams: { sort?: string } }) {
  const sort = searchParams.sort === 'popular' ? 'popular' : 'newest';
  const supabase = createClient();

  const { data: photos } = await supabase
    .from('photos')
    .select('id, thumbnail_path, caption, uploaded_at, profiles!uploader_id(full_name)')
    .eq('status', 'approved')
    .order('uploaded_at', { ascending: false })
    .limit(PAGE_SIZE);

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

  if (sort === 'popular') withUrls.sort((a, b) => b.likeCount - a.likeCount);
  const nextCursor = photos && photos.length === PAGE_SIZE ? photos[photos.length - 1]?.uploaded_at ?? null : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-pub-gold">Gallery</p>
          <h1 className="font-display text-3xl font-bold text-pub-cream">From our nights out</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 rounded-md border border-pub-wood-light/40 p-1 text-sm">
            <Link href="/gallery?sort=newest" className={sort === 'newest' ? 'rounded bg-pub-gold px-3 py-1.5 text-pub-bg' : 'px-3 py-1.5 text-pub-cream'}>
              Newest
            </Link>
            <Link href="/gallery?sort=popular" className={sort === 'popular' ? 'rounded bg-pub-gold px-3 py-1.5 text-pub-bg' : 'px-3 py-1.5 text-pub-cream'}>
              Popular
            </Link>
          </div>
          <Link href="/gallery/upload" className={buttonVariants()}>
            Upload a photo
          </Link>
        </div>
      </div>

      <PhotoGrid initialPhotos={withUrls} initialCursor={nextCursor} sort={sort} />
    </main>
  );
}
