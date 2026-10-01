import { describe, expect, it } from 'vitest';
import { jumpHeight, jumpReach, PLAYER, SAFETY } from './physics';

describe('jump physics', () => {
  it('rises v² / 2g and stays in the air for 2v / g', () => {
    expect(jumpHeight()).toBeCloseTo(136.1, 1);
    // back at the take-off height: 2 * 700 / 1800 seconds at 300 px/s
    expect(jumpReach(0)).toBeCloseTo(PLAYER.speed * ((2 * PLAYER.jumpSpeed) / PLAYER.gravity), 6);
  });

  it('reaches less far for a higher landing and farther for a lower one', () => {
    expect(jumpReach(80)).toBeLessThan(jumpReach(0));
    expect(jumpReach(-80)).toBeGreaterThan(jumpReach(0));
  });

  it('reaches nothing above the top of the jump', () => {
    expect(jumpReach(jumpHeight() + 1)).toBe(0);
    expect(jumpReach(jumpHeight() - 1)).toBeGreaterThan(0); // just below the top still counts
  });

  it('keeps the safety margin below 1', () => {
    expect(SAFETY).toBeGreaterThan(0);
    expect(SAFETY).toBeLessThan(1);
  });
});
