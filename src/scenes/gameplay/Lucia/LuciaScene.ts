import Phaser from "phaser";
import BaseLevelScene from "../BaseLevelScene";

export default class LuciaScene extends BaseLevelScene {
  protected songMapKey = "luciaMap";
  protected visualTheme = {
    playerSpriteKey: "player",
    playerWalkAnimKey: "walk",
  };

  private snowMountain!: Phaser.GameObjects.TileSprite;
  private bricks!: Phaser.GameObjects.TileSprite;

  constructor() {
    super("LuciaScene");
  }

  preload(): void {
    this.load.spritesheet(
      "player",
      `/assets/spritesheets/lucia/lucia_512.png`,
      {
        frameWidth: 512,
        frameHeight: 512,
      }
    );

    this.load.spritesheet(
      "musicnote",
      `/assets/spritesheets/music-notes_512.png`,
      {
        frameWidth: 256,
        frameHeight: 256,
      }
    );

    this.load.json("testsongMap", "assets/songmaps/testsong.json");

    this.load.image("snow-mountain", "assets/img/snow-mountain.png");
    this.load.image("bricks", "assets/img/bricks.png");
  }

  protected createBackground(): void {
    console.log("LuciaScene create, active?", this.scene.isActive());

    const { width, height } = this.scale;
    super.onCreateComplete();
    this.score = 0;
    
    this.snowMountain = this.add.tileSprite(
      width / 2,
      height * (2 / 6),
      width,
      height * (2 / 3),
      "snow-mountain"
    );

    this.bricks = this.add.tileSprite(
      width / 2,
      height - height / 3 / 2,
      width,
      height / 3,
      "bricks"
    );

    this.ground = this.physics.add.staticSprite(
      width / 2,
      height - height / 6 / 2,
      "bricks"
    );

    const brickImg = this.textures.get("bricks").getSourceImage();
    this.ground.setScale(width / brickImg.width, height / 6 / brickImg.height);
    this.ground.refreshBody();
    this.ground.setVisible(false); //invisible, only used for collision

    this.snowMountain.setDepth(-10);
    this.bricks.setDepth(-5);
    this.ground.setDepth(-1);

    this.updateCamera();
  }

  /*update(): void {
    this.snowMountain.tilePositionX += 0.5;
    this.bricks.tilePositionX += 0.5;
  }*/
  update(time: number, delta: number): void {
    console.log("LuciaScene update running");
    if (this.snowMountain) {
      this.snowMountain.tilePositionX += 0.5;
    }
    if (this.bricks) {
      this.bricks.tilePositionX += 1; // you can scroll bricks faster than mountains
    }
  }

  private updateCamera(): void {
    const camera = this.cameras.main;

    camera.setViewport(0, 0, this.scale.width, this.scale.height);
    camera.setZoom(1);
    camera.centerOn(this.scale.width / 2, this.scale.height / 2);
  }

  protected override handleResize(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.updateCamera();

    if (this.snowMountain) {
      this.snowMountain.setSize(width, height);
    }

    if (this.bricks) {
      this.bricks.setSize(width, height / 3);
      this.bricks.setPosition(width / 2, height - height / 3 / 2);
    }

    if (this.ground) {
      const brickImg = this.textures.get("bricks").getSourceImage();
      this.ground.setScale(
        width / brickImg.width,
        height / 6 / brickImg.height
      );
      this.ground.refreshBody();
    }
  }
}
