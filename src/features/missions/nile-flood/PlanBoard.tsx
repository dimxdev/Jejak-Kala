import type { ReactNode } from 'react';
import { isWatered, type Plan, settle, washedOutPlots } from '@/core/missions/nile-flood/model';
import type { NileFloodParams } from '@/core/missions/nile-flood/schema';
import { format, useT } from '@/i18n';
import { Badge, type BadgeTone } from '@/shared/ui/Badge';
import { MinusIcon, PlusIcon } from '@/shared/ui/icons';
import { FloodProfile } from './FloodProfile';

interface PlanBoardProps {
  params: NileFloodParams;
  flood: number;
  plan: Plan;
  relaxed: boolean;
  onChange: (plan: Plan) => void;
  /** shown above the plots, e.g. Kala's "fill in the best plan" button */
  aids?: ReactNode;
  /** the buttons at the right of the bar that stays at the bottom of the screen */
  actions: ReactNode;
}

const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);

/** The planting decisions of Peret: seeds and channels for each plot, with the numbers that matter. */
export function PlanBoard({
  params,
  flood,
  plan,
  relaxed,
  onChange,
  aids,
  actions,
}: PlanBoardProps) {
  const t = useT();
  const washed = washedOutPlots(params, flood);
  const seedsLeft = params.seedBaskets - sum(plan.seeds);
  const laborLeft = params.laborDays - sum(plan.labor);
  const forecast = settle(params, flood, plan).harvest;

  const setSeeds = (index: number, value: number) =>
    onChange({ ...plan, seeds: plan.seeds.map((n, i) => (i === index ? value : n)) });
  const toggleChannel = (index: number) =>
    onChange({
      ...plan,
      labor: plan.labor.map((n, i) => (i === index ? (n > 0 ? 0 : 1) : n)),
    });

  return (
    <div className="flex flex-col gap-3">
      {relaxed ? (
        <>
          <p className="text-sm text-muted">{t.nileFlood.plan.tip}</p>
          <FloodProfile params={params} flood={flood} plan={plan} />
        </>
      ) : (
        <p className="rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm font-semibold">
          {format(t.nileFlood.plan.floodNow, { n: flood })}
        </p>
      )}

      {aids}

      <ol className="flex flex-col gap-2">
        {params.plots.map((plot, i) => {
          const seeds = plan.seeds[i] ?? 0;
          const channel = (plan.labor[i] ?? 0) > 0;
          const gone = washed[i] === true;
          const watered = isWatered(params, flood, plan, i, washed);
          const canChannel = flood + 1 >= plot.needs && !gone;
          const hasChannels = params.laborDays > 0 && params.maxLaborPerPlot > 0;

          let status: { label: string; tone: BadgeTone };
          if (gone) status = { label: t.nileFlood.plan.washed, tone: 'bad' };
          else if (watered) status = { label: t.nileFlood.plan.watered, tone: 'good' };
          else if (canChannel && hasChannels) {
            status = { label: t.nileFlood.plan.needsChannel, tone: 'accent' };
          } else status = { label: t.nileFlood.plan.unreachable, tone: 'neutral' };

          const harvest = watered ? seeds * plot.yield : 0;
          const channelDisabled = !channel && (laborLeft <= 0 || params.maxLaborPerPlot < 1);

          return (
            <li
              key={plot.id}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-panel p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-panel-2 text-sm font-bold">
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="font-display text-base font-semibold leading-tight">
                    {plot.name}
                  </h3>
                  <p className="text-xs text-muted">
                    <span className="font-semibold tabular-nums">
                      {format(t.nileFlood.plan.needs, { n: plot.needs })}
                    </span>
                    {' · '}×{plot.yield} {t.nileFlood.plan.yieldLabel}
                  </p>
                </div>

                <fieldset className="m-0 flex min-w-0 items-center gap-1.5 border-0 p-0">
                  <legend className="sr-only">
                    {format(t.nileFlood.plan.seedsFor, { plot: plot.name })}
                  </legend>
                  <button
                    type="button"
                    aria-label={format(t.nileFlood.plan.fewerSeeds, { plot: plot.name })}
                    disabled={seeds <= 0}
                    onClick={() => setSeeds(i, seeds - 1)}
                    className="grid size-11 place-items-center rounded-xl border border-line bg-panel hover:border-accent disabled:opacity-40"
                  >
                    <MinusIcon className="size-5" />
                  </button>
                  <output
                    className="w-6 text-center text-lg font-bold tabular-nums"
                    aria-live="polite"
                  >
                    {seeds}
                  </output>
                  <button
                    type="button"
                    aria-label={format(t.nileFlood.plan.moreSeeds, { plot: plot.name })}
                    disabled={seeds >= params.maxSeedsPerPlot || seedsLeft <= 0}
                    onClick={() => setSeeds(i, seeds + 1)}
                    className="grid size-11 place-items-center rounded-xl border border-line bg-panel hover:border-accent disabled:opacity-40"
                  >
                    <PlusIcon className="size-5" />
                  </button>
                </fieldset>
              </div>

              {(relaxed || hasChannels) && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {relaxed && <Badge tone={status.tone}>{status.label}</Badge>}
                    {relaxed && (
                      <span className="text-xs font-semibold text-good">
                        {harvest > 0
                          ? format(t.nileFlood.plan.forecast, { n: harvest })
                          : t.nileFlood.plan.forecastNone}
                      </span>
                    )}
                  </div>
                  {hasChannels && (
                    <button
                      type="button"
                      aria-pressed={channel}
                      disabled={channelDisabled}
                      onClick={() => toggleChannel(i)}
                      title={format(t.nileFlood.plan.channelHelp, { cost: params.laborCost })}
                      className={`min-h-10 rounded-xl border-2 px-3 text-sm font-semibold transition disabled:opacity-40 ${
                        channel
                          ? 'border-accent bg-accent text-on-accent'
                          : 'border-line bg-panel hover:border-accent'
                      }`}
                    >
                      {channel ? t.nileFlood.plan.channelOn : t.nileFlood.plan.channel}
                    </button>
                  )}
                </div>
              )}

              {relaxed && plot.note && <p className="text-xs text-muted">{plot.note}</p>}
            </li>
          );
        })}
      </ol>

      {relaxed && (
        <p
          className="rounded-xl bg-good-soft px-3 py-2 text-sm font-semibold text-good"
          aria-live="polite"
        >
          {format(t.nileFlood.plan.forecastTotal, { n: forecast })}
        </p>
      )}

      {/* stays at the bottom of the screen while the plots scroll by */}
      <div className="sticky bottom-0 z-10 -mx-3 -mb-3 flex flex-col gap-1 rounded-b-2xl border-t border-line bg-panel/95 px-3 py-2 backdrop-blur">
        {seedsLeft > 0 && (
          <p className="text-xs text-muted">{format(t.nileFlood.plan.unsown, { n: seedsLeft })}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <dl className="flex gap-4 text-sm" aria-live="polite">
            <div>
              <dt className="text-xs text-muted">{t.nileFlood.plan.seedsLeft}</dt>
              <dd className="font-bold tabular-nums">
                {format(t.nileFlood.plan.ofTotal, { left: seedsLeft, total: params.seedBaskets })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t.nileFlood.plan.laborLeft}</dt>
              <dd className="font-bold tabular-nums">
                {format(t.nileFlood.plan.ofTotal, { left: laborLeft, total: params.laborDays })}
              </dd>
            </div>
          </dl>
          <div className="flex gap-2">{actions}</div>
        </div>
      </div>
    </div>
  );
}
