import Phaser from "phaser";

export default class PlayerSprite extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player");

    scene.add.existing(this);
    
  }

  update() {
    // Only handle movement, controls, etc.
    // Don’t set textures manually — animation handles that now.
  }
}
