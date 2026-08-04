import { describe, it, expect } from 'vitest';
import { SignUpSchema, SignInSchema } from '@/lib/validation/auth';
import { EventObjectSchema, EventSchema, RecurrenceRuleSchema } from '@/lib/validation/events';

describe('SignUpSchema', () => {
  const base = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  };

  it('accepts a valid signup', () => {
    expect(SignUpSchema.safeParse(base).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = SignUpSchema.safeParse({ ...base, confirmPassword: 'Different1' });
    expect(result.success).toBe(false);
  });

  it('rejects a weak password (no uppercase)', () => {
    const result = SignUpSchema.safeParse({ ...base, password: 'password123', confirmPassword: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = SignUpSchema.safeParse({ ...base, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('SignInSchema', () => {
  it('requires a non-empty password', () => {
    expect(SignInSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('EventSchema', () => {
  const validBase = {
    title: 'Quiz Night',
    categoryId: '11111111-1111-1111-1111-111111111111',
    startsAt: '2026-08-14T19:00:00.000Z',
    isFreeEntry: true,
  };

  it('accepts a minimal free-entry event', () => {
    const result = EventObjectSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('rejects a ticketed event with no price via the refined schema', () => {
    const result = EventSchema.safeParse({ ...validBase, isFreeEntry: false, ticketPrice: null });
    expect(result.success).toBe(false);
  });

  it('accepts a ticketed event with a positive price', () => {
    const result = EventSchema.safeParse({ ...validBase, isFreeEntry: false, ticketPrice: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects an end time before the start time', () => {
    const result = EventSchema.safeParse({
      ...validBase,
      endsAt: '2026-08-14T18:00:00.000Z', // before startsAt
    });
    expect(result.success).toBe(false);
  });

  it('rejects a title that is too short', () => {
    expect(EventObjectSchema.safeParse({ ...validBase, title: 'Hi' }).success).toBe(false);
  });
});

describe('RecurrenceRuleSchema', () => {
  it('accepts a valid weekly rule', () => {
    const result = RecurrenceRuleSchema.safeParse({
      freq: 'weekly',
      interval: 1,
      byweekday: ['thu'],
      occurrenceCount: 12,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty weekday list', () => {
    const result = RecurrenceRuleSchema.safeParse({
      freq: 'weekly',
      interval: 1,
      byweekday: [],
      occurrenceCount: 12,
    });
    expect(result.success).toBe(false);
  });
});
