import { useMemo, useState } from 'react';
import {
  emptyPlan,
  floodMood,
  isWatered,
  optimalPlan,
  type Plan,
  randomFlood,
  washedOutPlots,
} from '@/core/missions/nile-flood/model';
import { format, useT } from '@/i18n';
import { assetUrl } from '@/shared/assets';
import { characters } from '@/shared/content/characters';
import { Badge } from '@/shared/ui/Badge';
import { buttonClass } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { SparkleIcon } from '@/shared/ui/icons';
import { ScenePlayer } from '@/shared/ui/ScenePlayer';
import type { EngineProps } from '../types';
import { HarvestReport } from './HarvestReport';
import { Nilometer } from './Nilometer';
import { PlanBoard } from './PlanBoard';

type Phase = 'akhet' | 'read' | 'flood' | 'peret' | 'plan' | 'shemu' | 'harvest';
type Season = 'akhet' | 'peret' | 'shemu';

const SEASON_OF: Record<Phase, Season> = {
  akhet: 'akhet',
  read: 'akhet',
  flood: 'akhet',
  peret: 'peret',
  plan: 'peret',
  shemu: 'shemu',
  harvest: 'shemu',
};

/** Mission 1 of Mesir: one farming year on the Nile, in three seasons. Rules: core/missions/nile-flood. */
export default function NileFloodMission({ mission, mode, onFinish }: EngineProps<'nile-flood'>) {
  const t = useT();
  const { params, scenes } = mission;
  const relaxed = mode === 'relaxed';

  // Santai always brings the same flood; Tantangan draws a new one for every attempt
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const flood = useMemo(
    () => (relaxed ? params.relaxedFlood : randomFlood(params, seed)),
    [relaxed, params, seed],
  );

  const [phase, setPhase] = useState<Phase>('akhet');
  const [plan, setPlan] = useState<Plan>(() => emptyPlan(params));
  const [assisted, setAssisted] = useState(false);
  const [askAuto, setAskAuto] = useState(false);

  const season = SEASON_OF[phase];
  const backdrop = scenes[season]?.background;

  const fillBestPlan = () => {
    setPlan(optimalPlan(params, flood).plan);
    setAssisted(true);
    setAskAuto(false);
  };

  return (
    <div className="relative flex flex-1 flex-col">
      {backdrop && (
        <img
          key={backdrop}
          src={assetUrl(backdrop)}
          alt=""
          aria-hidden="true"
          className="animate-fade absolute inset-0 size-full object-cover"
        />
      )}

      <SeasonBar current={season} />

      <div className="relative flex flex-1 flex-col">
        {phase === 'akhet' && (
          <ScenePlayer
            scene={scenes.akhet ?? mission.intro}
            withBackground={false}
            onDone={() => setPhase('read')}
          />
        )}

        {phase === 'read' && (
          <ReadPhase
            flood={flood}
            low={params.floodRange.min - 1}
            high={params.floodRange.max + 1}
            relaxed={relaxed}
            onContinue={() => setPhase('flood')}
          />
        )}

        {phase === 'flood' && (
          <FloodPhase
            mission={mission}
            flood={flood}
            relaxed={relaxed}
            onContinue={() => setPhase('peret')}
          />
        )}

        {phase === 'peret' && (
          <ScenePlayer
            scene={scenes.peret ?? mission.intro}
            withBackground={false}
            onDone={() => setPhase('plan')}
          />
        )}

        {phase === 'plan' && (
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-3 sm:p-6">
            <section className="animate-rise flex flex-col gap-3 rounded-2xl border border-line bg-panel/95 p-3 shadow-lg backdrop-blur-sm">
              <h2 className="font-display text-xl">{t.nileFlood.plan.title}</h2>
              <PlanBoard
                params={params}
                flood={flood}
                plan={plan}
                relaxed={relaxed}
                onChange={(next) => {
                  setPlan(next);
                  setAssisted(false);
                }}
                aids={
                  relaxed ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={buttonClass('ghost')}
                        onClick={() => setAskAuto(true)}
                      >
                        <SparkleIcon className="size-4" />
                        {t.nileFlood.plan.auto}
                      </button>
                      {assisted && (
                        <span className="text-sm font-semibold text-accent">
                          {t.nileFlood.plan.autoNote}
                        </span>
                      )}
                    </div>
                  ) : null
                }
                actions={
                  <button type="button" className={buttonClass()} onClick={() => setPhase('shemu')}>
                    {t.nileFlood.plan.start}
                  </button>
                }
              />
            </section>
          </div>
        )}

        {phase === 'shemu' && (
          <ScenePlayer
            scene={scenes.shemu ?? mission.intro}
            withBackground={false}
            onDone={() => setPhase('harvest')}
          />
        )}

        {phase === 'harvest' && (
          <HarvestReport
            params={params}
            flood={flood}
            plan={plan}
            assisted={assisted}
            onFinish={(stars) => onFinish({ stars })}
          />
        )}
      </div>

      <ConfirmDialog
        open={askAuto}
        title={t.nileFlood.plan.autoTitle}
        message={t.nileFlood.plan.autoText}
        onCancel={() => setAskAuto(false)}
        onConfirm={fillBestPlan}
      />
    </div>
  );
}

function SeasonBar({ current }: { current: Season }) {
  const t = useT();
  const seasons: Season[] = ['akhet', 'peret', 'shemu'];
  return (
    <nav aria-label={t.mission.seasonBar} className="relative z-10 flex justify-center gap-2 p-2">
      {seasons.map((season) => (
        <span
          key={season}
          aria-current={season === current ? 'step' : undefined}
          className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition ${
            season === current
              ? 'border-accent bg-accent text-on-accent'
              : 'border-line bg-panel/90 text-muted'
          }`}
        >
          {t.nileFlood.seasons[season]}
          <span className="font-normal"> · {t.nileFlood.seasonMeaning[season]}</span>
        </span>
      ))}
    </nav>
  );
}

interface ReadPhaseProps {
  flood: number;
  low: number;
  high: number;
  relaxed: boolean;
  onContinue: () => void;
}

/** Akhet: read the Nilometer. Tap the mark where the water surface stops. */
function ReadPhase({ flood, low, high, relaxed, onContinue }: ReadPhaseProps) {
  const t = useT();
  const [picked, setPicked] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const solved = picked === flood;

  const pick = (mark: number) => {
    if (solved) return;
    setPicked(mark);
    if (mark !== flood) setMisses((n) => n + 1);
  };

  const hintVisible = relaxed && !solved && misses >= 2;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-3 sm:p-6">
      <section className="animate-rise flex flex-col gap-3 rounded-2xl border border-line bg-panel/95 p-4 shadow-lg backdrop-blur-sm">
        <h2 className="font-display text-xl">{t.nileFlood.read.title}</h2>
        <p className="text-sm text-muted">{t.nileFlood.read.instruction}</p>

        <Nilometer
          flood={flood}
          low={low}
          high={high}
          picked={picked}
          solved={solved}
          revealed={hintVisible}
          onPick={pick}
        />

        <div aria-live="polite" className="min-h-6 text-center text-sm font-semibold">
          {solved ? (
            <span className="text-good">{format(t.nileFlood.read.correct, { n: flood })}</span>
          ) : picked !== null ? (
            <span className="text-bad">{t.nileFlood.read.wrong}</span>
          ) : null}
        </div>

        {relaxed && !solved && (
          <p className="flex items-start gap-2 rounded-xl bg-panel-2 px-3 py-2 text-sm">
            <SparkleIcon className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              {hintVisible ? format(t.nileFlood.read.hint, { n: flood }) : t.nileFlood.hint.read}
            </span>
          </p>
        )}

        {solved && (
          <div className="flex justify-end">
            <button type="button" className={buttonClass()} onClick={onContinue}>
              {t.nileFlood.read.continue}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

interface FloodPhaseProps {
  mission: EngineProps<'nile-flood'>['mission'];
  flood: number;
  relaxed: boolean;
  onContinue: () => void;
}

/** Akhet, second half: what the flood means, and which plots the water reaches. */
function FloodPhase({ mission, flood, relaxed, onContinue }: FloodPhaseProps) {
  const t = useT();
  const { params } = mission;
  const washed = washedOutPlots(params, flood);
  const plan = emptyPlan(params);
  const reached = params.plots.filter((_, i) => isWatered(params, flood, plan, i, washed)).length;
  const meryt =
    characters.meryt?.portraits[flood <= params.floodRange.min + 1 ? 'worried' : 'happy'];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-3 sm:p-6">
      <section className="animate-rise flex flex-col gap-3 rounded-2xl border border-line bg-panel/95 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {meryt && relaxed && (
            <img
              src={assetUrl(meryt)}
              alt=""
              aria-hidden="true"
              className="h-20 w-[3.75rem] shrink-0 rounded-xl object-cover object-top"
            />
          )}
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-xl">
              {t.nileFlood.flood} {flood} {t.nileFlood.hasta}
            </h2>
            {relaxed && (
              <p className="text-sm font-semibold text-accent">
                {format(t.nileFlood.read.moodTitle, { mood: floodMood(params, flood) })}
              </p>
            )}
            <p className="text-sm text-muted">
              {format(t.nileFlood.reach.text, {
                flood,
                count: reached,
                total: params.plots.length,
              })}
            </p>
          </div>
        </div>

        <h3 className="text-sm font-semibold">{t.nileFlood.reach.title}</h3>
        <ul className="flex flex-col gap-1.5">
          {params.plots.map((plot, i) => {
            const gone = washed[i] === true;
            const wet = isWatered(params, flood, plan, i, washed);
            return (
              <li
                key={plot.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-line bg-panel px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {i + 1}. {plot.name}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-muted">
                    {format(t.nileFlood.reach.needs, { n: plot.needs })}
                  </span>
                  {relaxed && (
                    <Badge tone={gone ? 'bad' : wet ? 'good' : 'neutral'}>
                      {gone
                        ? t.nileFlood.reach.washed
                        : wet
                          ? t.nileFlood.reach.yes
                          : t.nileFlood.reach.no}
                    </Badge>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end">
          <button type="button" className={buttonClass()} onClick={onContinue}>
            {t.nileFlood.reach.continue}
          </button>
        </div>
      </section>
    </div>
  );
}
