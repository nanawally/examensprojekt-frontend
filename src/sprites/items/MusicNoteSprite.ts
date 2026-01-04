import Phaser from "phaser";

export default class MusicNoteSprite extends Phaser.Physics.Arcade.Sprite {
  public collected = false;

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
  // Update
  // -------------------------------
  /*update(): void {
    if (this.x < -this.width) {
      this.destroy();
    }
    
    if (this.x < -50 && !this.collect) {
      this.scene.events.emit("note-missed");
      this.destroy();
    }
  }*/
  update(): void {
    if (this.collected) return;

    const player = (this.scene as any).player as Phaser.Physics.Arcade.Sprite;
    if (player && this.x < player.x) {
      this.collected = true;
      this.scene.events.emit("note-missed", this);
      this.destroy();
    } else if (this.x < -50) {
      this.destroy();
    }
  }

  // -------------------------------
  // Collect: exactly your original
  // -------------------------------
  collect(): void {
    if (this.collected) return;
    this.collected = true;
    this.destroy();
  }
}
