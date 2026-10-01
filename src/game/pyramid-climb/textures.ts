// The blocks the ledges are built of, drawn in code. They follow the flat storybook style (sand fill, a
// darker line in the same colour family, a little grain) so no picture file is needed and a ledge of any
// size is cheap: the scene tiles these two small textures.

import type * as Phaser from 'phaser';

export const BLOCK_KEY = 'ledge-block';
export const CAP_KEY = 'ledge-cap';
export const CAP_HEIGHT = 18;

const SAND = 0xe4bc93;
const SAND_LIGHT = 0xf0d3ab;
const CLAY = 0xc08d69;
const TERRACOTTA = 0xbd7542;
const GRAIN = 0xd6a97d;

/** A tiny repeatable pseudo-random sequence, so the grain is the same on every run. */
function sequence(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function makeLedgeTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(BLOCK_KEY)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  // two rows of limestone blocks, 128 x 64: joints at x = 0 in the top row and x = 64 in the bottom row
  g.fillStyle(SAND, 1);
  g.fillRect(0, 0, 128, 64);
  const random = sequence(7);
  g.fillStyle(GRAIN, 1);
  for (let i = 0; i < 46; i++)
    g.fillRect(Math.floor(random() * 126), Math.floor(random() * 62), 3, 2);
  g.lineStyle(2, SAND_LIGHT, 1); // a light edge on the top and left of every block
  for (const [x, y, w] of [
    [2, 2, 124],
    [2, 34, 124],
  ] as const) {
    g.lineBetween(x, y, x + w, y);
  }
  g.lineStyle(3, CLAY, 1); // the mortar joints
  g.lineBetween(0, 0, 128, 0);
  g.lineBetween(0, 32, 128, 32);
  g.lineBetween(1, 0, 1, 32);
  g.lineBetween(65, 32, 65, 64);
  g.generateTexture(BLOCK_KEY, 128, 64);

  // the top of a ledge: a lighter slab with a darker lower edge
  g.clear();
  g.fillStyle(SAND_LIGHT, 1);
  g.fillRect(0, 0, 128, CAP_HEIGHT);
  g.fillStyle(GRAIN, 1);
  const grain = sequence(21);
  for (let i = 0; i < 10; i++)
    g.fillRect(Math.floor(grain() * 124), 3 + Math.floor(grain() * 8), 4, 2);
  g.lineStyle(3, TERRACOTTA, 1);
  g.lineBetween(0, CAP_HEIGHT - 1.5, 128, CAP_HEIGHT - 1.5);
  g.generateTexture(CAP_KEY, 128, CAP_HEIGHT);

  g.destroy();
}
