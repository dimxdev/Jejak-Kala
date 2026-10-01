import type { Chapter } from '@/core/content/schema';
import { formatYear, rulerTicks, yearsBetween } from '@/core/years';
import { useT } from '@/i18n';

const PX_PER_YEAR = 0.14;
const TICK_STEP = 500;

interface TimeRulerProps {
  chapters: readonly Chapter[];
  /** first and last year shown */
  domain: readonly [number, number];
  selectedId: string | null;
  onSelect: (chapterId: string) => void;
}

/** A scrollable ruler of years. Each chapter is a bar covering the years it spans. */
export function TimeRuler({ chapters, domain, selectedId, onSelect }: TimeRulerProps) {
  const t = useT();
  const [start, end] = domain;
  const x = (year: number) => yearsBetween(start, year) * PX_PER_YEAR;

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-panel py-4 shadow-sm">
      <div className="relative mx-6 h-[5.25rem]" style={{ width: `${Math.ceil(x(end))}px` }}>
        <div className="absolute inset-x-0 top-11 h-px bg-line" />

        {rulerTicks(start, end, TICK_STEP).map((year) => (
          <div key={year} className="absolute top-11" style={{ left: `${x(year)}px` }}>
            <div className="h-2 w-px bg-line" />
            <div className="-translate-x-1/2 whitespace-nowrap pt-1 text-[10px] tabular-nums text-muted">
              {formatYear(year)}
            </div>
          </div>
        ))}

        {chapters.map((chapter) => {
          const left = x(chapter.years.start);
          const right = x(chapter.years.end ?? chapter.years.start);
          const selected = chapter.id === selectedId;
          return (
            <button
              key={chapter.id}
              type="button"
              data-theme={chapter.theme}
              aria-pressed={selected}
              aria-label={`${t.map.ruler}: ${chapter.title}`}
              onClick={() => onSelect(chapter.id)}
              className="absolute top-0 flex flex-col items-start gap-1 text-left"
              style={{ left: `${left}px`, width: `${Math.max(12, right - left)}px` }}
            >
              <span className="whitespace-nowrap text-xs font-semibold text-fg">
                {chapter.title}
              </span>
              <span
                className={`block h-3 w-full rounded-full bg-accent-soft ${selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-panel' : 'opacity-80'}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
