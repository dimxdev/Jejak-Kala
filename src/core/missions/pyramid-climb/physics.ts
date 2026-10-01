// How Hemiunu moves. The Phaser scene and the level checks both read these numbers, so a level that
// passes `content:check` can really be played: "can he make this jump?" is a calculation, not a guess.
// Units: pixels and seconds, in a 1280 x 720 view.

export const VIEW = { width: 1280, height: 720 } as const;

export const PLAYER = {
  /** the collision box (the picture is a little larger) */
  width: 44,
  height: 104,
  /** walking speed */
  speed: 300,
  /** upward speed at the start of a jump */
  jumpSpeed: 700,
  gravity: 1800,
  /** a jump pressed this long after leaving a ledge still works */
  coyoteSeconds: 0.11,
  /** a jump pressed this long before landing is remembered */
  bufferSeconds: 0.13,
} as const;

/** A level may ask for at most this share of what the physics allows, so it never needs a perfect jump. */
export const SAFETY = 0.85;

/** The highest a jump rises above the take-off point. */
export function jumpHeight(): number {
  return PLAYER.jumpSpeed ** 2 / (2 * PLAYER.gravity);
}

/**
 * The most horizontal distance a jump covers before landing on something `rise` pixels higher than the
 * take-off point (negative: lower), running at full speed. 0 when it is too high to reach at all.
 */
export function jumpReach(rise: number): number {
  const discriminant = PLAYER.jumpSpeed ** 2 - 2 * PLAYER.gravity * rise;
  if (discriminant < 0) return 0;
  const seconds = (PLAYER.jumpSpeed + Math.sqrt(discriminant)) / PLAYER.gravity;
  return PLAYER.speed * seconds;
}
