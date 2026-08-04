'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { createEvent, updateEvent } from '@/lib/actions/events';
import type { EventInput } from '@/lib/validation/events';

type Category = { id: string; name: string };

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  genre: string;
  imageUrl: string | null;
  startsAt: string; // datetime-local string, e.g. 2026-08-14T20:00
  endsAt: string;
  ticketPrice: string;
  isFreeEntry: boolean;
  isFeatured: boolean;
  status: EventInput['status'];
  notifySubscribers: boolean;
};

function toLocalInputValue(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  mode,
  categories,
  eventId,
  defaultValues,
}: {
  mode: 'create' | 'edit';
  categories: Category[];
  eventId?: string;
  defaultValues?: Partial<FormState>;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: defaultValues?.title ?? '',
    description: defaultValues?.description ?? '',
    categoryId: defaultValues?.categoryId ?? categories[0]?.id ?? '',
    genre: defaultValues?.genre ?? '',
    imageUrl: defaultValues?.imageUrl ?? null,
    startsAt: defaultValues?.startsAt ?? '',
    endsAt: defaultValues?.endsAt ?? '',
    ticketPrice: defaultValues?.ticketPrice ?? '',
    isFreeEntry: defaultValues?.isFreeEntry ?? true,
    isFeatured: defaultValues?.isFeatured ?? false,
    status: defaultValues?.status ?? 'draft',
    notifySubscribers: defaultValues?.notifySubscribers ?? true,
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || !form.categoryId || !form.startsAt) {
      toast.error('Title, category, and start date/time are required.');
      return;
    }

    const payload: EventInput = {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId,
      genre: form.genre || null,
      imageUrl: form.imageUrl,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      ticketPrice: form.ticketPrice ? Number(form.ticketPrice) : null,
      isFreeEntry: form.isFreeEntry,
      isFeatured: form.isFeatured,
      status: form.status,
      notifySubscribers: form.notifySubscribers,
    };

    setSubmitting(true);
    const result =
      mode === 'create' ? await createEvent(payload) : await updateEvent(eventId!, payload);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(mode === 'create' ? 'Event created.' : 'Event updated.');
    router.push('/admin/events');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <Label htmlFor="title">Event title</Label>
        <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="genre">Genre (optional)</Label>
          <Input id="genre" placeholder="e.g. Classic Rock, 80s" value={form.genre} onChange={(e) => set('genre', e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>

      <ImageUploadField value={form.imageUrl} onChange={(url) => set('imageUrl', url)} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startsAt">Starts</Label>
          <Input
            id="startsAt"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => set('startsAt', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="endsAt">Ends (optional)</Label>
          <Input id="endsAt" type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isFreeEntry}
              onChange={(e) => set('isFreeEntry', e.target.checked)}
              className="h-4 w-4 rounded border-pub-wood-light"
            />
            Free entry
          </Label>
        </div>
        {!form.isFreeEntry && (
          <div>
            <Label htmlFor="ticketPrice">Ticket price (£)</Label>
            <Input
              id="ticketPrice"
              type="number"
              min={0}
              step={0.5}
              value={form.ticketPrice}
              onChange={(e) => set('ticketPrice', e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => set('isFeatured', e.target.checked)}
            className="h-4 w-4 rounded border-pub-wood-light"
          />
          Featured event
        </Label>
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.notifySubscribers}
            onChange={(e) => set('notifySubscribers', e.target.checked)}
            className="h-4 w-4 rounded border-pub-wood-light"
          />
          Notify subscribers
        </Label>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select id="status" value={form.status} onChange={(e) => set('status', e.target.value as FormState['status'])}>
          <option value="draft">Draft (preview only, not public)</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" isLoading={submitting}>
          {mode === 'create' ? 'Create event' : 'Save changes'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/events')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
