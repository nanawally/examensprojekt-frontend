import Phaser from "phaser";

export default class MusicNoteSprite extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    frame?: number,
    spriteKey: string = "musicnote" // optional, defaults to your original
  ) {
    super(scene, x, y, spriteKey, frame ?? Phaser.Math.Between(0, 3));
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;

    // -------------------------------
    // Physics properties
    // -------------------------------
    body.setAllowGravity(false);
    body.setCollideWorldBounds(false);

    // -------------------------------
    // Movement
    // -------------------------------
    this.setVelocityX(-200);
    
    // -------------------------------
    // Scaling
    // -------------------------------
    const anims = scene.anims;
    const textureFrame = scene.textures.getFrame(spriteKey, this.frame.name);
    const frameHeight = textureFrame?.height ?? 256;
    
    const targetHeight = scene.scale.height * 0.1; // 10% of screen height
    this.setScale(targetHeight / frameHeight);

    body.setSize(this.displayWidth, this.displayHeight);
    this.setOrigin(0.5, 0.5);
  }

  // -------------------------------
  // Update: destroy offscreen (unchanged)
  // -------------------------------
  update(): void {
    if (this.x < -this.width) {
      this.destroy();
    }
  }

  // -------------------------------
  // Collect: exactly your original
  // -------------------------------
  collect(): void {
    this.destroy();
  }
}
