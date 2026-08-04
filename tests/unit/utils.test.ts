import { describe, it, expect } from 'vitest';
import { slugify, formatEventDate, formatEventTime, cn } from '@/lib/utils';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Live Band Night!')).toBe('live-band-night');
  });

  it('collapses repeated whitespace and hyphens', () => {
    expect(slugify('  Quiz   Night  ')).toBe('quiz-night');
  });

  it('strips punctuation', () => {
    expect(slugify("St. Patrick's Day Bash")).toBe('st-patricks-day-bash');
  });

  it('handles empty input', () => {
    expect(slugify('')).toBe('');
  });
});

describe('formatEventDate / formatEventTime', () => {
  it('formats an ISO date in en-GB long form', () => {
    const iso = '2026-08-14T19:30:00.000Z';
    expect(formatEventDate(iso)).toMatch(/\d{1,2} \w+/);
    expect(formatEventTime(iso)).toMatch(/\d{2}:\d{2}/);
  });
});

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-pub-gold', false && 'hidden', 'font-bold')).toBe('text-pub-gold font-bold');
  });
});
