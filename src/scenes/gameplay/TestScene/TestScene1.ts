import Phaser from "phaser";
import BaseLevelScene from "../BaseLevelScene";

export default class TestScene1 extends BaseLevelScene {
  protected songMapKey = "testsongMap";
  protected visualTheme = {
    playerSpriteKey: "player",
    playerWalkAnimKey: "walk",
  };

  private cloudsWhite!: Phaser.GameObjects.TileSprite;
  private cloudsWhiteSmall!: Phaser.GameObjects.TileSprite;
  private bricks!: Phaser.GameObjects.TileSprite;
  
  constructor() {
    super("TestScene1");
  }
  
  preload(): void {
    /* DYNAMIC PRELOADING FROM CONFIG
    preload() {
  this.load.spritesheet(
    "player",
    `src/assets/spritesheets/${this.partConfig.playerSprite}.png`,
    { frameWidth: 1024, frameHeight: 1024 }
  );

  this.load.json(
    "songMap",
    `src/assets/songmaps/${this.partConfig.songMap}.json`
  );

  this.load.image("clouds", `src/assets/img/${this.songConfig.background.clouds}.png`);
  this.load.image("bricks", `src/assets/img/${this.songConfig.background.bricks}.png`);
}
    preload() {
  const song = this.songConfig;
  const part = this.partConfig;

  this.load.json("songMeta", `songs/${song.key}/song.json`);
  this.load.json("songMap", `songs/${song.key}/${part.mapFile}`);

  this.load.spritesheet("player", part.spritePath, { ... });
  this.load.image("clouds", song.background.clouds);
}
    
    
    */
    

    this.load.spritesheet("player", `/assets/spritesheets/boy_right_1024.png`, {
      frameWidth: 1024,
      frameHeight: 1024,
    });
    
    this.load.spritesheet(
      "musicnote",
      `/assets/spritesheets/music-notes_512.png`,
      {
        frameWidth: 256,
        frameHeight: 256,
      }
    );
    
    this.load.json("testsongMap", "/assets/songmaps/testsong.json");

    this.load.image("clouds-white", "/assets/img/clouds-white.png");
    this.load.image("clouds-white-small", "/assets/img/clouds-white-small.png");
    this.load.image("bricks", "/assets/img/bricks.png");
  }
  
  protected createBackground(): void {
    const { width, height } = this.scale;
    super.onCreateComplete();
    this.score = 0; // Optional score reset

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

    this.cloudsWhite.setDepth(-10);
    this.cloudsWhiteSmall.setDepth(-9);
    this.bricks.setDepth(-5);
    this.ground.setDepth(-1);

    this.updateCamera();
  }

  update(): void {
    this.cloudsWhite.tilePositionX += 0.5;
    this.cloudsWhiteSmall.tilePositionX += 0.25;
    this.bricks.tilePositionX += 0.5;
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

    if (this.cloudsWhite) {
      this.cloudsWhite.setSize(width, height);
    }

    if (this.cloudsWhiteSmall) {
      this.cloudsWhiteSmall.setSize(width, height);
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
