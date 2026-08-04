import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionProfile } from '@/lib/auth/session';
import { UploadDropzone } from '@/components/gallery/UploadDropzone';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Upload a photo | The Regency' };

export default async function GalleryUploadPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login?next=/gallery/upload');

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Share a photo</CardTitle>
          <CardDescription>Got a good one from quiz night or the live band? Share it here.</CardDescription>
        </CardHeader>
        <CardContent>
          <UploadDropzone />
        </CardContent>
      </Card>
    </main>
  );
}
