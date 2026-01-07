import Phaser from "phaser";

export default class MusicNoteSprite extends Phaser.Physics.Arcade.Sprite {
  public collected = false;
  public missed = false;
  public lane!: number;
  public spawnTimeMs!: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    lane: number,
    spawnTimeMs: number,
    frame?: number,
    spriteKey: string = "musicnote"
  ) {
    super(scene, x, y, spriteKey, frame ?? Phaser.Math.Between(0, 3));

    this.lane = lane;
    this.spawnTimeMs = spawnTimeMs;

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
  update(): void {
    if (this.collected || this.missed) return;

    const player = (this.scene as any).player as Phaser.Physics.Arcade.Sprite;

    if ((player && this.x < player.x) || this.x < -50) {
      this.missed = true;
      this.scene.events.emit("note-missed", this);
      // Destroy after 2 seconds
      this.scene.time.delayedCall(2000, () => {
        this.destroy();
      });
    }
  }

  // -------------------------------
  // Collect: HIT
  // -------------------------------
  collect(): void {
    if (this.collected || this.missed) return;

    this.collected = true;
    this.scene.events.emit("note-hit", {
      timeMs: this.spawnTimeMs,
      lane: this.lane,
      type: "HIT",
    });

    this.destroy();
  }
}
