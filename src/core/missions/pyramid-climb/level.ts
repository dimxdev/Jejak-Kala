// The shape of the climb and the questions the checks ask about it: where the ground is, what can be
// reached from where, and whether the whole level can be finished. All pure functions.
//
// A level is a list of ledges: a solid column of blocks whose top surface starts at (x, y) and is `w`
// wide. y grows downward, as in the Phaser scene. Ledges may touch or overlap (the higher one wins).

import { BLOCK_SIZE, type ScorpionDef, type SwingerDef, swingerCrossableShare } from './hazards';
import { jumpHeight, jumpReach, PLAYER, SAFETY } from './physics';

export interface Ledge {
  x: number;
  y: number;
  w: number;
}

/** The narrowest ledge: wide enough for a run-up and for landing. */
export const MIN_LEDGE_WIDTH = 120;

/** How far a pick-up reaches: the player collects it when his centre comes this close. */
export const PICKUP_RADIUS = 56;

/** The horizontal empty space between two ledges (0 when they touch or overlap). */
export function gapBetween(a: Ledge, b: Ledge): number {
  return Math.max(0, b.x - (a.x + a.w), a.x - (b.x + b.w));
}

/** Can a player standing anywhere on `from` jump (or walk, or drop) to `to`, without a perfect jump? */
export function canReach(from: Ledge, to: Ledge): boolean {
  const rise = from.y - to.y; // positive: `to` is higher
  if (rise > jumpHeight() * SAFETY) return false;
  return gapBetween(from, to) <= jumpReach(rise) * SAFETY;
}

/** The index of the ledge whose top surface is at `x` (the highest one when several cover it), or -1. */
export function ledgeAt(ledges: readonly Ledge[], x: number): number {
  let best = -1;
  ledges.forEach((ledge, index) => {
    if (x < ledge.x || x > ledge.x + ledge.w) return;
    const current = ledges[best];
    if (!current || ledge.y < current.y) best = index;
  });
  return best;
}

/** The height of the ground at `x`, or null over a gap. */
export function groundAt(ledges: readonly Ledge[], x: number): number | null {
  const index = ledgeAt(ledges, x);
  return index === -1 ? null : (ledges[index]?.y ?? null);
}

/** Every ledge a player can get to from ledge `start`, the start included. */
export function reachableFrom(ledges: readonly Ledge[], start: number): Set<number> {
  const seen = new Set<number>([start]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const from = ledges[queue[head] as number];
    if (!from) continue;
    ledges.forEach((to, index) => {
      if (!seen.has(index) && canReach(from, to)) {
        seen.add(index);
        queue.push(index);
      }
    });
  }
  return seen;
}

/** A pick-up (a golden cubit rod) floating at (x, y), the centre of the picture. */
export interface Pickup {
  x: number;
  y: number;
}

/**
 * Can the pick-up be touched by jumping from the ledge under it? The player's centre stands
 * `height / 2` above the ledge and rises up to the safe jump height from there.
 */
export function pickupReachable(ledges: readonly Ledge[], pickup: Pickup): boolean {
  const index = ledgeAt(ledges, pickup.x);
  const ledge = ledges[index];
  if (!ledge) return false;
  const standing = ledge.y - PLAYER.height / 2;
  return standing - pickup.y <= jumpHeight() * SAFETY + PICKUP_RADIUS;
}

/** The share of the climb (0 to 1) that the player has covered when he is at `x`. */
export function progressAt(startX: number, goalX: number, x: number): number {
  if (goalX <= startX) return 0;
  return Math.min(1, Math.max(0, (x - startX) / (goalX - startX)));
}

export interface LevelProblem {
  path: Array<string | number>;
  message: string;
}

interface LevelShape {
  world: { width: number; height: number };
  start: { x: number };
  goal: { x: number };
  ledges: readonly Ledge[];
  gates: ReadonlyArray<{ x: number }>;
  checkpoints: readonly number[];
  rods: readonly Pickup[];
  scorpions: readonly ScorpionDef[];
  swingers: readonly SwingerDef[];
}

/** Room a gate needs on both sides of it, on its own ledge: space to stop in front and to walk on after. */
const GATE_ROOM = 200;

/** Hazards keep this far from the points where the player starts again, so a restart is never unfair. */
const CHECKPOINT_CLEARANCE = 250;

/** At least this share of the moments must let a player run straight through a swinging block's zone. */
const MIN_SWING_WINDOW = 0.12;

/** Everything that would make the level unplayable. An empty list means it can be finished. */
export function levelProblems(level: LevelShape): LevelProblem[] {
  const problems: LevelProblem[] = [];
  const add = (path: Array<string | number>, message: string) => problems.push({ path, message });
  const { ledges } = level;

  ledges.forEach((ledge, i) => {
    if (ledge.x + ledge.w > level.world.width)
      add(['ledges', i], 'ledge melewati batas lebar dunia (world.width)');
    if (ledge.y >= level.world.height)
      add(['ledges', i], 'permukaan ledge harus di atas dasar dunia (world.height)');
  });

  const startLedge = ledgeAt(ledges, level.start.x);
  const goalLedge = ledgeAt(ledges, level.goal.x);
  if (startLedge === -1) add(['start', 'x'], 'titik mulai tidak berada di atas ledge');
  if (goalLedge === -1) add(['goal', 'x'], 'titik puncak tidak berada di atas ledge');

  const stops = [level.start.x, ...level.gates.map((g) => g.x), level.goal.x];
  for (let i = 1; i < stops.length; i++) {
    if ((stops[i] as number) <= (stops[i - 1] as number)) {
      add(['gates'], 'urutan x harus naik: start, gerbang 1, 2, 3, lalu puncak');
      break;
    }
  }

  level.gates.forEach((gate, i) => {
    const ledge = ledges[ledgeAt(ledges, gate.x)];
    if (!ledge) {
      add(['gates', i, 'x'], 'gerbang tidak berdiri di atas ledge');
    } else if (gate.x - ledge.x < GATE_ROOM || ledge.x + ledge.w - gate.x < GATE_ROOM) {
      add(
        ['gates', i, 'x'],
        `ledge gerbang harus lega: sisakan ${GATE_ROOM} px di kiri dan kanannya`,
      );
    }
  });

  if (startLedge !== -1 && goalLedge !== -1) {
    const fromStart = reachableFrom(ledges, startLedge);
    ledges.forEach((_, i) => {
      if (!fromStart.has(i)) add(['ledges', i], 'ledge tidak terjangkau dari titik mulai');
    });
    // no dead ends: from every ledge the player can still reach the summit
    fromStart.forEach((i) => {
      if (!reachableFrom(ledges, i).has(goalLedge))
        add(['ledges', i], 'jalan buntu: dari ledge ini puncak tidak terjangkau');
    });
  }

  level.rods.forEach((rod, i) => {
    if (!pickupReachable(ledges, rod)) add(['rods', i], 'tongkat tidak terjangkau dengan lompatan');
  });

  level.checkpoints.forEach((x, i) => {
    if (ledgeAt(ledges, x) === -1)
      add(['checkpoints', i], 'pos pemeriksaan tidak berada di atas ledge');
    if (x <= level.start.x || x >= level.goal.x)
      add(['checkpoints', i], 'pos pemeriksaan harus di antara titik mulai dan puncak');
    if (i > 0 && x <= (level.checkpoints[i - 1] as number))
      add(['checkpoints', i], 'pos pemeriksaan harus berurutan naik');
    if (level.gates.some((gate) => Math.abs(gate.x - x) < 300))
      add(['checkpoints', i], 'pos pemeriksaan terlalu dekat dengan gerbang (< 300 px)');
  });

  const checkpoints = [level.start.x, ...level.checkpoints, ...level.gates.map((g) => g.x)];
  const tooClose = (from: number, to: number) =>
    checkpoints.some((x) => x > from - CHECKPOINT_CLEARANCE && x < to + CHECKPOINT_CLEARANCE);

  level.scorpions.forEach((scorpion, i) => {
    const index = ledgeAt(ledges, scorpion.x1);
    const ledge = ledges[index];
    if (!ledge || ledgeAt(ledges, scorpion.x2) !== index || ledge.y !== scorpion.y)
      add(
        ['scorpions', i],
        'kalajengking harus berpatroli di atas satu ledge (y sama dengan permukaannya)',
      );
    if (tooClose(scorpion.x1, scorpion.x2))
      add(
        ['scorpions', i],
        `kalajengking terlalu dekat dengan titik mulai atau gerbang (< ${CHECKPOINT_CLEARANCE} px)`,
      );
  });

  level.swingers.forEach((swinger, i) => {
    const ground = groundAt(ledges, swinger.x);
    if (ground === null) {
      add(['swingers', i], 'balok ayun harus tergantung di atas ledge');
      return;
    }
    const radians = (swinger.amplitude * Math.PI) / 180;
    const lowest = swinger.y + swinger.length + BLOCK_SIZE / 2;
    const highest = swinger.y + swinger.length * Math.cos(radians) + BLOCK_SIZE / 2;
    // hanging straight down it must be able to hit the player, and at the ends of its swing it must be
    // above his head, so there is always a moment to run through
    if (lowest < ground - PLAYER.height * 0.6)
      add(['swingers', i], 'balok terlalu tinggi: di titik terendah ia harus bisa mengenai pemain');
    if (highest > ground - PLAYER.height - 10)
      add(
        ['swingers', i],
        'balok terlalu rendah: di ujung ayunan ia harus lebih tinggi dari kepala pemain',
      );
    const reach = swinger.length * Math.sin(radians) + BLOCK_SIZE / 2;
    // the player must be able to run through the whole swing zone on flat ground, in a gap between swings
    if (
      groundAt(ledges, swinger.x - reach - 40) !== ground ||
      groundAt(ledges, swinger.x + reach + 40) !== ground
    )
      add(['swingers', i], 'jangkauan ayunan balok harus seluruhnya di atas tanah datar yang sama');
    else if (swingerCrossableShare(swinger, ground) < MIN_SWING_WINDOW)
      add(
        ['swingers', i],
        'balok ayun terlalu rapat: tidak ada celah waktu untuk berlari melewatinya',
      );
    if (tooClose(swinger.x - reach, swinger.x + reach))
      add(
        ['swingers', i],
        `balok ayun terlalu dekat dengan titik mulai atau gerbang (< ${CHECKPOINT_CLEARANCE} px)`,
      );
  });

  return problems;
}
