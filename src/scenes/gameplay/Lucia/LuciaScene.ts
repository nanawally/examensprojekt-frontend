import Phaser from "phaser";
import BaseLevelScene from "../BaseLevelScene";
import type MusicNoteSprite from "../../../sprites/items/MusicNoteSprite";

export default class LuciaScene extends BaseLevelScene {
  private snowMountain!: Phaser.GameObjects.TileSprite;
  private iceGround!: Phaser.GameObjects.TileSprite;
  private sop!: Phaser.Sound.BaseSound;
  private alt!: Phaser.Sound.BaseSound;
  
  constructor() {
    super("LuciaScene");
  }

  preload(): void {
    const playerKey = this.partConfig.playerSpriteKey;
    const playerPath = this.partConfig.playerSpritePath;
    const songMapKey = this.partConfig.songMapKey;
    const songMapPath = `assets/songmaps/lucia/${this.partConfig.key}.json`;

    this.load.spritesheet(playerKey, playerPath, {
      frameWidth: 512,
      frameHeight: 512,
    });
    this.load.spritesheet(
      "musicnote",
      "/assets/spritesheets/music-notes_512.png",
      { frameWidth: 256, frameHeight: 256 }
    );
    this.load.json(songMapKey, songMapPath);

    const { sky, ground } = this.songConfig.background;
    this.load.image(sky, `assets/img/${sky}.png`);
    this.load.image(ground, `assets/img/${ground}.png`);

    this.load.audio("lucia-sop", "/assets/songs/lucia/lucia-sop.mp3");
    this.load.audio("lucia-alt", "/assets/songs/lucia/lucia-alt.mp3");
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
      this.songConfig.background.sky
    );

    this.iceGround = this.add.tileSprite(
      width / 2,
      height - height / 3 / 2,
      width,
      height / 3,
      this.songConfig.background.ground
    );

    this.ground = this.physics.add.staticSprite(
      width / 2,
      height - height / 6 / 2,
      this.songConfig.background.ground
    );

    const groundImg = this.textures.get("ice-ground").getSourceImage();
    this.ground.setScale(width / groundImg.width, height / 6 / groundImg.height);
    this.ground.refreshBody();
    this.ground.setVisible(false); //invisible, only used for collision

    this.snowMountain.setDepth(-10);
    this.iceGround.setDepth(-5);
    this.ground.setDepth(-1);
    
    this.updateCamera();
  }

  update(): void {
    if (this.snowMountain) {
      this.snowMountain.tilePositionX += 0.5;
    }
    if (this.iceGround) {
      this.iceGround.tilePositionX += 1; // scroll iceGround faster than mountains
    }

    /*if (this.musicNotes && this.player) {
      this.musicNotes.getChildren().forEach((note: any) => {
        (note as MusicNoteSprite).update();
      });
    }*/
  }
  
  private updateCamera(): void {
    const camera = this.cameras?.main;

    if (!camera) return;

    camera.setViewport(0, 0, this.scale.width, this.scale.height);
    camera.setZoom(1);
    camera.centerOn(this.scale.width / 2, this.scale.height / 2);
  }

  protected override startMusic(): void {
    this.musicStartTimeMs = this.time.now + this.PRE_ROLL_MS;

    this.time.delayedCall(this.PRE_ROLL_MS, () => {
      this.sop = this.sound.add("lucia-sop");
      this.alt = this.sound.add("lucia-alt");

      this.sop.play();
      this.alt.play();

      this.musicTrackMap.set("lucia-sop", this.sop);
      this.musicTrackMap.set("lucia-alt", this.alt);

      this.controlledTrack = this.musicTrackMap.get(
        this.partConfig.controlledTrackKey
      );

      this.musicTracks.push(this.sop, this.alt);
    });
  }

  protected override handleResize(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.updateCamera();
    
    if (this.snowMountain) {
      this.snowMountain.setSize(width, height);
    }

    if (this.iceGround) {
      this.iceGround.setSize(width, height / 3);
      this.iceGround.setPosition(width / 2, height - height / 3 / 2);
    }

    if (this.ground && this.ground.body) {
      const brickImg = this.textures.get("bricks").getSourceImage();
      this.ground.setScale(
        width / brickImg.width,
        height / 6 / brickImg.height
      );
      this.ground.refreshBody();
    }
  }
}
