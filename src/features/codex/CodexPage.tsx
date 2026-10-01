import { Link, useLoaderData } from 'react-router';
import type { CodexEntry, CodexFile } from '@/core/codex/schema';
import { codexKey } from '@/core/progress/profile';
import { useProgressStore } from '@/features/progress';
import { format, useT } from '@/i18n';
import { chapters } from '@/shared/content/chapters';
import { loadAllCodex } from '@/shared/content/codex';
import { LockIcon } from '@/shared/ui/icons';
import { YearChip } from '@/shared/ui/YearChip';
import { CredibilityBadge } from './CredibilityBadge';

export interface CodexLoaderData {
  codex: Record<string, CodexFile>;
}

export async function codexLoader(): Promise<CodexLoaderData> {
  return { codex: await loadAllCodex() };
}

/** The Kodeks: every entry of every chapter, found ones readable and the rest as locked cards. */
export function CodexPage() {
  const t = useT();
  const { codex } = useLoaderData() as CodexLoaderData;
  const unlocked = useProgressStore((s) => s.codex);

  const sections = chapters
    .map((chapter) => ({ chapter, entries: codex[chapter.id]?.entries ?? [] }))
    .filter((section) => section.entries.length > 0);
  const total = sections.reduce((n, s) => n + s.entries.length, 0);
  const found = sections.reduce(
    (n, s) => n + s.entries.filter((e) => unlocked.includes(codexKey(s.chapter.id, e.id))).length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl">{t.codex.title}</h1>
        <p className="text-sm text-muted">{t.codex.subtitle}</p>
        <p className="text-sm font-semibold text-accent" aria-live="polite">
          {format(t.codex.progress, { found, total })}
        </p>
      </header>

      {sections.map(({ chapter, entries }) => (
        <section key={chapter.id} data-theme={chapter.theme} className="flex flex-col gap-3">
          <h2 className="font-display text-xl">{chapter.title}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {entries.map((entry) => {
              const open = unlocked.includes(codexKey(chapter.id, entry.id));
              return (
                <li key={entry.id}>
                  {open ? <EntryCard chapterId={chapter.id} entry={entry} /> : <LockedCard />}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function EntryCard({ chapterId, entry }: { chapterId: string; entry: CodexEntry }) {
  const t = useT();
  return (
    <Link
      to={`/kodeks/${chapterId}/${entry.id}`}
      className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-panel p-3 shadow-sm transition hover:border-accent"
    >
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t.codex.categories[entry.category]}
        </span>
        <CredibilityBadge credibility={entry.credibility} />
      </span>
      <span className="font-display text-lg leading-snug">{entry.title}</span>
      <span className="line-clamp-3 text-sm text-muted">{entry.summary}</span>
      {entry.years.length > 0 && <YearChip years={entry.years} />}
    </Link>
  );
}

function LockedCard() {
  const t = useT();
  return (
    <div className="flex h-full min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line bg-panel-2/60 p-3 text-center text-muted">
      <LockIcon className="size-5" />
      <span className="text-sm font-semibold">{t.codex.locked}</span>
      <span className="text-xs">{t.codex.lockedHint}</span>
    </div>
  );
}
