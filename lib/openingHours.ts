// Postgres stores opening_hours as jsonb, which always returns object keys
// in alphabetical order (Fri, Mon, Sat, Sun, Thu, Tue, Wed) rather than the
// order they were written in. DAY_ORDER is the fixed Monday-first sequence
// every opening-hours listing on the site should iterate over instead of
// using Object.entries() directly on the jsonb value.
export const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export interface DayHours {
  open: string;
  close: string;
}

export function orderedHours(openingHours: Record<string, DayHours> | null | undefined) {
  return DAY_ORDER.filter((day) => openingHours?.[day]).map((day) => ({
    day,
    label: DAY_LABELS[day] ?? day,
    hours: openingHours![day]!,
  }));
}
