// Parameters used by the unit tests of the model. They mirror the numbers in
// content/chapters/mesir/missions/m2-tali-penyurvei.yaml (tests/unit/rope-survey.content.test.ts checks
// the real file), written out here because core may not read files.

import { type RopeSurveyParams, RopeSurveyParamsSchema } from './schema';

export const testParams: RopeSurveyParams = RopeSurveyParamsSchema.parse({
  grid: { width: 6, height: 5 },
  rope: { knots: 12, sides: [3, 4, 5] },
  plot: { a: [1, 1], width: 4, height: 3 },
  triangle: { base: 4, height: 10 },
  circle: { diameter: 9 },
  mistakesForTwoStars: 2,
  solutionAfter: 3,
  hints: {
    rope: [
      'Tali punya 12 simpul. Jumlah panjang ketiga sisi segitiga A, B, C harus tepat 12 ruas.',
      'Cari titik C yang membuat AC 3 ruas dan BC 5 ruas. Sisi AB sudah 4 ruas.',
      'Segitiga bersisi 3, 4, dan 5 ruas selalu bersudut siku di antara sisi 3 dan sisi 4, yaitu di A.',
    ],
    corner: [
      'Petak ini persegi panjang: sisi yang berhadapan sama panjang.',
      'D sejajar dengan C di sebelah B, tepat 3 ruas di bawah B.',
    ],
    area: [
      'Satu setat adalah satu kotak (1 khet × 1 khet). Hitung ada berapa kotak di dalam petak.',
      'Luas persegi panjang adalah lebar × tinggi.',
    ],
    triangle: [
      'Segitiga ini separuh dari persegi panjang yang membingkainya (alas 4 × tinggi 10).',
      'Luas segitiga = ½ × alas × tinggi.',
    ],
    circle: [
      'Cara Mesir: kurangi diameter dengan 1/9 dari diameter itu.',
      'Kalikan sisanya dengan dirinya sendiri: itulah luas dalam setat.',
    ],
  },
});
