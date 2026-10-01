// Parameters of the "Banjir Nil" mission (M1 of Mesir). They live in the mission's YAML under `params`,
// so the numbers can be tuned without touching code. The rules that use them are in ./model.ts.
//
// The model is a deliberately simple game model, not a reconstruction of Old Kingdom farming. The
// mission says so to the player, and the Kodeks separates what the sources say from what the game
// invented (docs/plan-mesir.md, M1).

import { z } from 'zod';
import { slug, text } from '../../content/primitives';

const int = z.number().int();
const count = int.min(0);
const positive = int.positive();

/** A fraction written [numerator, denominator], e.g. [1, 4] for a quarter. */
export const FractionSchema = z.tuple([count, positive]);
export type Fraction = z.infer<typeof FractionSchema>;

export const PlotSchema = z.object({
  id: slug,
  /** name shown on the plot, e.g. "Tepi sungai" */
  name: text,
  /** one line about the plot, shown in Santai mode */
  note: text.optional(),
  /** flood height, in hasta, that has to be reached to water this plot */
  needs: int,
  /** baskets of grain harvested per basket of seed sown */
  yield: positive,
});

export const NileFloodParamsSchema = z
  .object({
    plots: z.array(PlotSchema).min(3).max(8),

    /** lowest and highest flood height (hasta) a year can bring */
    floodRange: z.object({ min: int, max: int }),
    /** weight of each height from min to max when the flood is drawn at random (Tantangan) */
    floodWeights: z.array(positive),
    /** the fixed flood height of Santai mode */
    relaxedFlood: int,
    /** a flood of at least `from` hasta breaks the dikes: the `washedOut` lowest plots are lost */
    overflood: z.object({ from: int, washedOut: count }),
    /** what each flood height means for the year, shown next to the reading (first match wins) */
    floodMoods: z.array(z.object({ upTo: int, label: text })).min(1),

    /** baskets of seed grain the family can sow */
    seedBaskets: positive,
    maxSeedsPerPlot: positive,
    /** days of work that dig a channel: each day on a plot lets the flood reach 1 hasta higher there */
    laborDays: count,
    maxLaborPerPlot: count,
    /** baskets of grain paid to the workers (bread and beer) for each labor day */
    laborCost: count,
    /** baskets the family eats in a year */
    familyNeed: positive,

    /** the scribes assume every plot the flood reaches yields this much, whatever is really sown */
    assessedPerPlot: positive,
    /** share of the assessed harvest owed as tax, by flood height (first bracket with flood <= upTo) */
    taxBrackets: z.array(z.object({ upTo: int, fraction: FractionSchema })).min(1),

    /** share of the best possible surplus needed for 3 and for 2 stars */
    stars: z.object({ three: z.number().min(0).max(1), two: z.number().min(0).max(1) }),
  })
  .superRefine((params, ctx) => {
    const fail = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    const { min, max } = params.floodRange;

    if (min > max) fail(['floodRange'], 'min harus <= max');
    if (params.floodWeights.length !== max - min + 1) {
      fail(['floodWeights'], `harus berisi ${max - min + 1} bobot (satu per tinggi banjir)`);
    }
    if (params.relaxedFlood < min || params.relaxedFlood > max) {
      fail(['relaxedFlood'], 'harus berada di dalam floodRange');
    }
    if (params.overflood.washedOut >= params.plots.length) {
      fail(['overflood', 'washedOut'], 'harus lebih kecil daripada jumlah ladang');
    }
    if (params.stars.three < params.stars.two) fail(['stars'], 'three harus >= two');

    const ascending = (list: { upTo: number }[]) =>
      list.every(
        (item, i) => i === 0 || item.upTo > (list[i - 1]?.upTo ?? Number.NEGATIVE_INFINITY),
      );
    if (!ascending(params.taxBrackets)) fail(['taxBrackets'], 'upTo harus naik');
    if (!ascending(params.floodMoods)) fail(['floodMoods'], 'upTo harus naik');
    if ((params.taxBrackets.at(-1)?.upTo ?? min) < max) {
      fail(['taxBrackets'], 'bracket terakhir harus mencakup tinggi banjir tertinggi');
    }
    if ((params.floodMoods.at(-1)?.upTo ?? min) < max) {
      fail(['floodMoods'], 'entri terakhir harus mencakup tinggi banjir tertinggi');
    }

    // tax must come out in whole baskets for every possible flood, so the sums shown to the player are exact
    for (let flood = min; flood <= max; flood++) {
      const reached = params.plots.filter((plot) => plot.needs <= flood).length;
      const bracket = params.taxBrackets.find((b) => flood <= b.upTo);
      if (!bracket) continue;
      const [num, den] = bracket.fraction;
      if ((reached * params.assessedPerPlot * num) % den !== 0) {
        fail(
          ['taxBrackets'],
          `pajak untuk banjir ${flood} hasta bukan bilangan bulat (${reached * params.assessedPerPlot} x ${num}/${den})`,
        );
      }
    }
  });

export type Plot = z.infer<typeof PlotSchema>;
export type NileFloodParams = z.infer<typeof NileFloodParamsSchema>;
