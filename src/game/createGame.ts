import * as Phaser from 'phaser';
import { LabScene } from './scenes/LabScene';

/**
 * Entry point of the Phaser side. The UI imports this lazily (`import('@/game/createGame')`), so
 * Phaser is downloaded only when an action mission opens, never on the world map.
 */
export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: '#14102a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [LabScene],
  });
}
