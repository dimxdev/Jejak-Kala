import { describe, expect, it } from 'vitest';
import { codexKey, MAX_NAME_LENGTH, normalizeName, ProfileSchema } from './profile';

describe('normalizeName', () => {
  it('trims and collapses spaces', () => {
    expect(normalizeName('  Dimas   B  ')).toBe('Dimas B');
    expect(normalizeName('\tSari\n')).toBe('Sari');
  });
});

describe('ProfileSchema', () => {
  it('accepts a name and a traveler', () => {
    const result = ProfileSchema.safeParse({ name: ' Sari ', traveler: 'b' });
    expect(result.success && result.data).toEqual({ name: 'Sari', traveler: 'b' });
  });

  it('refuses an empty or blank name', () => {
    expect(ProfileSchema.safeParse({ name: '   ', traveler: 'a' }).success).toBe(false);
    expect(ProfileSchema.safeParse({ name: '', traveler: 'a' }).success).toBe(false);
  });

  it('refuses a name that is too long', () => {
    expect(
      ProfileSchema.safeParse({ name: 'x'.repeat(MAX_NAME_LENGTH), traveler: 'a' }).success,
    ).toBe(true);
    expect(
      ProfileSchema.safeParse({ name: 'x'.repeat(MAX_NAME_LENGTH + 1), traveler: 'a' }).success,
    ).toBe(false);
  });

  it('refuses an unknown traveler', () => {
    expect(ProfileSchema.safeParse({ name: 'Sari', traveler: 'z' }).success).toBe(false);
  });
});

describe('codexKey', () => {
  it('namespaces an entry by its chapter', () => {
    expect(codexKey('mesir', 'nilometer')).toBe('mesir/nilometer');
  });
});
