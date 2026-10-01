import type { Chapter } from './content/schema';
import { compareYears } from './years';

/** All of history that the world map ruler covers by default (3500 SM to 2000 M). */
export const DEFAULT_TIMELINE: readonly [number, number] = [-3500, 2000];

/** The span the ruler shows: the default, widened in steps of 500 years if a chapter needs more room. */
export function timelineDomain(
  chapters: ReadonlyArray<Pick<Chapter, 'years'>>,
  [from, to]: readonly [number, number] = DEFAULT_TIMELINE,
): [number, number] {
  let start = from;
  let end = to;
  for (const { years } of chapters) {
    const first = years.start;
    const last = years.end ?? years.start;
    if (compareYears(first, start) < 0) start = Math.floor(first / 500) * 500;
    if (compareYears(last, end) > 0) end = Math.ceil(last / 500) * 500;
  }
  return [start, end];
}
