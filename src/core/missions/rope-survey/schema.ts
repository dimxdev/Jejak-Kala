// Parameters of the "Tali Para Penyurvei" mission (M2 of Mesir): restore a flooded plot with a knotted
// rope, find its area in setat, then the area of a triangle and (as the 3-star challenge) of a circle,
// with the Egyptian methods of the Rhind Mathematical Papyrus. They live in the mission's YAML under
// `params`; the rules are in ./model.ts.

import { z } from 'zod';
import { text } from '../../content/primitives';

const int = z.number().int();
const count = int.min(0);
const positive = int.positive();

/** A point on the survey grid: [x, y], x to the right, y downward, in units of one khet. */
export const PointSchema = z.tuple([int, int]);
export type Point = z.infer<typeof PointSchema>;

/** Hints per task, most general first; shown one by one in Santai mode. */
const hints = z.array(text).min(1);

export const RopeSurveyParamsSchema = z
  .object({
    /** the field has grid points from (0, 0) to (width, height) */
    grid: z.object({ width: positive, height: positive }),
    /** the knotted rope: how many knots, and the three sides (in knots) it is laid out into */
    rope: z.object({ knots: positive, sides: z.tuple([positive, positive, positive]) }),
    /** stakes A and B = A + (width, 0) survived the flood; the player sets C and D */
    plot: z.object({ a: PointSchema, width: positive, height: positive }),
    /** Rhind problem 51 */
    triangle: z.object({ base: positive, height: positive }),
    /** Rhind problem 50 */
    circle: z.object({ diameter: positive }),
    /** mistakes in the main tasks that still earn the second star */
    mistakesForTwoStars: count,
    /** mistakes on one task after which "Lihat solusi" appears */
    solutionAfter: positive,
    hints: z.object({
      rope: hints,
      corner: hints,
      area: hints,
      triangle: hints,
      circle: hints,
    }),
  })
  .superRefine((params, ctx) => {
    const fail = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    const [short, long, hypotenuse] = params.rope.sides;
    const { a, width, height } = params.plot;

    if (!(short <= long && long < hypotenuse))
      fail(['rope', 'sides'], 'urutkan sisi dari kecil ke besar');
    if (short ** 2 + long ** 2 !== hypotenuse ** 2) {
      fail(['rope', 'sides'], 'sisi tali harus membentuk segitiga siku-siku (a² + b² = c²)');
    }
    if (short + long + hypotenuse !== params.rope.knots) {
      fail(['rope', 'knots'], 'jumlah simpul harus sama dengan jumlah ketiga sisi');
    }

    // the plot is the rectangle the rope can lay out: AB = long side, AC = short side
    if (width !== long) fail(['plot', 'width'], 'lebar petak harus sama dengan sisi panjang tali');
    if (height !== short)
      fail(['plot', 'height'], 'tinggi petak harus sama dengan sisi pendek tali');

    const inGrid = (x: number, y: number) =>
      x >= 0 && y >= 0 && x <= params.grid.width && y <= params.grid.height;
    if (!inGrid(a[0], a[1]) || !inGrid(a[0] + width, a[1] + height)) {
      fail(['plot'], 'petak harus muat di dalam grid');
    }
    // the right angle at A can be built to the south or to the north; only one may fit, so C is unique
    if (inGrid(a[0], a[1] - height)) {
      fail(
        ['plot', 'a'],
        'sudut siku bisa dibuat ke dua arah: geser A supaya hanya satu arah yang muat',
      );
    }

    if ((params.triangle.base * params.triangle.height) % 2 !== 0) {
      fail(['triangle'], 'luas segitiga harus bilangan bulat (alas × tinggi genap)');
    }
    if (params.circle.diameter % 9 !== 0) {
      fail(
        ['circle', 'diameter'],
        'diameter harus kelipatan 9 supaya cara Mesir menghasilkan bilangan bulat',
      );
    }
  });

export type RopeSurveyParams = z.infer<typeof RopeSurveyParamsSchema>;
