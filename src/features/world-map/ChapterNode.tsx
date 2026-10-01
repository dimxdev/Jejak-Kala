import type { Chapter } from '@/core/content/schema';
import type { ChapterStatus } from '@/core/progress/unlock';
import { formatYearRange } from '@/core/years';
import { useT } from '@/i18n';
import { CheckIcon, HourglassIcon, LockIcon } from '@/shared/ui/icons';

interface ChapterNodeProps {
  chapter: Chapter;
  status: ChapterStatus;
  selected: boolean;
  onSelect: () => void;
}

/** One chapter pinned on the world map. */
export function ChapterNode({ chapter, status, selected, onSelect }: ChapterNodeProps) {
  const t = useT();
  const { start, end, approximate } = chapter.years;
  const years = formatYearRange(start, end, approximate);
  const locked = status === 'locked';

  return (
    <button
      type="button"
      data-theme={chapter.theme}
      aria-pressed={selected}
      aria-label={`${chapter.title}, ${years}, ${t.map.status[status]}`}
      onClick={onSelect}
      className="absolute flex w-32 -translate-x-1/2 -translate-y-6 flex-col items-center gap-1.5"
      style={{ left: `${chapter.map.x}%`, top: `${chapter.map.y}%` }}
    >
      <span
        className={`relative grid size-12 place-items-center rounded-full border-2 shadow-lg transition ${
          locked
            ? 'border-line bg-panel text-muted'
            : 'border-panel bg-accent text-on-accent hover:brightness-110'
        } ${selected ? 'ring-4 ring-accent-soft/70' : ''}`}
      >
        {locked ? <LockIcon className="size-5" /> : <HourglassIcon className="size-6" />}
        {status === 'completed' && (
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-good text-on-accent">
            <CheckIcon className="size-3" />
          </span>
        )}
      </span>
      <span className="rounded-lg border border-line bg-panel/95 px-2 py-1 text-center text-xs leading-tight shadow">
        <span className="block font-semibold text-fg">{chapter.title}</span>
        <span className="block tabular-nums text-accent">{years}</span>
      </span>
    </button>
  );
}
