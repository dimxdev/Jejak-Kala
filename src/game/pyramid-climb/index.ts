import * as Phaser from 'phaser';
import { PLAYER, VIEW } from '@/core/missions/pyramid-climb/physics';
import { PyramidClimbScene } from './PyramidClimbScene';
import type { ClimbConfig, ClimbEvents, ClimbHandle } from './types';

export type { ClimbConfig, ClimbEvents, ClimbHandle, ClimbInput } from './types';
export { NO_INPUT } from './types';

/**
 * Starts the climb inside `parent`. The page imports this module lazily (`import('@/game/pyramid-climb')`),
 * so Phaser is downloaded only when this mission is opened. Resolves once the pictures are loaded and the
 * level is built; rejects if a picture cannot be loaded.
 */
export async function startClimb(
  parent: HTMLElement,
  config: ClimbConfig,
  events: ClimbEvents,
): Promise<ClimbHandle> {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VIEW.width,
    height: VIEW.height,
    backgroundColor: '#f3d9b4',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: PLAYER.gravity } } },
    audio: { noAudio: true },
    banner: false,
    scene: [],
  });

  const scene = new PyramidClimbScene();
  try {
    await new Promise<void>((resolve, reject) => {
      game.scene.add('climb', scene, true, { config, events, ready: { resolve, reject } });
    });
  } catch (error) {
    game.destroy(true);
    throw error;
  }

  return {
    setInput: (input) => scene.setInput(input),
    setPaused: (paused) => (paused ? game.scene.pause('climb') : game.scene.resume('climb')),
    openGate: (index) => scene.openGate(index),
    backOff: (index) => scene.backOff(index),
    skip: () => scene.skip(),
    destroy: () => game.destroy(true),
  };
}
