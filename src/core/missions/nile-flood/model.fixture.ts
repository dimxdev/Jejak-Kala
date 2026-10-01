// Parameters used by the unit tests of the model. They mirror the numbers in
// content/chapters/mesir/missions/m1-banjir-nil.yaml (tests/unit/nile-flood.content.test.ts checks the
// real file), written out here because core may not read files.

import { type NileFloodParams, NileFloodParamsSchema } from './schema';

export const testParams: NileFloodParams = NileFloodParamsSchema.parse({
  plots: [
    {
      id: 'tepi-sungai',
      name: 'Tepi sungai',
      note: 'Paling subur dan paling dulu terairi, tetapi pertama yang hanyut kalau tanggul jebol.',
      needs: 12,
      yield: 6,
    },
    {
      id: 'lahan-rendah',
      name: 'Lahan rendah',
      note: 'Subur dan cepat terairi.',
      needs: 13,
      yield: 6,
    },
    {
      id: 'lahan-tengah',
      name: 'Lahan tengah',
      note: 'Hasil sedang, terairi bila banjir cukup.',
      needs: 14,
      yield: 5,
    },
    {
      id: 'dekat-desa',
      name: 'Dekat desa',
      note: 'Hasil sedang, butuh banjir yang lumayan besar.',
      needs: 15,
      yield: 5,
    },
    {
      id: 'lahan-tinggi',
      name: 'Lahan tinggi',
      note: 'Aman dari tanggul jebol, tetapi hasilnya lebih sedikit.',
      needs: 16,
      yield: 4,
    },
    {
      id: 'lereng-gurun',
      name: 'Lereng gurun',
      note: 'Hanya basah kalau banjir sangat besar.',
      needs: 17,
      yield: 4,
    },
  ],
  floodRange: { min: 12, max: 18 },
  floodWeights: [1, 2, 3, 4, 3, 2, 1],
  relaxedFlood: 14,
  overflood: { from: 18, washedOut: 2 },
  floodMoods: [
    { upTo: 12, label: 'Paceklik' },
    { upTo: 13, label: 'Kurang' },
    { upTo: 14, label: 'Lumayan' },
    { upTo: 15, label: 'Cukup' },
    { upTo: 16, label: 'Berlimpah' },
    { upTo: 17, label: 'Terlalu besar' },
    { upTo: 18, label: 'Bencana' },
  ],
  seedBaskets: 12,
  maxSeedsPerPlot: 3,
  laborDays: 2,
  maxLaborPerPlot: 1,
  laborCost: 1,
  familyNeed: 20,
  assessedPerPlot: 12,
  taxBrackets: [
    { upTo: 12, fraction: [0, 1] },
    { upTo: 13, fraction: [1, 6] },
    { upTo: 16, fraction: [1, 4] },
    { upTo: 17, fraction: [1, 3] },
    { upTo: 18, fraction: [1, 6] },
  ],
  stars: { three: 0.9, two: 0.6 },
});
