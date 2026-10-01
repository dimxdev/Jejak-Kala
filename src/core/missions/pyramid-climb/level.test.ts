import { describe, expect, it } from 'vitest';
import {
  canReach,
  gapBetween,
  groundAt,
  type Ledge,
  ledgeAt,
  levelProblems,
  pickupReachable,
  progressAt,
  reachableFrom,
} from './level';
import { jumpHeight } from './physics';

const ledges: Ledge[] = [
  { x: 0, y: 1000, w: 600 },
  { x: 600, y: 960, w: 400 }, // a step up of 40
  { x: 1160, y: 960, w: 800 }, // a gap of 160, level
  { x: 1960, y: 880, w: 1040 }, // a step up of 80
];

const level = (patch: Partial<Parameters<typeof levelProblems>[0]> = {}) => ({
  world: { width: 3000, height: 1400 },
  start: { x: 100 },
  goal: { x: 2800 },
  ledges,
  gates: [{ x: 300 }, { x: 1560 }, { x: 2460 }],
  checkpoints: [] as number[],
  rods: [
    { x: 300, y: 880 },
    { x: 1500, y: 840 },
    { x: 2400, y: 760 },
  ],
  scorpions: [],
  swingers: [],
  ...patch,
});

const messages = (patch?: Parameters<typeof level>[0]) =>
  levelProblems(level(patch)).map((p) => p.message);

describe('ledges', () => {
  it('measures the empty space between two ledges, 0 when they touch', () => {
    const [a, b, c] = ledges as [Ledge, Ledge, Ledge];
    expect(gapBetween(a, b)).toBe(0);
    expect(gapBetween(b, c)).toBe(160);
    expect(gapBetween(c, b)).toBe(160);
  });

  it('finds the ground under a point: the highest ledge wins, a gap has none', () => {
    expect(groundAt(ledges, 100)).toBe(1000);
    expect(groundAt(ledges, 700)).toBe(960);
    expect(groundAt(ledges, 1100)).toBeNull();
    const stacked = [
      { x: 0, y: 900, w: 500 },
      { x: 200, y: 800, w: 200 },
    ];
    expect(ledgeAt(stacked, 300)).toBe(1);
    expect(ledgeAt(stacked, 100)).toBe(0);
    expect(ledgeAt(stacked, 900)).toBe(-1);
  });

  it('lets the player step up what he can jump and drop from anything', () => {
    const low = { x: 0, y: 1000, w: 300 };
    const step = { x: 300, y: 1000 - jumpHeight() * 0.8, w: 300 };
    const wall = { x: 300, y: 1000 - jumpHeight() * 0.95, w: 300 };
    expect(canReach(low, step)).toBe(true);
    expect(canReach(low, wall)).toBe(false); // would need a perfect jump
    expect(canReach(wall, low)).toBe(true);
  });

  it('asks for a shorter jump over a gap when the landing is higher', () => {
    const from = { x: 0, y: 1000, w: 300 };
    expect(canReach(from, { x: 300 + 190, y: 1000, w: 300 })).toBe(true);
    expect(canReach(from, { x: 300 + 190, y: 900, w: 300 })).toBe(false);
    expect(canReach(from, { x: 300 + 220, y: 1000, w: 300 })).toBe(false);
    expect(canReach(from, { x: 300 + 220, y: 1100, w: 300 })).toBe(true); // a drop carries farther
  });

  it('finds every ledge that can be reached from the start', () => {
    expect([...reachableFrom(ledges, 0)].sort()).toEqual([0, 1, 2, 3]);
    const cut = [...ledges.slice(0, 2), { x: 1700, y: 960, w: 400 }]; // a gap of 700
    expect([...reachableFrom(cut, 0)].sort()).toEqual([0, 1]);
  });
});

describe('pick-ups and progress', () => {
  it('can be touched only if a safe jump from the ledge below gets there', () => {
    expect(pickupReachable(ledges, { x: 300, y: 880 })).toBe(true);
    expect(pickupReachable(ledges, { x: 300, y: 600 })).toBe(false);
    expect(pickupReachable(ledges, { x: 1100, y: 900 })).toBe(false); // over a gap: no ledge under it
  });

  it('counts the share of the climb covered, held between 0 and 1', () => {
    expect(progressAt(100, 2100, 100)).toBe(0);
    expect(progressAt(100, 2100, 1100)).toBe(0.5);
    expect(progressAt(100, 2100, 5000)).toBe(1);
    expect(progressAt(100, 2100, -50)).toBe(0);
    expect(progressAt(500, 500, 500)).toBe(0);
  });
});

describe('level problems', () => {
  it('finds nothing wrong with a good level', () => {
    expect(messages()).toEqual([]);
  });

  it('catches a ledge outside the world', () => {
    expect(messages({ world: { width: 2500, height: 1400 } }).join()).toMatch(/lebar dunia/);
    expect(messages({ world: { width: 3000, height: 900 } }).join()).toMatch(/dasar dunia/);
  });

  it('catches a ledge that cannot be reached', () => {
    const far = [...ledges, { x: 3300, y: 880, w: 400 }];
    expect(messages({ ledges: far, world: { width: 4000, height: 1400 } }).join()).toMatch(
      /tidak terjangkau dari titik mulai/,
    );
  });

  it('catches a step that is too high', () => {
    const wall = [ledges[0] as Ledge, { x: 600, y: 780, w: 2400 }];
    const found = messages({ ledges: wall, gates: [{ x: 300 }, { x: 1000 }, { x: 2000 }] });
    expect(found.join()).toMatch(/tidak terjangkau/);
  });

  it('catches a dead end: somewhere he can drop to but never climb out of', () => {
    const trap: Ledge[] = [
      { x: 0, y: 700, w: 700 },
      { x: 800, y: 1000, w: 600 }, // a drop of 300, reachable
      { x: 1500, y: 700, w: 1500 }, // 300 above the pit: cannot be climbed
    ];
    const found = messages({
      ledges: trap,
      gates: [{ x: 300 }, { x: 2000 }, { x: 2400 }],
      rods: [
        { x: 300, y: 600 },
        { x: 2000, y: 600 },
        { x: 2400, y: 600 },
      ],
    });
    expect(found.join()).toMatch(/jalan buntu/);
  });

  it('wants the start and the summit on ledges, in order, with the gates between', () => {
    expect(messages({ start: { x: 1100 } }).join()).toMatch(/titik mulai tidak berada/);
    expect(messages({ goal: { x: 5000 } }).join()).toMatch(/titik puncak tidak berada/);
    expect(messages({ gates: [{ x: 1560 }, { x: 300 }, { x: 2460 }] }).join()).toMatch(/urutan x/);
  });

  it('gives each gate room on both sides of it', () => {
    expect(messages({ gates: [{ x: 50 }, { x: 1560 }, { x: 2460 }] }).join()).toMatch(/lega/);
    expect(messages({ gates: [{ x: 300 }, { x: 1100 }, { x: 2460 }] }).join()).toMatch(
      /tidak berdiri di atas ledge/,
    );
  });

  it('catches a rod that no jump can touch', () => {
    expect(
      messages({
        rods: [
          { x: 300, y: 400 },
          { x: 1500, y: 840 },
          { x: 2400, y: 760 },
        ],
      }).join(),
    ).toMatch(/tongkat tidak terjangkau/);
  });

  describe('checkpoints', () => {
    it('accepts one on a ledge between the start and the summit, away from the gates', () => {
      expect(messages({ checkpoints: [800, 2100] })).toEqual([]);
    });

    it('catches one over a gap, outside the climb, out of order, or right at a gate', () => {
      expect(messages({ checkpoints: [1100] }).join()).toMatch(/tidak berada di atas ledge/);
      expect(messages({ checkpoints: [50] }).join()).toMatch(/antara titik mulai dan puncak/);
      expect(messages({ checkpoints: [2100, 800] }).join()).toMatch(/berurutan/);
      expect(messages({ checkpoints: [1500] }).join()).toMatch(/terlalu dekat dengan gerbang/);
    });
  });

  describe('hazards', () => {
    it('lets a scorpion patrol one ledge, away from the places the player starts again', () => {
      const ok = { x1: 800, x2: 1000, y: 960, speed: 80 };
      expect(messages({ scorpions: [ok] })).toEqual([]);
      expect(messages({ scorpions: [{ ...ok, y: 900 }] }).join()).toMatch(/satu ledge/);
      expect(messages({ scorpions: [{ ...ok, x1: 500, x2: 700 }] }).join()).toMatch(/satu ledge/);
      // spans two ledges
      expect(messages({ scorpions: [{ ...ok, x1: 1900, x2: 2100 }] }).join()).toMatch(/satu ledge/);
      expect(messages({ scorpions: [{ x1: 1600, x2: 1800, y: 960, speed: 80 }] }).join()).toMatch(
        /terlalu dekat/,
      );
    });

    it('wants a block that can hit the player when it hangs down and clears his head at the ends', () => {
      // a long top ledge with the gates far from the block; the ground under it is at y = 880
      const wide = {
        world: { width: 5000, height: 1400 },
        ledges: [...ledges.slice(0, 3), { x: 1960, y: 880, w: 3040 }],
        goal: { x: 4800 },
        gates: [{ x: 300 }, { x: 1560 }, { x: 4400 }],
        rods: [
          { x: 300, y: 880 },
          { x: 1500, y: 840 },
          { x: 4400, y: 760 },
        ],
      };
      const swing = { x: 2600, y: 490, length: 300, amplitude: 55, period: 3.6, phase: 0 };
      const found = (swingers: Array<typeof swing>) =>
        messages({ ...wide, swingers }).filter((m) => /balok/.test(m));

      expect(messages({ ...wide })).toEqual([]);
      expect(found([swing])).toEqual([]);
      expect(found([{ ...swing, y: 100 }]).join()).toMatch(/terlalu tinggi/);
      expect(found([{ ...swing, y: 560, amplitude: 20 }]).join()).toMatch(/terlalu rendah/);
      expect(found([{ ...swing, x: 1100 }]).join()).toMatch(/di atas ledge/);
      expect(found([{ ...swing, x: 1700 }]).join()).toMatch(/terlalu dekat/); // swings over a gate
      // the whole swing zone must lie on one flat stretch of ground
      expect(found([{ ...swing, x: 2150 }]).join()).toMatch(/tanah datar yang sama/);
      // a fast, wide swing leaves no moment to run through
      expect(found([{ ...swing, amplitude: 78, period: 2 }]).join()).toMatch(/terlalu rapat/);
    });
  });
});
