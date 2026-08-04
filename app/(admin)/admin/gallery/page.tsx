import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { PhotoModerationCard } from '@/components/admin/PhotoModerationCard';

export const metadata = { title: 'Photo moderation | The Regency' };

export default async function AdminGalleryPage() {
  const supabase = createClient();
  const { data: photos } = await supabase
    .from('photos')
    .select('id, thumbnail_path, caption, uploaded_at, profiles(full_name)')
    .eq('status', 'pending')
    .order('uploaded_at', { ascending: true });

  // Pending photos live in a private bucket until approved, so admins
  // view them via short-lived signed URLs generated with the
  // service-role client rather than a public URL.
  const serviceClient = createServiceRoleClient();
  const withUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await serviceClient.storage
        .from('gallery-photos')
        .createSignedUrl(photo.thumbnail_path, 3600);
      return { ...photo, signedUrl: data?.signedUrl ?? '' };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-pub-cream">Photo moderation</h1>
        <p className="text-sm text-pub-muted">
          {withUrls.length} photo{withUrls.length === 1 ? '' : 's'} waiting for review.
        </p>
      </div>

      {withUrls.length === 0 ? (
        <p className="text-pub-muted">Nothing to review right now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withUrls.map((photo) => (
            <PhotoModerationCard
              key={photo.id}
              photoId={photo.id}
              imageUrl={photo.signedUrl}
              caption={photo.caption}
              uploaderName={(photo.profiles as unknown as { full_name: string } | null)?.full_name ?? 'Unknown'}
              uploadedAt={photo.uploaded_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
