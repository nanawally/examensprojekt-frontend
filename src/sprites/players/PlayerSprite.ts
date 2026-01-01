/* This file handles:
gravity
scaling
body resizing
origin
walk animation
automatic walk animation on creation
*/
import Phaser from "phaser";

export interface PlayerConfig {
  spriteKey: string; // e.g. "player1"
  walkAnimKey: string; // e.g. "walk1"
  gravity?: number; // default gravity
  scale?: number; // optional forced scale
}

export default class PlayerSprite extends Phaser.Physics.Arcade.Sprite {
  private config: PlayerConfig;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PlayerConfig) {
    super(scene, x, y, config.spriteKey);

    this.config = config;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.initializePhysics();
    this.initializeAppearance();
  }

  private initializePhysics() {
    const referenceHeight = 1080;
    const gravityFactor = this.config.gravity ?? 1500;

    const scaledGravity =
      gravityFactor * (this.scene.scale.height / referenceHeight);
    this.setGravityY(scaledGravity);
    this.setCollideWorldBounds(true);
  }

  private initializeAppearance() {
    // Scale sprite
    const targetHeight = this.scene.scale.height * 0.25;
    const frame = this.texture.get(0);
    const frameHeight = frame?.height ?? 512;
    const scale = targetHeight / frameHeight;
    this.setScale(scale);

    // Bottom-center origin
    this.setOrigin(0.5, 1);

    // Physics body
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
    const bodyWidth = this.width * 0.5;  // 50% of sprite width
    const bodyHeight = this.height * 0.9; // 90% of sprite height
    body.setSize(bodyWidth, bodyHeight, true); // 'true' keeps it centered
}

    if (this.scene.anims.exists(this.config.walkAnimKey)) {
      this.play(this.config.walkAnimKey);
    }

    /*// If scale not provided, auto-scale to 50% of screen height
    if (this.config.scale !== undefined) {
      this.setScale(this.config.scale);
    } else {
      const frameHeight = this.texture.get(0).height;
      const targetHeight = this.scene.scale.height * 0.5;
      this.setScale(targetHeight / frameHeight);
    }

    // Resize body after scaling
    this.body?.setSize(this.displayWidth, this.displayHeight);
    this.setOrigin(0.5, 1);

    // Start animation if available
    if (this.scene.anims.exists(this.config.walkAnimKey)) {
      this.play(this.config.walkAnimKey);
    }*/
  }

  update() {
    // Handle player movement, controls, etc.
  }
}
