import { Link, useParams } from 'react-router';
import {
  completedMissionCount,
  isExamUnlocked,
  missionsNeededForExam,
} from '@/core/progress/unlock';
import { useProgress, useProgressStore } from '@/features/progress';
import { format, useT } from '@/i18n';
import { assetUrl } from '@/shared/assets';
import { getChapter } from '@/shared/content/chapters';
import { hasMissionFile } from '@/shared/content/missions';
import { Badge } from '@/shared/ui/Badge';
import { buttonClass } from '@/shared/ui/button';
import { LockIcon } from '@/shared/ui/icons';
import { YearChip } from '@/shared/ui/YearChip';
import { MissionCard } from './MissionCard';
import { MissionStrip } from './MissionStrip';

export function ChapterPage() {
  const t = useT();
  const { chapterId } = useParams();
  const chapter = getChapter(chapterId);
  const progress = useProgress();
  const completeMission = useProgressStore((state) => state.completeMission);
  const reset = useProgressStore((state) => state.reset);

  if (!chapter) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>{t.chapter.notFound}</p>
        <Link to="/" className={buttonClass('ghost')}>
          {t.notFound.back}
        </Link>
      </div>
    );
  }

  const done = completedMissionCount(chapter, progress);
  const total = chapter.missions.length;
  const needed = missionsNeededForExam(chapter);
  const examOpen = isExamUnlocked(chapter, progress);

  return (
    <div data-theme={chapter.theme} className="flex flex-col gap-6">
      <nav>
        <Link to="/" className="text-sm text-muted hover:text-fg">
          ← {t.chapter.back}
        </Link>
      </nav>

      <header className="flex flex-col gap-3">
        {chapter.banner && (
          <img
            src={assetUrl(chapter.banner)}
            alt=""
            aria-hidden="true"
            className="h-40 w-full rounded-2xl border border-line object-cover shadow-sm sm:h-56"
          />
        )}
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-widest text-muted">{chapter.region}</p>
          <h1 className="font-display text-3xl">{chapter.title}</h1>
          <p className="text-muted">{chapter.tagline}</p>
          <YearChip years={[chapter.years]} />
        </div>
        <div className="flex items-center gap-3">
          <progress
            className="h-2 w-40 appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-accent-soft [&::-webkit-progress-bar]:bg-line [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-accent-soft"
            value={done}
            max={total}
          />
          <span className="text-xs text-muted">{format(t.chapter.progress, { done, total })}</span>
        </div>
      </header>

      <MissionStrip chapter={chapter} />

      <section aria-labelledby="missions-heading" className="flex flex-col gap-3">
        <h2 id="missions-heading" className="font-display text-xl">
          {t.chapter.missions}
        </h2>
        <ol className="flex flex-col gap-3">
          {chapter.missions.map((mission, i) => (
            <MissionCard
              key={mission.id}
              index={i + 1}
              chapterId={chapter.id}
              mission={mission}
              playable={hasMissionFile(mission.id)}
              stars={progress.missionStars[mission.id] ?? 0}
              onDevComplete={import.meta.env.DEV ? () => completeMission(mission.id, 3) : undefined}
            />
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="exam-heading"
        className={`flex flex-col gap-3 rounded-2xl border p-4 ${
          examOpen ? 'border-accent bg-panel-2' : 'border-line bg-panel'
        }`}
      >
        <div className="flex items-center gap-2">
          {!examOpen && <LockIcon className="size-4 text-muted" />}
          <h2 id="exam-heading" className="font-display text-xl">
            {t.chapter.exam}: {chapter.exam.title}
          </h2>
          <Badge tone={examOpen ? 'good' : 'neutral'}>{t.missionTypes.boss}</Badge>
        </div>
        <p className="text-sm text-muted">{chapter.exam.summary}</p>
        <YearChip
          years={chapter.exam.years}
          place={chapter.exam.place}
          emptyLabel={t.chapter.outsideTime}
        />
        <p className="text-sm font-semibold text-accent">
          {examOpen
            ? t.chapter.examOpen
            : format(t.chapter.examLocked, { needed, done: Math.min(done, needed) })}
        </p>
        <span aria-disabled="true" className={buttonClass(examOpen ? 'primary' : 'ghost')}>
          {t.chapter.comingSoon}
        </span>
      </section>

      {import.meta.env.DEV && (
        <button type="button" className={buttonClass('ghost')} onClick={reset}>
          {t.chapter.devReset}
        </button>
      )}
    </div>
  );
}
