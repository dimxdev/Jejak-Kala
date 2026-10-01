import { Suspense, useEffect, useMemo, useState } from 'react';
import { Link, type LoaderFunctionArgs, useLoaderData, useNavigate, useParams } from 'react-router';
import type { CodexEntry } from '@/core/codex/schema';
import type { Chapter } from '@/core/content/schema';
import type { MissionContent } from '@/core/missions/schema';
import { codexKey, DEFAULT_PLAYER_NAME } from '@/core/progress/profile';
import type { Scene } from '@/core/story/schema';
import { type Mode, useProgressStore } from '@/features/progress';
import { format, useT } from '@/i18n';
import { preloadImages } from '@/shared/assets';
import { getChapter } from '@/shared/content/chapters';
import { characters } from '@/shared/content/characters';
import { loadCodex } from '@/shared/content/codex';
import { loadMission } from '@/shared/content/missions';
import { Badge } from '@/shared/ui/Badge';
import { buttonClass } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { CloseIcon } from '@/shared/ui/icons';
import { ScenePlayer } from '@/shared/ui/ScenePlayer';
import { Stars } from '@/shared/ui/Stars';
import { YearChip } from '@/shared/ui/YearChip';
import { YearRoller } from '@/shared/ui/YearRoller';
import { BonusQuiz } from './BonusQuiz';
import { EngineView } from './EngineView';
import type { EngineResult } from './types';

export interface MissionLoaderData {
  mission: MissionContent | null;
}

/** Route loader: the mission file is fetched before the page opens. */
export async function missionLoader({ params }: LoaderFunctionArgs): Promise<MissionLoaderData> {
  return { mission: params.missionId ? await loadMission(params.missionId) : null };
}

type Phase = 'lens' | 'intro' | 'mode' | 'play' | 'outro' | 'bonus' | 'result';

export function MissionPage() {
  const t = useT();
  const { chapterId, missionId } = useParams();
  const { mission } = useLoaderData() as MissionLoaderData;
  const chapter = getChapter(chapterId);
  const meta = chapter?.missions.find((m) => m.id === missionId);

  if (!chapter || !meta || !mission) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start gap-4 px-4 py-8">
        <p>{t.mission.notFound}</p>
        <Link to={chapter ? `/bab/${chapter.id}` : '/'} className={buttonClass('ghost')}>
          {t.mission.back}
        </Link>
      </main>
    );
  }
  return <MissionRun chapter={chapter} meta={meta} mission={mission} />;
}

interface MissionRunProps {
  chapter: Chapter;
  meta: Chapter['missions'][number];
  mission: MissionContent;
}

/** The host of a mission: everything around the engine (arrival, story, mode, ending, rewards). */
function MissionRun({ chapter, meta, mission }: MissionRunProps) {
  const t = useT();
  const navigate = useNavigate();
  const mode = useProgressStore((s) => s.mode);
  const setMode = useProgressStore((s) => s.setMode);
  const codexUnlocked = useProgressStore((s) => s.codex);
  const completeMission = useProgressStore((s) => s.completeMission);
  const unlockCodex = useProgressStore((s) => s.unlockCodex);

  const [phase, setPhase] = useState<Phase>('lens');
  const [attempt, setAttempt] = useState(0);
  const [stars, setStars] = useState<1 | 2 | 3>(1);
  const [fresh, setFresh] = useState<string[]>([]);
  const [bonusPassed, setBonusPassed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [entries, setEntries] = useState<CodexEntry[]>([]);

  // load the pictures of the story while the player is still on the first screens
  useEffect(() => {
    const refs = new Set<string>();
    const scenes: Scene[] = [
      mission.intro,
      mission.outro.one,
      mission.outro.two,
      mission.outro.three,
      ...Object.values(mission.scenes),
    ];
    for (const scene of scenes) {
      if (scene.background) refs.add(scene.background);
      for (const line of scene.lines) {
        const portrait = characters[line.who]?.portraits[line.mood];
        if (portrait) refs.add(portrait);
      }
    }
    preloadImages(refs);
  }, [mission]);

  // the Kodeks texts are needed to name the rewards on the result screen
  useEffect(() => {
    let cancelled = false;
    loadCodex(chapter.id).then((file) => {
      if (!cancelled && file) setEntries(file.entries);
    });
    return () => {
      cancelled = true;
    };
  }, [chapter.id]);

  const outro = useMemo(
    () => (stars === 3 ? mission.outro.three : stars === 2 ? mission.outro.two : mission.outro.one),
    [mission, stars],
  );

  const finish = ({ stars: earned, bonus = false }: EngineResult) => {
    const keys = mission.codex.map((id) => codexKey(chapter.id, id));
    // a bonus solved inside the engine earns the bonus entries right away
    const bonusKeys = bonus ? mission.bonusCodex.map((id) => codexKey(chapter.id, id)) : [];
    const all = [...keys, ...bonusKeys];
    setFresh(all.filter((key) => !codexUnlocked.includes(key)));
    completeMission(mission.id, earned);
    unlockCodex(all);
    setStars(earned);
    setBonusPassed(bonus);
    setPhase('outro');
  };

  const afterOutro = () => setPhase(mission.bonusQuiz ? 'bonus' : 'result');

  const finishBonus = ({ passed }: { passed: boolean }) => {
    if (passed) {
      const keys = mission.bonusCodex.map((id) => codexKey(chapter.id, id));
      setFresh((current) => [...current, ...keys.filter((key) => !codexUnlocked.includes(key))]);
      unlockCodex(keys);
      setBonusPassed(true);
    }
    setPhase('result');
  };

  const replay = () => {
    setAttempt((n) => n + 1);
    setPhase('mode');
  };

  const chooseMode = (next: Mode) => setMode(next);

  const gained = fresh
    .map((key) => entries.find((entry) => codexKey(chapter.id, entry.id) === key))
    .filter((entry): entry is CodexEntry => entry !== undefined);

  return (
    <div data-theme={chapter.theme} className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex items-center gap-3 border-b border-line bg-panel px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label={t.mission.exit}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-line hover:border-accent"
          onClick={() => setLeaving(true)}
        >
          <CloseIcon className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-base leading-tight sm:text-lg">{meta.title}</h1>
          <YearChip years={meta.years} place={meta.place} emptyLabel={t.chapter.outsideTime} />
        </div>
        {phase === 'play' && (
          <Badge tone="accent">
            {mode === 'relaxed' ? t.mission.relaxed : t.mission.challenge}
          </Badge>
        )}
      </header>

      <main className="relative flex flex-1 flex-col">
        {phase === 'lens' && <LensScreen meta={meta} onContinue={() => setPhase('intro')} />}

        {phase === 'intro' && <ScenePlayer scene={mission.intro} onDone={() => setPhase('mode')} />}

        {phase === 'mode' && (
          <ModeScreen mode={mode} onChoose={chooseMode} onStart={() => setPhase('play')} />
        )}

        {phase === 'play' && (
          <Suspense fallback={<p className="p-6 text-center text-muted">{t.mission.loading}</p>}>
            <EngineView key={attempt} mission={mission} mode={mode} onFinish={finish} />
          </Suspense>
        )}

        {phase === 'outro' && <ScenePlayer scene={outro} onDone={afterOutro} />}

        {phase === 'bonus' && mission.bonusQuiz && (
          <BonusQuiz quiz={mission.bonusQuiz} onFinish={finishBonus} />
        )}

        {phase === 'result' && (
          <ResultScreen
            chapter={chapter}
            stars={stars}
            gained={gained}
            bonusPassed={bonusPassed}
            onReplay={replay}
          />
        )}
      </main>

      <ConfirmDialog
        open={leaving}
        title={t.mission.exitTitle}
        message={t.mission.exitText}
        confirmLabel={t.mission.exitConfirm}
        cancelLabel={t.mission.exitStay}
        onCancel={() => setLeaving(false)}
        onConfirm={() => {
          setLeaving(false);
          navigate(`/bab/${chapter.id}`);
        }}
      />
    </div>
  );
}

function LensScreen({
  meta,
  onContinue,
}: {
  meta: Chapter['missions'][number];
  onContinue: () => void;
}) {
  const t = useT();
  const stops = meta.years.map((year) => ({ year: year.start, approximate: year.approximate }));
  const now = new Date().getFullYear();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      {stops.length > 0 ? (
        <YearRoller from={now} stops={stops} />
      ) : (
        <p className="font-display text-3xl">{t.chapter.outsideTime}</p>
      )}
      <div className="flex flex-col items-center gap-1">
        <p className="font-display text-2xl">{meta.title}</p>
        <p className="text-muted">{meta.place}</p>
      </div>
      <button type="button" className={buttonClass()} onClick={onContinue}>
        {t.lens.go}
      </button>
    </div>
  );
}

function ModeScreen({
  mode,
  onChoose,
  onStart,
}: {
  mode: Mode;
  onChoose: (mode: Mode) => void;
  onStart: () => void;
}) {
  const t = useT();
  const options: Array<{ id: Mode; title: string; text: string }> = [
    { id: 'relaxed', title: t.mission.relaxed, text: t.mission.relaxedText },
    { id: 'challenge', title: t.mission.challenge, text: t.mission.challengeText },
  ];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 p-4">
      <section className="animate-rise flex flex-col gap-4 rounded-2xl border border-line bg-panel p-5 shadow">
        <div>
          <h2 className="font-display text-2xl">{t.mission.modeTitle}</h2>
          <p className="text-sm text-muted">{t.mission.modeText}</p>
        </div>
        <div
          role="radiogroup"
          aria-label={t.mission.modeLabel}
          className="grid gap-3 sm:grid-cols-2"
        >
          {options.map((option) => {
            const selected = option.id === mode;
            return (
              // biome-ignore lint/a11y/useSemanticElements: a card-style radio; the group is announced with role="radiogroup"
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChoose(option.id)}
                className={`flex flex-col gap-1 rounded-xl border-2 p-4 text-left transition ${
                  selected
                    ? 'border-accent bg-panel-2'
                    : 'border-line bg-panel hover:border-accent/60'
                }`}
              >
                <span className="font-display text-lg">{option.title}</span>
                <span className="text-sm text-muted">{option.text}</span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end">
          <button type="button" className={buttonClass()} onClick={onStart}>
            {t.mission.play}
          </button>
        </div>
      </section>
    </div>
  );
}

function ResultScreen({
  chapter,
  stars,
  gained,
  bonusPassed,
  onReplay,
}: {
  chapter: Chapter;
  stars: 1 | 2 | 3;
  gained: CodexEntry[];
  bonusPassed: boolean;
  onReplay: () => void;
}) {
  const t = useT();
  const name = useProgressStore((s) => s.profile?.name) ?? DEFAULT_PLAYER_NAME;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 p-4">
      <section className="animate-rise flex flex-col items-center gap-4 rounded-2xl border border-line bg-panel p-6 text-center shadow">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          {t.mission.resultTitle}
        </p>
        <p className="font-display text-2xl">{name}</p>
        <div className="animate-pop">
          <Stars value={stars} className="size-12" />
        </div>
        <p className="text-sm text-muted">
          {t.mission.resultStars}: {format(t.chapter.stars, { count: stars })}
          {bonusPassed ? ` · ${t.mission.bonusTitle}` : ''}
        </p>

        {gained.length > 0 && (
          <div className="flex w-full flex-col gap-2 text-left">
            <h2 className="text-sm font-semibold">{t.mission.newCodex}</h2>
            <ul className="flex flex-col gap-2">
              {gained.map((entry) => (
                <li key={entry.id}>
                  <Link
                    to={`/kodeks/${chapter.id}/${entry.id}`}
                    className="flex flex-col rounded-xl border border-line bg-panel-2 px-3 py-2 hover:border-accent"
                  >
                    <span className="font-semibold">{entry.title}</span>
                    <span className="text-xs text-muted">{entry.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <Link to={`/bab/${chapter.id}`} className={buttonClass()}>
            {t.mission.back}
          </Link>
          <Link to="/kodeks" className={buttonClass('ghost')}>
            {t.mission.openCodex}
          </Link>
          <button type="button" className={buttonClass('ghost')} onClick={onReplay}>
            {t.mission.replay}
          </button>
        </div>
      </section>
    </div>
  );
}
