import * as Phaser from 'phaser';

/** A throw-away scene that proves Phaser loads, renders and animates. Real missions replace it. */
export class LabScene extends Phaser.Scene {
  constructor() {
    super('lab');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 - 60, 'Phaser siap', {
        fontFamily: 'Georgia, serif',
        fontSize: '48px',
        color: '#ffe39a',
      })
      .setOrigin(0.5);

    const block = this.add.rectangle(120, height / 2 + 40, 72, 72, 0xe2a93b);
    this.tweens.add({
      targets: block,
      x: width - 120,
      angle: 360,
      duration: 2200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }
}
