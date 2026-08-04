'use client';

import { useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Label } from '@/components/ui/label';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploadField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError('Use a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be under 5 MB.');
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    setUploading(false);

    if (uploadError) {
      setError('Upload failed. Try again.');
      return;
    }

    const { data } = supabase.storage.from('event-images').getPublicUrl(path);
    onChange(data.publicUrl);
  }

  return (
    <div>
      <Label>Event image</Label>
      {value ? (
        <div className="relative w-full max-w-sm overflow-hidden rounded-md border border-pub-wood-light">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Event" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex h-40 w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-pub-wood-light bg-pub-surface2 text-pub-muted hover:border-pub-gold">
          <UploadCloud className="h-6 w-6" />
          <span className="text-sm">{uploading ? 'Uploading…' : 'Click to upload (max 5MB)'}</span>
          <input
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
