import type { YearSpec } from '@/core/content/schema';
import { formatYearStops } from '@/core/years';

interface YearChipProps {
  /** one or more stops in time; an empty list means "outside of time" */
  years: ReadonlyArray<Pick<YearSpec, 'start' | 'end' | 'approximate'>>;
  place?: string;
  /** shown when there are no years, e.g. "Di luar waktu" */
  emptyLabel?: string;
}

/** "Giza · ± 2560 SM": always tells the player where and when they are. */
export function YearChip({ years, place, emptyLabel }: YearChipProps) {
  const when = years.length > 0 ? formatYearStops(years) : emptyLabel;
  if (!place && !when) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
      {place && <span>{place}</span>}
      {place && when && <span aria-hidden="true">·</span>}
      {when && <span className="font-semibold tabular-nums text-accent">{when}</span>}
    </span>
  );
}
