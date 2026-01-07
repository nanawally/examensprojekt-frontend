import Phaser from "phaser";

export default class ImgButton extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    callback: () => void
  ) {
    super(scene, x, y);

    const img = scene.add
      .image(0, 0, key)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    img.on("pointerdown", callback);
    img.on("pointerover", () => img.setScale(1.1));
    img.on("pointerout", () => img.setScale(1));

    this.add(img);

    scene.add.existing(this);
  }
}
