'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Copy, Archive, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { duplicateEvent, deleteEvent } from '@/lib/actions/events';

export function EventRowActions({ eventId, startsAt }: { eventId: string; startsAt: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [newDate, setNewDate] = useState(startsAt.slice(0, 16));

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicateEvent(eventId, new Date(newDate).toISOString());
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Duplicated as a draft.');
      setShowDuplicate(false);
      router.refresh();
    });
  }

  function handleArchive() {
    if (!confirm('Archive this event? It will disappear from the public site but history is kept.')) return;
    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Event archived.');
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {showDuplicate ? (
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="h-9 rounded-md border border-pub-wood-light bg-pub-surface2 px-2 text-xs text-pub-cream"
          />
          <Button size="sm" onClick={handleDuplicate} isLoading={isPending}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowDuplicate(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <Link href={`/admin/events/${eventId}/edit`} className="text-pub-muted hover:text-pub-gold" title="Edit">
            <Pencil className="h-4 w-4" />
          </Link>
          <button onClick={() => setShowDuplicate(true)} className="text-pub-muted hover:text-pub-gold" title="Duplicate">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={handleArchive} disabled={isPending} className="text-pub-muted hover:text-destructive" title="Archive">
            <Archive className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
