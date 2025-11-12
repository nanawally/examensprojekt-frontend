import Phaser from "phaser";
import PlayerSprite from "../sprites/players/PlayerSprite";
import MusicNoteSprite from "../sprites/items/MusicNoteSprite";

export default class BackgroundScene extends Phaser.Scene {
  private cloudsWhite!: Phaser.GameObjects.TileSprite;
  private cloudsWhiteSmall!: Phaser.GameObjects.TileSprite;
  private bricks!: Phaser.GameObjects.TileSprite;
  private player!: PlayerSprite;
  private spriteSize!: 128 | 256 | 512 | 1024;
  private noteSize!: 128 | 256 | 512;

  private musicNotes!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: "BackgroundScene" });
  }

  preload(): void {
    const effectiveWidth = window.innerWidth * window.devicePixelRatio;

    if (effectiveWidth > 2000) this.spriteSize = 512;
    else if (effectiveWidth > 1000) this.spriteSize = 256;
    else this.spriteSize = 128;

    if (effectiveWidth > 2000) this.noteSize = 256;
    else if (effectiveWidth > 1000) this.noteSize = 128;
    else this.noteSize = 128;

    this.load.spritesheet(
      "player",
      `/assets/spritesheets/boy_right_${this.spriteSize}.png`,
      { frameWidth: this.spriteSize, frameHeight: this.spriteSize }
    );

    this.load.spritesheet(
      "musicnote",
      `/assets/spritesheets/music-notes_${this.noteSize}.png`,
      {
        frameWidth: this.noteSize,
        frameHeight: this.noteSize,
      }
    );

    this.load.image("clouds-white", "/assets/img/clouds-white.png");
    this.load.image("clouds-white-small", "/assets/img/clouds-white-small.png");
    this.load.image("bricks", "/assets/img/bricks.png");
  }

  create(): void {
    // Add tile sprites centered on screen
    // (640, 200) = x, y midpoint; (1280, 400) = width, height
    const width = this.scale.width;
    const height = this.scale.height;
    const gravity = 800;
    // Reference to calculate jump height
    /*
    const jumpVelocity = -800;
    const jumpHeight = jumpVelocity ** 2 / (2 * gravity); // 640000 / 1600 = 400px
    */
    this.physics.world.setBounds(0, 0, width, height);

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

    const ground = this.physics.add.staticSprite(
      width / 2,
      height * (5 / 6),
      "bricks"
    );
    ground.displayWidth = width;
    ground.displayHeight = height / 3;
    ground.setVisible(false); //invisible, only used for collision
    /*
    this.anims.create({
      key: "musicnote-roll",
      frames: this.anims.generateFrameNumbers("musicnote", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: -1,
    });
    */
    this.musicNotes = this.add.group({ runChildUpdate: true });

    this.time.addEvent({
      delay: 2000,
      callback: this.spawnMusicNote,
      callbackScope: this,
      loop: true,
    });

    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });

    this.player = this.physics.add.sprite(
      width / 4,
      height * (3 / 6),
      "player"
    ) as PlayerSprite;
    this.player.setOrigin(0.5, 1);
    this.player.setGravityY(gravity);
    this.player.body!.setSize(this.spriteSize, this.spriteSize * 1.5);
    this.player.body!.setOffset(0, 0);
    this.player.setCollideWorldBounds(true);
    this.player.play("walk");

    this.physics.add.collider(this.player, ground);
    this.physics.add.overlap(
      this.player,
      this.musicNotes,
      (player, note) => {
        (note as MusicNoteSprite).collect();
      },
      undefined,
      this
    );

    this.input.on("pointerdown", () => {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (body.blocked.down || body.touching.down) {
        const jumpHeight = this.scale.height * 0.6;
        const jumpVelocity = -Math.sqrt(2 * gravity * jumpHeight);
        this.player.setVelocityY(jumpVelocity);
      }
    });
  }

  update(): void {
    this.cloudsWhite.tilePositionX += 0.5;
    this.cloudsWhiteSmall.tilePositionX += 0.25;
    this.bricks.tilePositionX += 0.5;

    // notes destroyed when offscreen)

    for (const child of this.musicNotes.getChildren()) {
      (child as MusicNoteSprite).update();
    }
  }

  private spawnMusicNote(): void {
    const x = this.scale.width + 50;
    const y = this.scale.height * (1 / 1.8) - 150;

    const note = new MusicNoteSprite(this, x, y);
    this.musicNotes.add(note);
  }
  
  private handleNoteCollision(
    playerObj: Phaser.GameObjects.GameObject,
    noteObj: Phaser.GameObjects.GameObject
  ): void {
    const note = noteObj as MusicNoteSprite;
    note.collect();
  }

  private handleResize(): void {
    // Throttle reload to avoid flickering
    this.time.delayedCall(500, () => {
      const effectiveWidth = window.innerWidth * window.devicePixelRatio;
      const currentSpriteSize = this.textures.get("player").get(0).width ?? 512;

      let idealSize: 256 | 512 | 1024;
      if (effectiveWidth > 2000) idealSize = 1024;
      else if (effectiveWidth > 1000) idealSize = 512;
      else idealSize = 256;

      if (idealSize !== currentSpriteSize) {
        // Reload scene to use new asset
        this.scene.restart();
      }
    });
  }
}
