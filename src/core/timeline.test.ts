import { describe, expect, it } from 'vitest';
import { DEFAULT_TIMELINE, timelineDomain } from './timeline';

const span = (start: number, end?: number) => ({
  years: { start, end, approximate: false, verify: false },
});

describe('timelineDomain', () => {
  it('shows all of history by default', () => {
    expect(timelineDomain([span(-3100, -30)])).toEqual([...DEFAULT_TIMELINE]);
  });

  it('widens the ruler when a chapter starts earlier or ends later', () => {
    expect(timelineDomain([span(-4200, -3000)])[0]).toBe(-4500);
    expect(timelineDomain([span(1900, 2100)])[1]).toBe(2500);
  });

  it('does not shrink below the default', () => {
    expect(timelineDomain([])).toEqual([...DEFAULT_TIMELINE]);
  });
});
