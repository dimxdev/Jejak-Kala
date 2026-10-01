// The rules of the "Banjir Nil" mission as pure functions over plain data: the UI only shows what these
// return, and the tests (model.test.ts) hold the numbers in place.
//
// One year, three seasons:
//   Akhet  the flood comes; the player reads its height on the Nilometer (a UI step, `flood` is the answer)
//   Peret  the player decides which plots get seed and where to spend labor days
//   Shemu  harvest, the scribes' tax (decided by the flood height, not by the harvest) and the family's needs

import type { NileFloodParams } from './schema';

/** What the player decides: seed baskets and labor days per plot, in the order of `params.plots`. */
export interface Plan {
  seeds: number[];
  labor: number[];
}

export type PlanProblem =
  | { code: 'shape' }
  | { code: 'not-whole' }
  | { code: 'seeds-total'; limit: number }
  | { code: 'seeds-plot'; plot: number; limit: number }
  | { code: 'labor-total'; limit: number }
  | { code: 'labor-plot'; plot: number; limit: number };

export interface TaxAssessment {
  /** how many plots the flood reaches by itself */
  reached: number;
  /** harvest the scribes assume */
  assessed: number;
  fraction: readonly [number, number];
  /** baskets owed */
  tax: number;
}

export interface Settlement {
  /** baskets harvested, per plot and in total */
  perPlot: number[];
  harvest: number;
  /** seed baskets sown on plots the water never reached or the flood washed away */
  lostSeeds: number;
  tax: TaxAssessment;
  /** baskets paid to the workers */
  laborCost: number;
  familyNeed: number;
  /** what is left in the granary: harvest - tax - labor - family; negative means the family goes hungry */
  surplus: number;
  hungry: boolean;
}

export const emptyPlan = (params: NileFloodParams): Plan => ({
  seeds: params.plots.map(() => 0),
  labor: params.plots.map(() => 0),
});

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/** What the flood height means for the year, e.g. "Paceklik" or "Berlimpah". */
export function floodMood(params: NileFloodParams, flood: number): string {
  const mood = params.floodMoods.find((m) => flood <= m.upTo) ?? params.floodMoods.at(-1);
  return mood?.label ?? '';
}

/** Plots the flood reaches by itself, before any labor. This is also what the scribes count. */
export function reachedPlots(params: NileFloodParams, flood: number): boolean[] {
  return params.plots.map((plot) => plot.needs <= flood);
}

/** A flood this high breaks the dikes and washes away the lowest plots. */
export function washedOutPlots(params: NileFloodParams, flood: number): boolean[] {
  const washed = params.plots.map(() => false);
  if (flood < params.overflood.from) return washed;
  const lowestFirst = params.plots
    .map((plot, index) => ({ index, needs: plot.needs }))
    .sort((a, b) => a.needs - b.needs || a.index - b.index);
  for (const { index } of lowestFirst.slice(0, params.overflood.washedOut)) washed[index] = true;
  return washed;
}

/** Is plot `index` watered this year, counting the channel dug there? */
export function isWatered(
  params: NileFloodParams,
  flood: number,
  plan: Plan,
  index: number,
  washed = washedOutPlots(params, flood),
): boolean {
  const plot = params.plots[index];
  if (!plot || washed[index]) return false;
  return flood + (plan.labor[index] ?? 0) >= plot.needs;
}

/** Everything that is wrong with a plan, as codes the UI can turn into sentences. Empty = valid. */
export function planProblems(params: NileFloodParams, plan: Plan): PlanProblem[] {
  const size = params.plots.length;
  if (plan.seeds.length !== size || plan.labor.length !== size) return [{ code: 'shape' }];
  if ([...plan.seeds, ...plan.labor].some((n) => !Number.isInteger(n) || n < 0)) {
    return [{ code: 'not-whole' }];
  }
  const problems: PlanProblem[] = [];
  if (sum(plan.seeds) > params.seedBaskets) {
    problems.push({ code: 'seeds-total', limit: params.seedBaskets });
  }
  if (sum(plan.labor) > params.laborDays) {
    problems.push({ code: 'labor-total', limit: params.laborDays });
  }
  plan.seeds.forEach((n, plot) => {
    if (n > params.maxSeedsPerPlot) {
      problems.push({ code: 'seeds-plot', plot, limit: params.maxSeedsPerPlot });
    }
  });
  plan.labor.forEach((n, plot) => {
    if (n > params.maxLaborPerPlot) {
      problems.push({ code: 'labor-plot', plot, limit: params.maxLaborPerPlot });
    }
  });
  return problems;
}

/** The tax the scribes set from the Nilometer reading. It does not depend on what is sown. */
export function assessTax(params: NileFloodParams, flood: number): TaxAssessment {
  const reached = reachedPlots(params, flood).filter(Boolean).length;
  const assessed = reached * params.assessedPerPlot;
  const bracket = params.taxBrackets.find((b) => flood <= b.upTo) ?? params.taxBrackets.at(-1);
  const fraction = bracket?.fraction ?? [0, 1];
  return { reached, assessed, fraction, tax: (assessed * fraction[0]) / fraction[1] };
}

/** The year's accounts for a plan. The plan must be valid (see planProblems). */
export function settle(params: NileFloodParams, flood: number, plan: Plan): Settlement {
  const washed = washedOutPlots(params, flood);
  let lostSeeds = 0;
  const perPlot = params.plots.map((plot, index) => {
    const seeds = plan.seeds[index] ?? 0;
    if (!isWatered(params, flood, plan, index, washed)) {
      lostSeeds += seeds;
      return 0;
    }
    return seeds * plot.yield;
  });

  const harvest = sum(perPlot);
  const tax = assessTax(params, flood);
  const laborCost = sum(plan.labor) * params.laborCost;
  const surplus = harvest - tax.tax - laborCost - params.familyNeed;
  return {
    perPlot,
    harvest,
    lostSeeds,
    tax,
    laborCost,
    familyNeed: params.familyNeed,
    surplus,
    hungry: surplus < 0,
  };
}

/** Every way to spend the labor days: a day count per plot, at most `maxLaborPerPlot` each. */
function* laborChoices(params: NileFloodParams): Generator<number[]> {
  const size = params.plots.length;
  const labor = new Array<number>(size).fill(0);
  function* fill(plot: number, left: number): Generator<number[]> {
    if (plot === size) {
      yield [...labor];
      return;
    }
    for (let days = 0; days <= Math.min(params.maxLaborPerPlot, left); days++) {
      labor[plot] = days;
      yield* fill(plot + 1, left - days);
    }
    labor[plot] = 0;
  }
  yield* fill(0, params.laborDays);
}

/**
 * The best plan for a flood, found exhaustively: for each way to spend the labor days, the seeds go
 * to the watered plots with the best yield first. Ties prefer fewer labor days.
 */
export function optimalPlan(
  params: NileFloodParams,
  flood: number,
): { plan: Plan; settlement: Settlement } {
  const washed = washedOutPlots(params, flood);
  let best: { plan: Plan; settlement: Settlement; days: number } | null = null;

  for (const labor of laborChoices(params)) {
    const seeds = params.plots.map(() => 0);
    const candidates = params.plots
      .map((plot, index) => ({ index, yield: plot.yield }))
      .filter(({ index }) => isWatered(params, flood, { seeds, labor }, index, washed))
      .sort((a, b) => b.yield - a.yield || a.index - b.index);
    let left = params.seedBaskets;
    for (const { index } of candidates) {
      const sown = Math.min(params.maxSeedsPerPlot, left);
      seeds[index] = sown;
      left -= sown;
    }
    const plan = { seeds, labor };
    const settlement = settle(params, flood, plan);
    const days = sum(labor);
    if (
      !best ||
      settlement.surplus > best.settlement.surplus ||
      (settlement.surplus === best.settlement.surplus && days < best.days)
    ) {
      best = { plan, settlement, days };
    }
  }

  // laborChoices always yields at least the "no labor" choice, so there is always a best plan
  if (!best) throw new Error('tidak ada rencana yang mungkin');
  return { plan: best.plan, settlement: best.settlement };
}

/** 1 to 3 stars from how close the surplus is to the best possible one. A hungry family is 1 star. */
export function starsFor(params: NileFloodParams, flood: number, plan: Plan): 1 | 2 | 3 {
  const { surplus } = settle(params, flood, plan);
  if (surplus < 0) return 1;
  const best = optimalPlan(params, flood).settlement.surplus;
  if (best <= 0) return surplus >= best ? 3 : 1;
  const ratio = surplus / best;
  if (ratio >= params.stars.three) return 3;
  if (ratio >= params.stars.two) return 2;
  return 1;
}

/** A small, fast, seedable random generator (mulberry32), so a "year" can be replayed from its seed. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The flood of a Tantangan year: drawn from `floodWeights`, the same for the same seed. */
export function randomFlood(params: NileFloodParams, seed: number): number {
  const total = sum(params.floodWeights);
  let roll = seededRandom(seed)() * total;
  for (const [offset, weight] of params.floodWeights.entries()) {
    roll -= weight;
    if (roll < 0) return params.floodRange.min + offset;
  }
  return params.floodRange.max;
}
