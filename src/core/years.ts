// Years are signed integers: negative = SM (sebelum Masehi), positive = M (Masehi).
// There is no year 0 in the historical calendar, so 0 is rejected.
//
// Pure helpers only: this folder must not import React, Phaser or the DOM,
// and uses relative imports so scripts in tools/ can import it directly.

export function isValidYear(year: number): boolean {
  return Number.isInteger(year) && year !== 0;
}

/** Astronomical numbering has a year 0 (= 1 SM), which makes distances easy to compute. */
export function toAstronomical(year: number): number {
  return year < 0 ? year + 1 : year;
}

/** The opposite of toAstronomical: 0 -> 1 SM (-1), -1 -> 2 SM (-2), 5 -> 5 M. */
export function fromAstronomical(astronomical: number): number {
  return astronomical <= 0 ? astronomical - 1 : astronomical;
}

/**
 * The year a fraction `t` (0 to 1) of the way from `from` to `to`, counted on the real time line (so it
 * passes from 1 SM straight to 1 M). Used by the Lensa Waktu animation.
 */
export function interpolateYear(from: number, to: number, t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  const start = toAstronomical(from);
  const end = toAstronomical(to);
  return fromAstronomical(Math.round(start + (end - start) * clamped));
}

export function compareYears(a: number, b: number): number {
  return toAstronomical(a) - toAstronomical(b);
}

/** Number of years from `from` to `to`, skipping the missing year 0. */
export function yearsBetween(from: number, to: number): number {
  return toAstronomical(to) - toAstronomical(from);
}

/** `-2560` -> "2560 SM", `1822` -> "1822 M". With `approximate`: "± 2560 SM". */
export function formatYear(year: number, approximate = false): string {
  const era = year < 0 ? 'SM' : 'M';
  const text = `${Math.abs(year)} ${era}`;
  return approximate ? `± ${text}` : text;
}

/**
 * "± 3100 – 30 SM" for a range in one era, "30 SM – 14 M" across eras.
 * The era is written once when both ends share it.
 */
export function formatYearRange(start: number, end?: number, approximate = false): string {
  if (end === undefined || end === start) return formatYear(start, approximate);
  const prefix = approximate ? '± ' : '';
  if (start < 0 === end < 0) {
    const era = end < 0 ? 'SM' : 'M';
    return `${prefix}${Math.abs(start)} – ${Math.abs(end)} ${era}`;
  }
  return `${prefix}${formatYear(start)} – ${formatYear(end)}`;
}

/** Several stops in time, e.g. a mission that jumps from 196 SM to 1822 M. */
export function formatYearStops(
  stops: ReadonlyArray<{ start: number; end?: number; approximate?: boolean }>,
): string {
  return stops.map((s) => formatYearRange(s.start, s.end, s.approximate)).join(' → ');
}

/**
 * Round-number years between two years for a ruler, e.g. 3000 SM, 2500 SM, ... 500 SM, 1 M, 500 M.
 * The multiple "0" is shown as year 1 M because there is no year 0.
 */
export function rulerTicks(start: number, end: number, step: number): number[] {
  const ticks: number[] = [];
  for (let k = Math.ceil(start / step); k <= Math.floor(end / step); k++) {
    ticks.push(k === 0 ? 1 : k * step);
  }
  return ticks.filter((year) => compareYears(year, start) >= 0 && compareYears(year, end) <= 0);
}
