import Phaser from "phaser";

export default class MusicNoteSprite extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, frame?: number) {
    super(scene, x, y, "musicnote", frame ?? Phaser.Math.Between(0, 3));

    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setVelocityX(-200);
    this.setCollideWorldBounds(false);

    /*const randomFrame = Phaser.Math.Between(0, 3);
    this.setFrame(randomFrame);*/
    
    const targetHeight = scene.scale.height * 0.2;
    const frameHeight = scene.textures.get("musicnote").getSourceImage().height;
    this.setScale(targetHeight / frameHeight);
    this.body?.setSize(this.displayWidth, this.displayHeight);
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
