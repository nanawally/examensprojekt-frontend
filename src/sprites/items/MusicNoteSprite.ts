import Phaser from "phaser";

export default class MusicNoteSprite extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "musicnote"); // the key for your spritesheet or image

    scene.add.existing(this);
    scene.physics.add.existing(this);

    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setVelocityX(-200);
    this.setCollideWorldBounds(false);
    this.setScale(0.5); // optional
    const randomFrame = Phaser.Math.Between(0, 3); // if you have 4 frames
    this.setFrame(randomFrame);
  }

  update(): void {
    // remove when off-screen (to the left)
    if (this.x < -this.width) {
      this.destroy();
    }
  }

  collect(): void {
    this.destroy();
  }
}
