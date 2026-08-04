'use client';

import { useEffect, useState } from 'react';

function getParts(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff <= 0,
  };
}

export function CountdownTimer({ startsAt }: { startsAt: string }) {
  const target = new Date(startsAt);
  const [parts, setParts] = useState(() => getParts(target));

  useEffect(() => {
    const id = setInterval(() => setParts(getParts(target)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startsAt]);

  if (parts.done) return null;

  return (
    <div className="flex gap-4 rounded-lg border border-pub-gold/40 bg-pub-surface2 px-4 py-3">
      {[
        { label: 'Days', value: parts.days },
        { label: 'Hrs', value: parts.hours },
        { label: 'Min', value: parts.minutes },
        { label: 'Sec', value: parts.seconds },
      ].map((p) => (
        <div key={p.label} className="text-center">
          <div className="font-display text-2xl font-bold text-pub-gold">{String(p.value).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase tracking-wide text-pub-muted">{p.label}</div>
        </div>
      ))}
    </div>
  );
}
