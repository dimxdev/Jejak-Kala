import { describe, expect, it } from 'vitest';
import {
  assessTax,
  emptyPlan,
  floodMood,
  isWatered,
  optimalPlan,
  type Plan,
  planProblems,
  randomFlood,
  reachedPlots,
  seededRandom,
  settle,
  starsFor,
  washedOutPlots,
} from './model';
import { testParams as params } from './model.fixture';
import { NileFloodParamsSchema } from './schema';

const FLOODS = [12, 13, 14, 15, 16, 17, 18];
const plan = (seeds: number[], labor: number[] = [0, 0, 0, 0, 0, 0]): Plan => ({ seeds, labor });

describe('what the flood does', () => {
  it('names the year by the flood height', () => {
    expect(floodMood(params, 12)).toBe('Paceklik');
    expect(floodMood(params, 16)).toBe('Berlimpah');
    expect(floodMood(params, 18)).toBe('Bencana');
  });

  it('reaches the plots that are not higher than the flood', () => {
    expect(reachedPlots(params, 14)).toEqual([true, true, true, false, false, false]);
    expect(reachedPlots(params, 11)).toEqual([false, false, false, false, false, false]);
  });

  it('washes away the two lowest plots only when the flood is 18 hasta or more', () => {
    expect(washedOutPlots(params, 17)).toEqual([false, false, false, false, false, false]);
    expect(washedOutPlots(params, 18)).toEqual([true, true, false, false, false, false]);
  });

  it('lets a dug channel raise the water by one hasta on that plot', () => {
    const channel = plan([0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0]);
    expect(isWatered(params, 14, emptyPlan(params), 3)).toBe(false);
    expect(isWatered(params, 14, channel, 3)).toBe(true);
  });

  it('cannot lift the water by more than the channel allows', () => {
    // plot 4 needs 16 hasta: a flood of 14 plus one hasta of channel is still short
    const channel = plan([0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0]);
    expect(isWatered(params, 14, channel, 4)).toBe(false);
  });

  it('never waters a washed-out plot, channel or not', () => {
    const channel = plan([0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0]);
    expect(isWatered(params, 18, channel, 0)).toBe(false);
  });
});

describe('planProblems', () => {
  it('accepts a plan within the limits', () => {
    expect(planProblems(params, plan([3, 3, 3, 3, 0, 0], [0, 0, 0, 1, 0, 0]))).toEqual([]);
  });

  it('rejects more seed than the family has', () => {
    expect(planProblems(params, plan([3, 3, 3, 3, 1, 0]))).toEqual([
      { code: 'seeds-total', limit: 12 },
    ]);
  });

  it('rejects too many seeds on one plot', () => {
    expect(planProblems(params, plan([4, 0, 0, 0, 0, 0]))).toEqual([
      { code: 'seeds-plot', plot: 0, limit: 3 },
    ]);
  });

  it('rejects too many labor days, in total and on one plot', () => {
    expect(planProblems(params, plan([0, 0, 0, 0, 0, 0], [1, 1, 1, 0, 0, 0]))).toEqual([
      { code: 'labor-total', limit: 2 },
    ]);
    expect(planProblems(params, plan([0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0]))).toEqual([
      { code: 'labor-plot', plot: 0, limit: 1 },
    ]);
  });

  it('rejects negative, fractional and wrongly shaped plans', () => {
    expect(planProblems(params, plan([-1, 0, 0, 0, 0, 0]))).toEqual([{ code: 'not-whole' }]);
    expect(planProblems(params, plan([0.5, 0, 0, 0, 0, 0]))).toEqual([{ code: 'not-whole' }]);
    expect(planProblems(params, plan([1, 2]))).toEqual([{ code: 'shape' }]);
  });
});

describe('the scribes tax', () => {
  it('sets the tax from the flood height alone', () => {
    const tax = Object.fromEntries(FLOODS.map((flood) => [flood, assessTax(params, flood).tax]));
    expect(tax).toEqual({ 12: 0, 13: 4, 14: 9, 15: 12, 16: 15, 17: 24, 18: 12 });
  });

  it('shows how the sum is made', () => {
    expect(assessTax(params, 15)).toEqual({
      reached: 4,
      assessed: 48,
      fraction: [1, 4],
      tax: 12,
    });
  });

  it('is always a whole number of baskets', () => {
    for (const flood of FLOODS) expect(Number.isInteger(assessTax(params, flood).tax)).toBe(true);
  });
});

describe('settle', () => {
  it('adds up a good year', () => {
    const result = settle(params, 14, plan([3, 3, 3, 3, 0, 0], [0, 0, 0, 1, 0, 0]));
    expect(result.perPlot).toEqual([18, 18, 15, 15, 0, 0]);
    expect(result.harvest).toBe(66);
    expect(result.tax.tax).toBe(9);
    expect(result.laborCost).toBe(1);
    expect(result.surplus).toBe(66 - 9 - 1 - 20);
    expect(result.hungry).toBe(false);
    expect(result.lostSeeds).toBe(0);
  });

  it('loses the seed sown where the water did not reach', () => {
    const result = settle(params, 14, plan([0, 0, 0, 0, 3, 3]));
    expect(result.harvest).toBe(0);
    expect(result.lostSeeds).toBe(6);
    expect(result.hungry).toBe(true);
  });

  it('loses the seed on plots the flood washed away', () => {
    const result = settle(params, 18, plan([3, 3, 3, 3, 0, 0]));
    expect(result.perPlot).toEqual([0, 0, 15, 15, 0, 0]);
    expect(result.lostSeeds).toBe(6);
  });

  it('leaves the family hungry when the granary cannot cover tax and meals', () => {
    const result = settle(params, 15, plan([1, 1, 0, 0, 0, 0]));
    expect(result.surplus).toBeLessThan(0);
    expect(result.hungry).toBe(true);
  });

  it('charges the workers even when the channel turns out useless', () => {
    const result = settle(params, 16, plan([3, 3, 3, 3, 0, 0], [1, 1, 0, 0, 0, 0]));
    expect(result.laborCost).toBe(2);
  });
});

/** Every valid plan, so the solver can be checked against the plain truth. */
function* allPlans(): Generator<Plan> {
  const size = params.plots.length;
  const seedsOptions: number[][] = [];
  const build = (i: number, current: number[], left: number) => {
    if (i === size) {
      seedsOptions.push([...current]);
      return;
    }
    for (let n = 0; n <= Math.min(params.maxSeedsPerPlot, left); n++) {
      current.push(n);
      build(i + 1, current, left - n);
      current.pop();
    }
  };
  build(0, [], params.seedBaskets);

  const laborOptions: number[][] = [];
  const buildLabor = (i: number, current: number[], left: number) => {
    if (i === size) {
      laborOptions.push([...current]);
      return;
    }
    for (let n = 0; n <= Math.min(params.maxLaborPerPlot, left); n++) {
      current.push(n);
      buildLabor(i + 1, current, left - n);
      current.pop();
    }
  };
  buildLabor(0, [], params.laborDays);

  for (const seeds of seedsOptions) for (const labor of laborOptions) yield { seeds, labor };
}

describe('optimalPlan', () => {
  const everything = [...allPlans()];

  it('is a valid plan for every flood', () => {
    for (const flood of FLOODS) {
      expect(planProblems(params, optimalPlan(params, flood).plan)).toEqual([]);
    }
  });

  it('is never beaten by any other valid plan', () => {
    for (const flood of FLOODS) {
      const best = optimalPlan(params, flood).settlement.surplus;
      let top = Number.NEGATIVE_INFINITY;
      for (const candidate of everything) {
        top = Math.max(top, settle(params, flood, candidate).surplus);
      }
      expect(best, `banjir ${flood} hasta`).toBe(top);
    }
  });

  it('always leaves the family fed when the plan is the best one', () => {
    for (const flood of FLOODS) {
      expect(optimalPlan(params, flood).settlement.hungry, `banjir ${flood} hasta`).toBe(false);
    }
  });

  it('digs a channel in a modest flood and spares the workers in a good one', () => {
    expect(optimalPlan(params, 14).plan.labor).toEqual([0, 0, 0, 1, 0, 0]);
    expect(optimalPlan(params, 15).plan.labor).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('sows the richest plots first', () => {
    expect(optimalPlan(params, 15).plan.seeds).toEqual([3, 3, 3, 3, 0, 0]);
    // the two best plots are lost to an overflow, so the next ones are sown
    expect(optimalPlan(params, 18).plan.seeds).toEqual([0, 0, 3, 3, 3, 3]);
  });
});

describe('starsFor', () => {
  it('gives 3 stars for the best plan', () => {
    for (const flood of FLOODS) {
      expect(starsFor(params, flood, optimalPlan(params, flood).plan)).toBe(3);
    }
  });

  it('gives 1 star when the family goes hungry, and never fewer', () => {
    expect(starsFor(params, 14, emptyPlan(params))).toBe(1);
  });

  it('gives 2 stars for a sensible but not best plan', () => {
    // flood 14, no channel: three plots sown, one hasta short of the fourth
    expect(starsFor(params, 14, plan([3, 3, 3, 0, 0, 0]))).toBe(2);
  });

  it('keeps the star thresholds in order: more surplus never means fewer stars', () => {
    const flood = 15;
    const rank = (seeds: number[]) => starsFor(params, flood, plan(seeds));
    expect(rank([3, 3, 3, 3, 0, 0])).toBeGreaterThanOrEqual(rank([3, 3, 3, 2, 0, 0]));
    expect(rank([3, 3, 3, 2, 0, 0])).toBeGreaterThanOrEqual(rank([3, 3, 0, 0, 0, 0]));
    expect(rank([3, 3, 0, 0, 0, 0])).toBeGreaterThanOrEqual(rank([0, 0, 0, 0, 0, 0]));
  });
});

describe('random floods', () => {
  it('is the same for the same seed', () => {
    expect(randomFlood(params, 42)).toBe(randomFlood(params, 42));
    const a = seededRandom(7);
    const b = seededRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('stays inside the flood range', () => {
    for (let seed = 0; seed < 2000; seed++) {
      const flood = randomFlood(params, seed);
      expect(flood).toBeGreaterThanOrEqual(params.floodRange.min);
      expect(flood).toBeLessThanOrEqual(params.floodRange.max);
    }
  });

  it('follows the weights: middling floods are common, extreme ones are rare', () => {
    const counts = new Map<number, number>();
    const draws = 16000;
    for (let seed = 0; seed < draws; seed++) {
      const flood = randomFlood(params, seed * 7919 + 13);
      counts.set(flood, (counts.get(flood) ?? 0) + 1);
    }
    const totalWeight = params.floodWeights.reduce((a, b) => a + b, 0);
    for (const [offset, weight] of params.floodWeights.entries()) {
      const flood = params.floodRange.min + offset;
      const expected = (draws * weight) / totalWeight;
      expect(counts.get(flood) ?? 0).toBeGreaterThan(expected * 0.8);
      expect(counts.get(flood) ?? 0).toBeLessThan(expected * 1.2);
    }
  });
});

describe('NileFloodParamsSchema', () => {
  const raw = () => structuredClone(params) as Record<string, unknown>;
  const message = (value: unknown) => {
    const result = NileFloodParamsSchema.safeParse(value);
    return result.success ? '' : result.error.issues.map((i) => i.message).join(' | ');
  };

  it('accepts the test parameters', () => {
    expect(NileFloodParamsSchema.safeParse(raw()).success).toBe(true);
  });

  it('wants one weight per flood height', () => {
    expect(message({ ...raw(), floodWeights: [1, 2, 3] })).toMatch(/7 bobot/);
  });

  it('refuses a tax that is not a whole number of baskets', () => {
    const bad = { ...raw(), taxBrackets: [{ upTo: 18, fraction: [1, 7] }] };
    expect(message(bad)).toMatch(/bukan bilangan bulat/);
  });

  it('wants brackets that cover the highest flood', () => {
    const bad = { ...raw(), taxBrackets: [{ upTo: 14, fraction: [1, 4] }] };
    expect(message(bad)).toMatch(/mencakup/);
  });

  it('wants an overflow that leaves some plots standing', () => {
    const bad = { ...raw(), overflood: { from: 18, washedOut: 6 } };
    expect(message(bad)).toMatch(/lebih kecil/);
  });
});
