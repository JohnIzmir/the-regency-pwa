'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createPhotoRecord } from '@/lib/actions/gallery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB original, before client-side compression
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/** Resizes+re-encodes an image client-side via <canvas> — keeps a native
 * image library like `sharp` out of the server runtime entirely (see
 * lib/actions/gallery.ts for why). Returns a WebP Blob capped at
 * `maxWidth`, plus its final pixel dimensions. */
async function resizeToWebp(file: File, maxWidth: number, quality = 0.82): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Compression failed'))), 'image/webp', quality)
  );

  return { blob, width, height };
}

export function UploadDropzone() {
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleSelect(selected: File | undefined) {
    if (!selected) return;
    if (!ACCEPTED.includes(selected.type)) {
      toast.error('Use a JPEG, PNG, or WebP image.');
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      toast.error('Image must be under 10 MB.');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit() {
    if (!file) {
      toast.error('Choose a photo first.');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Sign in to upload photos.');
        return;
      }

      const [full, thumb] = await Promise.all([resizeToWebp(file, 2000, 0.85), resizeToWebp(file, 400, 0.8)]);

      const id = crypto.randomUUID();
      const fullPath = `${user.id}/${id}-full.webp`;
      const thumbPath = `${user.id}/${id}-thumb.webp`;

      const [{ error: fullError }, { error: thumbError }] = await Promise.all([
        supabase.storage.from('gallery-photos').upload(fullPath, full.blob, { contentType: 'image/webp' }),
        supabase.storage.from('gallery-photos').upload(thumbPath, thumb.blob, { contentType: 'image/webp' }),
      ]);

      if (fullError || thumbError) {
        toast.error('Upload failed. Try again.');
        return;
      }

      const result = await createPhotoRecord({
        storagePath: fullPath,
        thumbnailPath: thumbPath,
        caption: caption || null,
        width: full.width,
        height: full.height,
        fileSizeBytes: full.blob.size,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success('Uploaded! An admin will review it before it appears in the gallery.');
      setFile(null);
      setPreview(null);
      setCaption('');
      router.push('/gallery');
    } catch {
      toast.error('Something went wrong processing that image.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      {preview ? (
        <div className="relative overflow-hidden rounded-lg border border-pub-wood-light">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected" className="h-56 w-full object-cover" />
        </div>
      ) : (
        <label className="flex h-56 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-pub-wood-light bg-pub-surface2 text-pub-muted hover:border-pub-gold">
          <UploadCloud className="h-8 w-8" />
          <span className="text-sm">Click to choose a photo (max 10MB)</span>
          <input
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={(e) => handleSelect(e.target.files?.[0])}
          />
        </label>
      )}

      <div>
        <Label htmlFor="caption">Caption (optional)</Label>
        <Input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} />
      </div>

      <Button onClick={handleSubmit} isLoading={uploading} disabled={!file} className="w-full">
        Upload for review
      </Button>
      <p className="text-xs text-pub-muted">
        Photos are reviewed by an admin before appearing in the public gallery. Once approved, only staff
        can remove a photo.
      </p>
    </div>
  );
}
