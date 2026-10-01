import { Link } from 'react-router';
import type { Mission } from '@/core/content/schema';
import { format, useT } from '@/i18n';
import { Badge } from '@/shared/ui/Badge';
import { buttonClass } from '@/shared/ui/button';
import { CheckIcon, StarIcon } from '@/shared/ui/icons';
import { YearChip } from '@/shared/ui/YearChip';

interface MissionCardProps {
  index: number;
  chapterId: string;
  mission: Mission;
  /** the mission has a file and can be played; otherwise it is shown as "segera hadir" */
  playable: boolean;
  stars: number;
  /** only passed in development: marks the mission as finished so unlock rules can be tried out */
  onDevComplete?: () => void;
}

export function MissionCard({
  index,
  chapterId,
  mission,
  playable,
  stars,
  onDevComplete,
}: MissionCardProps) {
  const t = useT();
  const done = stars >= 1;
  const { perspective } = mission;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
            done ? 'bg-good text-on-accent' : 'bg-accent text-on-accent'
          }`}
        >
          {done ? <CheckIcon className="size-4" /> : index}
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="font-display text-lg leading-snug">{mission.title}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="accent">{t.missionTypes[mission.type]}</Badge>
            <Badge>{t.workload[mission.workload]}</Badge>
            {done && (
              <Badge tone="good">
                <StarIcon className="mr-1 size-3" />
                {format(t.chapter.stars, { count: stars })}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted">{mission.summary}</p>

      <div className="flex flex-col gap-1">
        <YearChip years={mission.years} place={mission.place} emptyLabel={t.chapter.outsideTime} />
        <span className="text-xs text-muted">
          {perspective.name}, {perspective.role}
          {perspective.fictional && ` (${t.chapter.fictional})`}
        </span>
      </div>

      {playable ? (
        <Link to={`/bab/${chapterId}/misi/${mission.id}`} className={buttonClass()}>
          {done ? t.chapter.replay : t.chapter.play}
        </Link>
      ) : onDevComplete ? (
        <button type="button" className={buttonClass('ghost')} onClick={onDevComplete}>
          {t.chapter.devComplete}
        </button>
      ) : (
        <span aria-disabled="true" className={buttonClass('ghost')}>
          {t.chapter.comingSoon}
        </span>
      )}
    </li>
  );
}
