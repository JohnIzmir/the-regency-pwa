'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { moderatePhoto } from '@/lib/actions/photos';

export function PhotoModerationCard({
  photoId,
  imageUrl,
  caption,
  uploaderName,
  uploadedAt,
}: {
  photoId: string;
  imageUrl: string;
  caption: string | null;
  uploaderName: string;
  uploadedAt: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  function approve() {
    startTransition(async () => {
      const result = await moderatePhoto({ photoId, decision: 'approved' });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Photo approved and now live in the gallery.');
      router.refresh();
    });
  }

  function reject() {
    if (!reason.trim()) {
      toast.error('Give a reason for the uploader.');
      return;
    }
    startTransition(async () => {
      const result = await moderatePhoto({ photoId, decision: 'rejected', rejectionReason: reason });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Photo rejected.');
      router.refresh();
    });
  }

  return (
    <Card>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={caption ?? 'Submitted photo'} className="h-48 w-full rounded-t-lg object-cover" />
      <CardContent className="space-y-3 pt-4">
        <div>
          <p className="text-sm font-medium text-pub-cream">{uploaderName}</p>
          <p className="text-xs text-pub-muted">{new Date(uploadedAt).toLocaleString('en-GB')}</p>
          {caption && <p className="mt-1 text-sm text-pub-cream">&ldquo;{caption}&rdquo;</p>}
        </div>

        {rejecting ? (
          <div className="space-y-2">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (shown internally, e.g. inappropriate, low quality)"
              className="h-9 w-full rounded-md border border-pub-wood-light bg-pub-surface2 px-2 text-xs text-pub-cream"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={reject} isLoading={isPending}>
                Confirm reject
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={approve} isLoading={isPending}>
              <Check className="h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRejecting(true)}>
              <X className="h-4 w-4" /> Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
