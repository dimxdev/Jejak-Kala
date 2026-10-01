import { describe, expect, it } from 'vitest';
import {
  compareYears,
  formatYear,
  formatYearRange,
  formatYearStops,
  fromAstronomical,
  interpolateYear,
  isValidYear,
  rulerTicks,
  toAstronomical,
  yearsBetween,
} from './years';

describe('fromAstronomical', () => {
  it('undoes toAstronomical for every year except the missing year 0', () => {
    for (const year of [-3100, -2560, -196, -1, 1, 14, 1822, 2026]) {
      expect(fromAstronomical(toAstronomical(year))).toBe(year);
    }
  });

  it('maps astronomical 0 to 1 SM', () => {
    expect(fromAstronomical(0)).toBe(-1);
  });
});

describe('interpolateYear', () => {
  it('starts at the first year and ends at the second', () => {
    expect(interpolateYear(2026, -2500, 0)).toBe(2026);
    expect(interpolateYear(2026, -2500, 1)).toBe(-2500);
  });

  it('never produces the year 0', () => {
    for (let t = 0; t <= 1; t += 0.001) expect(interpolateYear(2026, -2500, t)).not.toBe(0);
  });

  it('goes from 1 SM straight to 1 M when it crosses the era', () => {
    const years = new Set<number>();
    for (let t = 0; t <= 1; t += 0.0001) years.add(interpolateYear(5, -5, t));
    expect(years.has(-1)).toBe(true);
    expect(years.has(1)).toBe(true);
    expect(years.has(0)).toBe(false);
  });

  it('clamps t outside 0 to 1', () => {
    expect(interpolateYear(1000, 2000, -3)).toBe(1000);
    expect(interpolateYear(1000, 2000, 7)).toBe(2000);
  });
});

describe('formatYear', () => {
  it('writes SM for negative years and M for positive years', () => {
    expect(formatYear(-2560)).toBe('2560 SM');
    expect(formatYear(1822)).toBe('1822 M');
  });

  it('marks approximate years with ±', () => {
    expect(formatYear(-2560, true)).toBe('± 2560 SM');
  });
});

describe('formatYearRange', () => {
  it('writes the era once when both ends share it', () => {
    expect(formatYearRange(-3100, -30, true)).toBe('± 3100 – 30 SM');
    expect(formatYearRange(1066, 1450)).toBe('1066 – 1450 M');
  });

  it('writes both eras when the range crosses the year 1', () => {
    expect(formatYearRange(-30, 14)).toBe('30 SM – 14 M');
  });

  it('falls back to a single year when there is no end', () => {
    expect(formatYearRange(-196)).toBe('196 SM');
    expect(formatYearRange(-196, -196)).toBe('196 SM');
  });
});

describe('formatYearStops', () => {
  it('joins the stops of a mission that travels through time', () => {
    expect(formatYearStops([{ start: -196 }, { start: 1822 }])).toBe('196 SM → 1822 M');
  });
});

describe('year arithmetic', () => {
  it('rejects the non-existent year 0 and non-integers', () => {
    expect(isValidYear(0)).toBe(false);
    expect(isValidYear(1.5)).toBe(false);
    expect(isValidYear(-1)).toBe(true);
  });

  it('skips year 0 when counting', () => {
    expect(toAstronomical(-1)).toBe(0);
    expect(yearsBetween(-1, 1)).toBe(1);
    expect(yearsBetween(-3100, -30)).toBe(3070);
  });

  it('orders SM before M and earlier before later', () => {
    expect(compareYears(-2560, -30)).toBeLessThan(0);
    expect(compareYears(-1, 1)).toBeLessThan(0);
    expect(compareYears(1822, 1066)).toBeGreaterThan(0);
  });
});

describe('rulerTicks', () => {
  it('produces round-number years and shows the missing year 0 as 1 M', () => {
    expect(rulerTicks(-1500, 1000, 500)).toEqual([-1500, -1000, -500, 1, 500, 1000]);
  });

  it('stays inside the requested range', () => {
    expect(rulerTicks(-3100, -30, 1000)).toEqual([-3000, -2000, -1000]);
  });
});
