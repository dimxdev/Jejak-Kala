import type { Chapter } from '@/core/content/schema';
import { compareYears, formatYearStops } from '@/core/years';
import { useT } from '@/i18n';

/**
 * The chapter's timeline: every mission in the order it happened in history. Missions can be played
 * in any order, but the player always sees where each one sits in time.
 */
export function MissionStrip({ chapter }: { chapter: Chapter }) {
  const t = useT();
  const inTime = chapter.missions
    .filter((mission) => mission.years.length > 0)
    .sort((a, b) => compareYears(a.years[0]?.start ?? 1, b.years[0]?.start ?? 1));
  const stops = [
    ...inTime.map((mission) => ({
      id: mission.id,
      title: mission.title,
      when: formatYearStops(mission.years),
    })),
    { id: chapter.exam.id, title: chapter.exam.title, when: t.chapter.outsideTime },
  ];

  return (
    <section aria-label={t.chapter.strip}>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
        {t.chapter.strip}
      </h2>
      <ol className="flex gap-4 overflow-x-auto pb-2">
        {stops.map((stop) => (
          <li key={stop.id} className="flex min-w-28 flex-col gap-1 border-t-2 border-accent pt-2">
            <span className="text-xs font-semibold tabular-nums text-accent">{stop.when}</span>
            <span className="text-xs leading-tight text-muted">{stop.title}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
