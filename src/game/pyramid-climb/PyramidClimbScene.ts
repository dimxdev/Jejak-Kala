import * as Phaser from 'phaser';
import {
  overlaps,
  playerBox,
  type ScorpionDef,
  type SwingerDef,
  scorpionAt,
  scorpionBox,
  shrink,
  swingAngle,
  swingerBox,
  swingerCenter,
} from '@/core/missions/pyramid-climb/hazards';
import { groundAt, PICKUP_RADIUS, progressAt } from '@/core/missions/pyramid-climb/level';
import { PLAYER, VIEW } from '@/core/missions/pyramid-climb/physics';
import { BLOCK_KEY, CAP_HEIGHT, CAP_KEY, makeLedgeTextures } from './textures';
import { type ClimbConfig, type ClimbEvents, type ClimbInput, NO_INPUT } from './types';

/** What `game.scene.add('climb', scene, true, data)` hands to `init`. */
export interface ClimbSceneData {
  config: ClimbConfig;
  events: ClimbEvents;
  /** called once the picture files are loaded and the level is built */
  ready: { resolve: () => void; reject: (error: Error) => void };
}

// How the climb looks and feels. The numbers that decide what can be jumped are in core (physics.ts).
const PLAYER_PICTURE_HEIGHT = 124;
const GATE_PICTURE_HEIGHT = 300;
const ROD_PICTURE_WIDTH = 96;
const CAPSTONE_PICTURE_HEIGHT = 150;
const SCORPION_PICTURE_WIDTH = 96;
const BLOCK_PICTURE_SIZE = 96;

/** A gate asks its question when the player gets this close, and stays quiet again once he is this far. */
const GATE_TRIGGER = 160;
const GATE_BACK_OFF = 280;
const SUMMIT_TRIGGER = 90;
/** After a hit or a fall the player cannot be hurt for a moment. */
const RESPAWN_PROTECTION = 1.5;
const FALL_MARGIN = 200;
/** The background moves this share of what the camera moves, so it feels far away. */
const BACKGROUND_DRIFT = 0.07;

const DEPTH = {
  background: -10,
  ledge: 2,
  cap: 3,
  gate: 4,
  rope: 5,
  hazard: 8,
  pickup: 9,
  player: 10,
};

interface GateState {
  x: number;
  ground: number;
  open: boolean;
  barrier: Phaser.GameObjects.Zone;
  rope: Phaser.GameObjects.Graphics;
}

interface CheckpointState {
  x: number;
  ground: number;
  reached: boolean;
  flag: Phaser.GameObjects.Graphics;
}

interface RodState {
  x: number;
  y: number;
  picture: Phaser.GameObjects.Image;
  taken: boolean;
}

interface ScorpionState {
  def: ScorpionDef;
  picture: Phaser.GameObjects.Image;
}

interface SwingerState {
  def: SwingerDef;
  picture: Phaser.GameObjects.Image;
  rope: Phaser.GameObjects.Graphics;
}

export class PyramidClimbScene extends Phaser.Scene {
  private config!: ClimbConfig;
  private events_!: ClimbEvents;
  private ready!: ClimbSceneData['ready'];

  private input_: ClimbInput = NO_INPUT;
  private clock = 0;
  private sinceReport = 0;
  private secondsReported = 0;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private hero!: Phaser.GameObjects.Rectangle;
  private picture!: Phaser.GameObjects.Image;
  private pictureScale = 1;
  private facing: 1 | -1 = 1;
  private jumpHeld = false;
  private jumpPressedAt = Number.NEGATIVE_INFINITY;
  private lastGroundedAt = Number.NEGATIVE_INFINITY;
  private protectedUntil = 0;
  private checkpoint = { x: 0, y: 0 };

  private gates: GateState[] = [];
  private checkpoints: CheckpointState[] = [];
  private asking: number | null = null;
  private rods: RodState[] = [];
  private collected = 0;
  private scorpions: ScorpionState[] = [];
  private swingers: SwingerState[] = [];
  private capstone!: Phaser.GameObjects.Image;
  private summitReached = false;

  constructor() {
    super('climb');
  }

  init(data: ClimbSceneData): void {
    this.config = data.config;
    this.events_ = data.events;
    this.ready = data.ready;
    this.clock = 0;
  }

  preload(): void {
    this.load.on('loaderror', (file: { key: string; url: string }) => {
      this.ready.reject(new Error(`gambar tidak bisa dimuat: ${file.key} (${file.url})`));
    });
    for (const [key, url] of Object.entries(this.config.images)) this.load.image(key, url);
  }

  create(): void {
    const { params } = this.config;
    const { world, ledges } = params;

    this.physics.world.setBounds(0, 0, world.width, world.height + 400);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.buildBackground();
    this.buildLedges();
    this.buildGates();
    this.buildCheckpoints();
    this.buildRods();
    this.buildCapstone();
    if (this.config.hazards) this.buildHazards();

    const startGround = groundAt(ledges, params.start.x) ?? 0;
    this.checkpoint = { x: params.start.x, y: startGround };
    this.buildHero();

    const camera = this.cameras.main;
    camera.setBounds(0, 0, world.width, world.height);
    camera.startFollow(this.hero, true, 0.1, 0.1);
    camera.setFollowOffset(-140, 70);

    this.ready.resolve();
  }

  // ---------------------------------------------------------------- the page drives the game

  setInput(input: ClimbInput): void {
    this.input_ = input;
  }

  openGate(index: number): void {
    const gate = this.gates[index];
    if (!gate || gate.open) return;
    gate.open = true;
    (gate.barrier.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.tweens.add({
      targets: gate.rope,
      y: 70,
      alpha: 0,
      duration: this.config.reducedMotion ? 1 : 600,
      ease: 'Quad.easeIn',
    });
    this.checkpoint = { x: gate.x + 120, y: gate.ground };
    if (this.asking === index) this.asking = null;
  }

  backOff(index: number): void {
    const gate = this.gates[index];
    if (!gate) return;
    if (this.asking === index) this.asking = null;
    this.placeHero(gate.x - GATE_BACK_OFF - 40, gate.ground);
  }

  skip(): void {
    const next = this.gates.findIndex((gate) => !gate.open);
    if (next >= 0) {
      const gate = this.gates[next];
      if (gate) this.placeHero(gate.x - GATE_TRIGGER + 30, gate.ground);
    } else {
      const { goal } = this.config.params;
      this.placeHero(
        goal.x - SUMMIT_TRIGGER + 20,
        groundAt(this.config.params.ledges, goal.x) ?? 0,
      );
    }
  }

  // ---------------------------------------------------------------- building the level

  private buildBackground(): void {
    const { world } = this.config.params;
    const background = this.add
      .image(0, 0, 'background')
      .setOrigin(0, 0)
      .setScrollFactor(BACKGROUND_DRIFT)
      .setDepth(DEPTH.background);
    const needWidth = VIEW.width + (world.width - VIEW.width) * BACKGROUND_DRIFT;
    const needHeight = VIEW.height + (world.height - VIEW.height) * BACKGROUND_DRIFT;
    background.setScale(Math.max(needWidth / background.width, needHeight / background.height));
  }

  private buildLedges(): void {
    makeLedgeTextures(this);
    const { ledges, world } = this.config.params;
    this.platforms = this.physics.add.staticGroup();
    for (const ledge of ledges) {
      const height = world.height - ledge.y;
      this.add
        .tileSprite(ledge.x, ledge.y + CAP_HEIGHT, ledge.w, height - CAP_HEIGHT, BLOCK_KEY)
        .setOrigin(0, 0)
        .setDepth(DEPTH.ledge);
      this.add
        .tileSprite(ledge.x, ledge.y, ledge.w, CAP_HEIGHT, CAP_KEY)
        .setOrigin(0, 0)
        .setDepth(DEPTH.cap);
      const zone = this.add.zone(ledge.x + ledge.w / 2, ledge.y + height / 2, ledge.w, height);
      this.physics.add.existing(zone, true);
      this.platforms.add(zone);
    }
  }

  private buildGates(): void {
    const { gates, ledges } = this.config.params;
    this.gates = gates.map((gate) => {
      const ground = groundAt(ledges, gate.x) ?? 0;
      const picture = this.add.image(gate.x, ground, 'gate').setOrigin(0.5, 1).setDepth(DEPTH.gate);
      picture.setScale(GATE_PICTURE_HEIGHT / picture.height);

      // the rope across the doorway: drawn around (0, 0) so that it can be moved and faded as one
      const width = picture.displayWidth * 0.5;
      const rope = this.add.graphics({ x: 0, y: 0 }).setDepth(DEPTH.rope);
      const y = ground - GATE_PICTURE_HEIGHT * 0.28;
      rope.lineStyle(7, 0xc08d69, 1);
      rope.lineBetween(gate.x - width, y, gate.x + width, y);
      rope.lineStyle(3, 0x895933, 1);
      rope.lineBetween(gate.x - width, y + 4, gate.x + width, y + 4);
      rope.fillStyle(0x895933, 1);
      rope.fillCircle(gate.x - width, y, 9);
      rope.fillCircle(gate.x + width, y, 9);

      const barrier = this.add.zone(gate.x, ground - 200, 28, 400);
      this.physics.add.existing(barrier, true);
      return { x: gate.x, ground, open: false, barrier, rope };
    });
  }

  /** A small flag at each checkpoint: grey until the player passes it, then raised in the accent colour. */
  private buildCheckpoints(): void {
    const { checkpoints, ledges } = this.config.params;
    this.checkpoints = checkpoints.map((x) => {
      const ground = groundAt(ledges, x) ?? 0;
      const flag = this.add.graphics({ x, y: ground }).setDepth(DEPTH.gate);
      this.drawFlag(flag, false);
      return { x, ground, reached: false, flag };
    });
  }

  private drawFlag(flag: Phaser.GameObjects.Graphics, raised: boolean): void {
    flag.clear();
    flag.lineStyle(5, 0x895933, 1);
    flag.lineBetween(0, 0, 0, -110);
    flag.fillStyle(raised ? 0xdf9f5a : 0xb9a58c, 1);
    flag.fillTriangle(0, -110, 0, -62, raised ? 56 : 40, -86);
    flag.fillStyle(0x895933, 1);
    flag.fillCircle(0, -112, 6);
  }

  private buildRods(): void {
    this.rods = this.config.params.rods.map((rod) => {
      const picture = this.add.image(rod.x, rod.y, 'rod').setDepth(DEPTH.pickup);
      picture.setScale(ROD_PICTURE_WIDTH / picture.width);
      if (!this.config.reducedMotion) {
        this.tweens.add({
          targets: picture,
          y: rod.y - 12,
          angle: 5,
          duration: 900,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });
      }
      return { x: rod.x, y: rod.y, picture, taken: false };
    });
  }

  private buildCapstone(): void {
    const { goal, ledges } = this.config.params;
    const ground = groundAt(ledges, goal.x) ?? 0;
    this.capstone = this.add
      .image(goal.x, ground, 'capstone')
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.gate);
    const scale = CAPSTONE_PICTURE_HEIGHT / this.capstone.height;
    this.capstone.setScale(scale);
    if (!this.config.reducedMotion) {
      this.tweens.add({
        targets: this.capstone,
        scale: scale * 1.06,
        duration: 1100,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private buildHazards(): void {
    const { scorpions, swingers } = this.config.params;
    this.scorpions = scorpions.map((def) => {
      const picture = this.add
        .image(def.x1, def.y, 'scorpion')
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.hazard);
      picture.setScale(SCORPION_PICTURE_WIDTH / picture.width);
      return { def, picture };
    });
    this.swingers = swingers.map((def) => {
      const picture = this.add.image(def.x, def.y, 'block').setDepth(DEPTH.hazard);
      picture.setScale(BLOCK_PICTURE_SIZE / Math.max(picture.width, picture.height));
      const rope = this.add.graphics({ x: 0, y: 0 }).setDepth(DEPTH.hazard - 1);
      return { def, picture, rope };
    });
    this.moveHazards();
  }

  private buildHero(): void {
    // the physics body is a plain box of exactly the size core's physics assumes; the picture follows it
    this.hero = this.add.rectangle(
      this.checkpoint.x,
      this.checkpoint.y - PLAYER.height / 2,
      PLAYER.width,
      PLAYER.height,
    );
    this.hero.setVisible(false);
    this.physics.add.existing(this.hero);
    const body = this.heroBody();
    body.setCollideWorldBounds(true);
    body.setMaxVelocityY(1600);
    this.physics.add.collider(this.hero, this.platforms);
    for (const gate of this.gates) this.physics.add.collider(this.hero, gate.barrier);

    this.picture = this.add.image(this.hero.x, this.checkpoint.y, 'walk').setOrigin(0.5, 1);
    this.picture.setDepth(DEPTH.player);
    this.pictureScale = PLAYER_PICTURE_HEIGHT / this.picture.height;
    this.picture.setScale(this.pictureScale);
  }

  private heroBody(): Phaser.Physics.Arcade.Body {
    return this.hero.body as Phaser.Physics.Arcade.Body;
  }

  // ---------------------------------------------------------------- every frame

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    this.clock += dt;

    this.moveHero();
    this.drawHero();
    if (this.config.hazards) {
      this.moveHazards();
      this.checkHazardHits();
    }
    this.checkRods();
    this.checkCheckpoints();
    this.checkGates();
    this.checkSummit();
    this.checkFall();
    this.report(dt);
  }

  private moveHero(): void {
    const body = this.heroBody();
    const grounded = body.blocked.down || body.touching.down;
    if (grounded) this.lastGroundedAt = this.clock;

    const direction = (this.input_.right ? 1 : 0) - (this.input_.left ? 1 : 0);
    body.setVelocityX(direction * PLAYER.speed);
    if (direction !== 0) this.facing = direction > 0 ? 1 : -1;

    // a jump pressed a moment too early is remembered, and one pressed a moment after leaving a ledge works
    if (this.input_.jump && !this.jumpHeld) this.jumpPressedAt = this.clock;
    this.jumpHeld = this.input_.jump;
    const wantsJump = this.clock - this.jumpPressedAt <= PLAYER.bufferSeconds;
    const canJump = grounded || this.clock - this.lastGroundedAt <= PLAYER.coyoteSeconds;
    if (wantsJump && canJump && body.velocity.y >= -50) {
      body.setVelocityY(-PLAYER.jumpSpeed);
      this.jumpPressedAt = Number.NEGATIVE_INFINITY;
      this.lastGroundedAt = Number.NEGATIVE_INFINITY;
    }
  }

  private drawHero(): void {
    const body = this.heroBody();
    const grounded = body.blocked.down || body.touching.down;
    const feetY = this.hero.y + PLAYER.height / 2;
    this.picture.setPosition(this.hero.x, feetY);
    this.picture.setTexture(grounded ? 'walk' : 'jump');
    this.picture.setFlipX(this.facing < 0);

    let squashX = 1;
    let squashY = 1;
    let tilt = 0;
    if (!this.config.reducedMotion) {
      const walking = grounded && Math.abs(body.velocity.x) > 5;
      if (walking) {
        const beat = Math.sin(this.clock * 15);
        squashY = 1 + 0.035 * beat;
        squashX = 1 - 0.025 * beat;
        tilt = 2.5 * beat;
      } else if (!grounded) {
        const stretch = Phaser.Math.Clamp(Math.abs(body.velocity.y) / 4000, 0, 0.12);
        squashY = 1 + stretch;
        squashX = 1 - stretch / 2;
      } else {
        squashY = 1 + 0.012 * Math.sin(this.clock * 2.4); // breathing
      }
    }
    this.picture.setScale(this.pictureScale * squashX, this.pictureScale * squashY);
    this.picture.setAngle(tilt);
    this.picture.setAlpha(
      this.clock < this.protectedUntil ? 0.55 + 0.45 * Math.sin(this.clock * 30) : 1,
    );
  }

  /** Puts every hazard where it is at the current time. */
  private moveHazards(): void {
    for (const { def, picture } of this.scorpions) {
      const { x, facing } = scorpionAt(def, this.clock);
      picture.setPosition(x, def.y);
      picture.setFlipX(facing < 0);
    }
    for (const { def, picture, rope } of this.swingers) {
      const centre = swingerCenter(def, this.clock);
      picture.setPosition(centre.x, centre.y);
      picture.setAngle((swingAngle(def, this.clock) * 180) / Math.PI);
      rope.clear();
      rope.lineStyle(6, 0x895933, 1);
      rope.lineBetween(def.x, def.y, centre.x, centre.y - 36);
      rope.fillStyle(0x895933, 1);
      rope.fillCircle(def.x, def.y, 8);
    }
  }

  private checkHazardHits(): void {
    if (this.clock < this.protectedUntil) return;
    const body = this.playerBody();
    const hitByScorpion = this.scorpions.some(({ def }) =>
      overlaps(body, shrink(scorpionBox(def, this.clock), 8)),
    );
    const hitBySwinger = this.swingers.some(({ def }) =>
      overlaps(body, shrink(swingerBox(def, this.clock), 10)),
    );
    if (hitByScorpion || hitBySwinger) this.hurt();
  }

  /** The player's box where he stands now, shrunk a little so only a clear touch hurts. */
  private playerBody(): { x: number; y: number; w: number; h: number } {
    return shrink(playerBox(this.hero.x, this.hero.y + PLAYER.height / 2), 6);
  }

  private checkRods(): void {
    for (const rod of this.rods) {
      if (rod.taken) continue;
      if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, rod.x, rod.y) > PICKUP_RADIUS)
        continue;
      rod.taken = true;
      this.collected += 1;
      this.tweens.killTweensOf(rod.picture);
      this.tweens.add({
        targets: rod.picture,
        y: rod.picture.y - 60,
        alpha: 0,
        scale: rod.picture.scale * 1.5,
        duration: this.config.reducedMotion ? 1 : 450,
        ease: 'Quad.easeOut',
        onComplete: () => rod.picture.destroy(),
      });
      this.events_.onRod(this.collected);
    }
  }

  private checkCheckpoints(): void {
    const body = this.heroBody();
    if (!(body.blocked.down || body.touching.down)) return;
    for (const checkpoint of this.checkpoints) {
      if (checkpoint.reached || this.hero.x < checkpoint.x) continue;
      checkpoint.reached = true;
      this.drawFlag(checkpoint.flag, true);
      if (checkpoint.x > this.checkpoint.x)
        this.checkpoint = { x: checkpoint.x, y: checkpoint.ground };
    }
  }

  private checkGates(): void {
    if (this.asking !== null) return;
    this.gates.forEach((gate, index) => {
      if (gate.open || this.asking !== null) return;
      if (Math.abs(this.hero.x - gate.x) < GATE_TRIGGER) {
        this.asking = index;
        this.events_.onGate(index);
      }
    });
  }

  private checkSummit(): void {
    if (this.summitReached || this.gates.some((gate) => !gate.open)) return;
    if (Math.abs(this.hero.x - this.config.params.goal.x) < SUMMIT_TRIGGER) {
      this.summitReached = true;
      this.events_.onSummit();
    }
  }

  private checkFall(): void {
    if (this.hero.y > this.config.params.world.height + FALL_MARGIN) {
      this.placeHero(this.checkpoint.x, this.checkpoint.y);
    }
  }

  private hurt(): void {
    this.events_.onHit();
    this.placeHero(this.checkpoint.x, this.checkpoint.y);
  }

  /** Puts the player on the ground at x (feet at `ground`), standing still and protected for a moment. */
  private placeHero(x: number, ground: number): void {
    this.heroBody().reset(x, ground - PLAYER.height / 2);
    this.heroBody().setVelocity(0, 0);
    this.protectedUntil = this.clock + RESPAWN_PROTECTION;
    this.cameras.main.centerOn(x, ground - PLAYER.height / 2);
  }

  private report(dt: number): void {
    this.sinceReport += dt;
    if (this.sinceReport >= 0.2) {
      this.sinceReport = 0;
      const { start, goal } = this.config.params;
      this.events_.onProgress(progressAt(start.x, goal.x, this.hero.x));
    }
    const seconds = Math.floor(this.clock);
    if (seconds > this.secondsReported) {
      this.secondsReported = seconds;
      this.events_.onTick(seconds);
    }
  }
}
