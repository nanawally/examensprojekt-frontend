import Phaser from "phaser";

export default class BackgroundScene extends Phaser.Scene {
  private cloudsWhite!: Phaser.GameObjects.TileSprite;
  private cloudsWhiteSmall!: Phaser.GameObjects.TileSprite;
  private bricks!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: "BackgroundScene" });
  }

  preload(): void {
    this.load.image("clouds-white", "/assets/img/clouds-white.png");
    this.load.image("clouds-white-small", "/assets/img/clouds-white-small.png");
    this.load.image("bricks", "/assets/img/bricks.png");
  }

  create(): void {
    // Add tile sprites centered on screen
    // (640, 200) = x, y midpoint; (1280, 400) = width, height
    const width = this.scale.width;
    const height = this.scale.height;
    this.cloudsWhite = this.add.tileSprite(
      width / 2,
      height * (2 / 6),
      width,
      height * (2 / 3),
      "clouds-white"
    );
    this.cloudsWhiteSmall = this.add.tileSprite(
      width / 2,
      height * (2 / 6),
      width,
      height * (2 / 3),
      "clouds-white-small"
    );
    this.bricks = this.add.tileSprite(
      width / 2,
      height * (5 / 6),
      width,
      height / 3,
      "bricks"
    );
  }

  update(): void {
    this.cloudsWhite.tilePositionX += 0.5;
    this.cloudsWhiteSmall.tilePositionX += 0.25;
    this.bricks.tilePositionX += 0.5;
  }
}
