import { createClient } from '@/lib/supabase/server';
import { EventForm } from '@/components/admin/EventForm';

export const metadata = { title: 'Add event | The Regency' };

export default async function NewEventPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from('event_categories').select('id, name').order('name');

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-pub-cream">Add event</h1>
      <EventForm mode="create" categories={categories ?? []} />
    </div>
  );
}
