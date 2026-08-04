'use client';

import { useCallback, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type Category = { slug: string; name: string };

export function EventFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          updateParam('q', q || null);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pub-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search entertainment…"
          className="pl-9"
        />
      </form>

      <Select
        value={searchParams.get('category') ?? ''}
        onChange={(e) => updateParam('category', e.target.value || null)}
        className="sm:w-56"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </Select>

      <label className="flex items-center gap-2 whitespace-nowrap text-sm text-pub-cream">
        <input
          type="checkbox"
          checked={searchParams.get('free') === 'true'}
          onChange={(e) => updateParam('free', e.target.checked ? 'true' : null)}
          className="h-4 w-4 rounded border-pub-wood-light"
        />
        Free entry only
      </label>

      {(searchParams.get('q') || searchParams.get('category') || searchParams.get('free')) && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Clear
        </Button>
      )}
    </div>
  );
}
