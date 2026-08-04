'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { updateNotificationPreferences } from '@/lib/actions/notifications';
import type { Database } from '@/lib/supabase/types';

type Prefs = Database['public']['Tables']['notification_preferences']['Row'];

const TOGGLES: { key: keyof Prefs; label: string }[] = [
  { key: 'notify_new_event', label: 'New event added' },
  { key: 'notify_event_changed', label: 'Event date/time changed' },
  { key: 'notify_cancelled', label: 'Event cancelled' },
  { key: 'notify_featured', label: 'Featured event announced' },
  { key: 'notify_weekly_reminder', label: "Monday ‘what's on this week’ reminder" },
];

export function NotificationPreferencesForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);

  function toggle(key: keyof Prefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateNotificationPreferences({
      pushEnabled: prefs.push_enabled,
      emailEnabled: prefs.email_enabled,
      frequency: prefs.frequency,
      notifyNewEvent: prefs.notify_new_event,
      notifyEventChanged: prefs.notify_event_changed,
      notifyCancelled: prefs.notify_cancelled,
      notifyFeatured: prefs.notify_featured,
      notifyWeeklyReminder: prefs.notify_weekly_reminder,
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Preferences saved.');
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="frequency">How often should we notify you?</Label>
        <Select
          id="frequency"
          value={prefs.frequency}
          onChange={(e) => setPrefs((p) => ({ ...p, frequency: e.target.value as Prefs['frequency'] }))}
          className="max-w-xs"
        >
          <option value="immediate">Immediately</option>
          <option value="daily">Daily summary</option>
          <option value="weekly">Weekly summary</option>
          <option value="off">Don&apos;t notify me</option>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm text-pub-cream">
        <input
          type="checkbox"
          checked={prefs.email_enabled}
          onChange={() => toggle('email_enabled')}
          className="h-4 w-4 rounded border-pub-wood-light"
        />
        Also email me
      </label>

      <div>
        <p className="mb-2 text-sm font-medium text-pub-cream">What to notify me about</p>
        <div className="space-y-2">
          {TOGGLES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-pub-cream">
              <input
                type="checkbox"
                checked={Boolean(prefs[key])}
                onChange={() => toggle(key)}
                className="h-4 w-4 rounded border-pub-wood-light"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} isLoading={saving}>
        Save preferences
      </Button>
    </div>
  );
}
