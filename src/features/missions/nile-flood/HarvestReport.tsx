import { useMemo } from 'react';
import { optimalPlan, type Plan, settle, starsFor } from '@/core/missions/nile-flood/model';
import type { NileFloodParams } from '@/core/missions/nile-flood/schema';
import { format, useT } from '@/i18n';
import { assetUrl } from '@/shared/assets';
import { characters } from '@/shared/content/characters';
import { buttonClass } from '@/shared/ui/button';
import { Stars } from '@/shared/ui/Stars';

interface HarvestReportProps {
  params: NileFloodParams;
  flood: number;
  plan: Plan;
  /** the plan was filled in by Kala: the mission then counts as 1 star */
  assisted: boolean;
  onFinish: (stars: 1 | 2 | 3) => void;
}

const list = (items: string[]) => items.join(', ');

/** Shemu: what the fields gave, what the scribes took, what is left in the granary, and the stars. */
export function HarvestReport({ params, flood, plan, assisted, onFinish }: HarvestReportProps) {
  const t = useT();
  const text = t.nileFlood.harvest;

  const { result, best, stars } = useMemo(() => {
    const settled = settle(params, flood, plan);
    const optimum = optimalPlan(params, flood);
    return {
      result: settled,
      best: optimum,
      stars: assisted ? (1 as const) : starsFor(params, flood, plan),
    };
  }, [params, flood, plan, assisted]);

  const scribe = characters['juru-tulis']?.portraits.neutral;
  const [num, den] = result.tax.fraction;
  const bestSeeds = best.plan.seeds.flatMap((n, i) => {
    const plot = params.plots[i];
    return n > 0 && plot ? [`${plot.name} ${n}`] : [];
  });
  const bestChannels = best.plan.labor.flatMap((n, i) => {
    const plot = params.plots[i];
    return n > 0 && plot ? [plot.name] : [];
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-3 sm:p-6">
      <h2 className="sr-only">{text.title}</h2>

      {/* 1. what each plot gave */}
      <section className="animate-rise rounded-2xl border border-line bg-panel p-4 shadow">
        <h3 className="font-display text-lg">{text.perPlot}</h3>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {params.plots.map((plot, i) => {
              const seeds = plan.seeds[i] ?? 0;
              const harvest = result.perPlot[i] ?? 0;
              return (
                <tr key={plot.id} className="border-t border-line first:border-t-0">
                  <th scope="row" className="py-1.5 pr-2 text-left font-medium">
                    {plot.name}
                  </th>
                  <td className="py-1.5 pr-2 text-muted">
                    {seeds > 0 ? format(text.row, { seeds, yield: plot.yield }) : text.none}
                  </td>
                  <td
                    className={`py-1.5 text-right font-bold tabular-nums ${
                      seeds > 0 && harvest === 0 ? 'text-bad' : ''
                    }`}
                  >
                    {harvest}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-line">
              <th scope="row" className="py-2 pr-2 text-left font-display text-base" colSpan={2}>
                {text.total}
              </th>
              <td className="py-2 text-right text-lg font-bold tabular-nums">{result.harvest}</td>
            </tr>
          </tbody>
        </table>
        {result.lostSeeds > 0 && (
          <p className="mt-2 text-sm font-semibold text-bad">
            {format(text.lostLine, { n: result.lostSeeds })}
          </p>
        )}
      </section>

      {/* 2. the scribe's tax */}
      <section
        className="animate-rise flex gap-3 rounded-2xl border border-line bg-panel p-4 shadow"
        style={{ animationDelay: '120ms' }}
      >
        {scribe && (
          <img
            src={assetUrl(scribe)}
            alt=""
            aria-hidden="true"
            className="h-24 w-[4.5rem] shrink-0 rounded-xl object-cover object-top"
          />
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-display text-lg">{text.taxTitle}</h3>
          <p className="text-sm leading-relaxed">
            {result.tax.tax === 0 && num === 0
              ? format(text.taxRelief, { flood })
              : format(text.taxText, {
                  flood,
                  reached: result.tax.reached,
                  perPlot: params.assessedPerPlot,
                  assessed: result.tax.assessed,
                  num,
                  den,
                  tax: result.tax.tax,
                })}
          </p>
          <p className="text-xs text-muted">{text.taxNote}</p>
        </div>
      </section>

      {/* 3. the granary */}
      <section
        className="animate-rise rounded-2xl border border-line bg-panel p-4 shadow"
        style={{ animationDelay: '240ms' }}
      >
        <h3 className="font-display text-lg">{text.ledgerTitle}</h3>
        <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
          <dt>{text.harvest}</dt>
          <dd className="text-right font-bold tabular-nums">+{result.harvest}</dd>
          <dt>{text.tax}</dt>
          <dd className="text-right font-bold tabular-nums">−{result.tax.tax}</dd>
          {result.laborCost > 0 && (
            <>
              <dt>{format(text.labor, { days: plan.labor.reduce((a, b) => a + b, 0) })}</dt>
              <dd className="text-right font-bold tabular-nums">−{result.laborCost}</dd>
            </>
          )}
          <dt>{text.family}</dt>
          <dd className="text-right font-bold tabular-nums">−{result.familyNeed}</dd>
          <div className="col-span-2 mt-1 grid grid-cols-subgrid items-baseline border-t-2 border-line pt-2">
            <dt className="font-display text-base">{text.left}</dt>
            <dd
              className={`text-right text-xl font-bold tabular-nums ${
                result.hungry ? 'text-bad' : 'text-good'
              }`}
              data-testid="surplus"
            >
              {result.surplus}
            </dd>
          </div>
        </dl>
        <p className={`mt-2 text-sm font-semibold ${result.hungry ? 'text-bad' : 'text-good'}`}>
          {result.hungry ? text.hungry : text.fed}
        </p>
      </section>

      {/* 4. compared with the best plan */}
      <section
        className="animate-rise rounded-2xl border border-line bg-panel p-4 shadow"
        style={{ animationDelay: '360ms' }}
      >
        <h3 className="font-display text-lg">{text.bestTitle}</h3>
        <p className="mt-1 text-sm">
          {format(text.bestText, {
            flood,
            best: best.settlement.surplus,
            yours: result.surplus,
          })}
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
          <li>{format(text.bestSeeds, { list: list(bestSeeds) })}</li>
          <li>
            {bestChannels.length > 0
              ? format(text.bestChannels, { list: list(bestChannels) })
              : text.bestNoChannels}
          </li>
        </ul>
        {assisted && <p className="mt-2 text-sm font-semibold text-accent">{text.assisted}</p>}
      </section>

      <section
        className="animate-rise flex flex-col items-center gap-3 rounded-2xl border border-line bg-panel p-4 text-center shadow"
        style={{ animationDelay: '480ms' }}
      >
        <div className="animate-pop">
          <Stars value={stars} className="size-10" />
        </div>
        <button type="button" className={buttonClass()} onClick={() => onFinish(stars)}>
          {text.finish}
        </button>
      </section>
    </div>
  );
}
