import { Link, type LoaderFunctionArgs, useLoaderData, useParams } from 'react-router';
import type { CodexEntry } from '@/core/codex/schema';
import { codexKey } from '@/core/progress/profile';
import { useProgressStore } from '@/features/progress';
import { useT } from '@/i18n';
import { assetUrl } from '@/shared/assets';
import { getChapter } from '@/shared/content/chapters';
import { loadCodex } from '@/shared/content/codex';
import { Badge } from '@/shared/ui/Badge';
import { buttonClass } from '@/shared/ui/button';
import { LockIcon } from '@/shared/ui/icons';
import { YearChip } from '@/shared/ui/YearChip';
import { CredibilityBadge } from './CredibilityBadge';

export interface CodexEntryLoaderData {
  entries: CodexEntry[];
}

export async function codexEntryLoader({
  params,
}: LoaderFunctionArgs): Promise<CodexEntryLoaderData> {
  const file = params.chapterId ? await loadCodex(params.chapterId) : null;
  return { entries: file?.entries ?? [] };
}

/** One Kodeks entry: the text, how sure history is about it, the pictures, and the sources. */
export function CodexEntryPage() {
  const t = useT();
  const { chapterId = '', entryId } = useParams();
  const { entries } = useLoaderData() as CodexEntryLoaderData;
  const unlocked = useProgressStore((s) => s.codex);
  const chapter = getChapter(chapterId);
  const entry = entries.find((e) => e.id === entryId);

  const back = (
    <Link to="/kodeks" className="text-sm text-muted hover:text-fg">
      ← {t.codex.back}
    </Link>
  );

  if (!chapter || !entry) {
    return (
      <div className="flex flex-col items-start gap-4">
        {back}
        <p>{t.codex.notFound}</p>
      </div>
    );
  }

  if (!unlocked.includes(codexKey(chapter.id, entry.id))) {
    return (
      <div className="flex flex-col items-start gap-3">
        {back}
        <p className="flex items-center gap-2 font-semibold">
          <LockIcon className="size-5" />
          {t.codex.locked}
        </p>
        <p className="text-sm text-muted">{t.codex.lockedHint}</p>
        <Link to={`/bab/${chapter.id}`} className={buttonClass('ghost')}>
          {chapter.title}
        </Link>
      </div>
    );
  }

  const related = entry.related
    .map((id) => entries.find((e) => e.id === id))
    .filter((e): e is CodexEntry => e !== undefined);

  return (
    <article data-theme={chapter.theme} className="flex flex-col gap-4">
      {back}

      <header className="flex flex-col gap-2">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            {t.codex.categories[entry.category]} · {chapter.title}
          </span>
          <CredibilityBadge credibility={entry.credibility} />
        </p>
        <h1 className="font-display text-3xl leading-tight">{entry.title}</h1>
        {entry.years.length > 0 && <YearChip years={entry.years} />}
        <p className="text-sm text-muted">
          {t.codex.credibilityTitle} {t.codex.credibilityHelp[entry.credibility]}
        </p>
      </header>

      {entry.images.length > 0 && (
        <div className={`grid gap-2 ${entry.images.length > 1 ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {entry.images.map((ref) => (
            <img
              key={ref}
              src={assetUrl(ref)}
              alt=""
              className={
                entry.images.length > 1
                  ? 'aspect-[4/3] w-full rounded-xl border border-line object-cover'
                  : 'mx-auto max-h-96 w-full rounded-2xl bg-panel object-contain p-1'
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 leading-relaxed">
        {entry.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {entry.verify && (
        <p className="rounded-xl bg-panel-2 px-3 py-2 text-sm text-muted">{t.codex.verifyNote}</p>
      )}

      {(entry.deep.length > 0 || entry.sources.length > 0) && (
        <details className="group rounded-2xl border border-line bg-panel p-4">
          <summary className="cursor-pointer font-display text-lg">{t.codex.deep}</summary>
          <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed">
            {entry.deep.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {entry.sources.length > 0 && (
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold">{t.codex.sources}</h2>
                <ul className="flex flex-col gap-1">
                  {entry.sources.map((source) => (
                    <li key={source.title} className="text-muted">
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="font-medium text-accent underline"
                        >
                          {source.title}
                        </a>
                      ) : (
                        <span className="font-medium">{source.title}</span>
                      )}
                      {source.note ? `: ${source.note}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      {related.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">{t.codex.related}</h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((other) => {
              const open = unlocked.includes(codexKey(chapter.id, other.id));
              return (
                <li key={other.id}>
                  {open ? (
                    <Link
                      to={`/kodeks/${chapter.id}/${other.id}`}
                      className="inline-flex min-h-9 items-center rounded-full border border-line bg-panel px-3 text-sm font-medium hover:border-accent"
                    >
                      {other.title}
                    </Link>
                  ) : (
                    <Badge>
                      <LockIcon className="mr-1 size-3" />
                      {t.codex.locked}
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
