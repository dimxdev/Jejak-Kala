import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { Chapter } from '@/core/content/schema';
import { chapterStatus } from '@/core/progress/unlock';
import { timelineDomain } from '@/core/timeline';
import { useProgress } from '@/features/progress';
import { format, useT } from '@/i18n';
import { assetUrl } from '@/shared/assets';
import { chapters } from '@/shared/content/chapters';
import { Badge } from '@/shared/ui/Badge';
import { buttonClass } from '@/shared/ui/button';
import { YearChip } from '@/shared/ui/YearChip';
import { ChapterNode } from './ChapterNode';
import { TimeRuler } from './TimeRuler';

function ChapterPreview({ chapter }: { chapter: Chapter }) {
  const t = useT();
  const progress = useProgress();
  const status = chapterStatus(chapter, progress);
  const locked = status === 'locked';

  return (
    <section
      data-theme={chapter.theme}
      aria-live="polite"
      className="flex flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-sm sm:flex-row"
    >
      {chapter.banner && (
        <img
          src={assetUrl(chapter.banner)}
          alt=""
          aria-hidden="true"
          className="h-32 w-full object-cover sm:h-auto sm:w-48"
        />
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl">{chapter.title}</h2>
          <Badge tone={status === 'completed' ? 'good' : 'accent'}>{t.map.status[status]}</Badge>
        </div>
        <p className="text-sm text-muted">{chapter.tagline}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <YearChip years={[chapter.years]} place={chapter.region} />
            <span className="text-xs text-muted">
              {format(t.map.missionsCount, { count: chapter.missions.length })}
            </span>
          </div>
          {locked ? (
            <span aria-disabled="true" className={buttonClass('ghost')}>
              {t.map.status.locked}
            </span>
          ) : (
            <Link to={`/bab/${chapter.id}`} className={buttonClass()}>
              {t.map.enter}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function WorldMapPage() {
  const t = useT();
  const progress = useProgress();
  const [selectedId, setSelectedId] = useState<string | null>(chapters[0]?.id ?? null);
  const selected = chapters.find((chapter) => chapter.id === selectedId);
  const domain = useMemo(() => timelineDomain(chapters), []);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-3xl">{t.map.title}</h1>
        <p className="text-sm text-muted">{t.map.subtitle}</p>
      </header>

      <section
        aria-label={t.map.title}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-panel-2 shadow-sm"
      >
        <img
          src={assetUrl('shared/world-map')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
        {chapters.map((chapter) => (
          <ChapterNode
            key={chapter.id}
            chapter={chapter}
            status={chapterStatus(chapter, progress)}
            selected={chapter.id === selectedId}
            onSelect={() => setSelectedId(chapter.id)}
          />
        ))}
      </section>

      {selected ? (
        <ChapterPreview chapter={selected} />
      ) : (
        <p className="text-center text-sm text-muted">{t.map.hint}</p>
      )}

      <TimeRuler
        chapters={chapters}
        domain={domain}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </div>
  );
}
