import { describe, expect, it } from 'vitest';
import { starsFor } from './model';
import type { PyramidClimbParams } from './schema';

// only the numbers the scoring reads
const params = { mistakesForTwoStars: 2, rods: [{}, {}, {}] } as unknown as PyramidClimbParams;

describe('stars of the climb', () => {
  it('gives one star for reaching the summit', () => {
    expect(starsFor(params, { mistakes: 5, assisted: false, rods: 0 })).toBe(1);
  });

  it('adds a star for a clean run at the gates', () => {
    expect(starsFor(params, { mistakes: 0, assisted: false, rods: 0 })).toBe(2);
    expect(starsFor(params, { mistakes: 2, assisted: false, rods: 2 })).toBe(2);
    expect(starsFor(params, { mistakes: 3, assisted: false, rods: 2 })).toBe(1);
  });

  it('adds a star for collecting all three rods', () => {
    expect(starsFor(params, { mistakes: 3, assisted: false, rods: 3 })).toBe(2);
  });

  it('gives three stars for a clean run and all the rods', () => {
    expect(starsFor(params, { mistakes: 1, assisted: false, rods: 3 })).toBe(3);
  });

  it('caps the mission at one star once a solution was shown', () => {
    expect(starsFor(params, { mistakes: 0, assisted: true, rods: 3 })).toBe(1);
  });
});
