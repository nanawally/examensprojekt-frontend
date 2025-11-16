import Phaser from "phaser";
import PlayerSprite from "../sprites/players/PlayerSprite";
import MusicNoteSprite from "../sprites/items/MusicNoteSprite";

export default class BackgroundScene extends Phaser.Scene {
  private cloudsWhite!: Phaser.GameObjects.TileSprite;
  private cloudsWhiteSmall!: Phaser.GameObjects.TileSprite;
  private bricks!: Phaser.GameObjects.TileSprite;
  private ground!: Phaser.Physics.Arcade.Sprite;
  private player!: PlayerSprite;
  private musicNotes!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: "BackgroundScene" });
  }

  preload(): void {
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

  create(): void {
    // Add tile sprites centered on screen
    // (640, 200) = x, y midpoint; (1280, 400) = width, height
    const { width, height } = this.scale.gameSize;
    const gravity = 800;
    // Reference to calculate jump height
    // const jumpVelocity = -800;
    // const jumpHeight = jumpVelocity ** 2 / (2 * gravity); // 640000 / 1600 = 400px

    this.scale.on("resize", this.handleResize, this);

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

    const songMap = this.cache.json.get("testsongMap");

    this.musicNotes = this.add.group({ runChildUpdate: true });

    //this.sound.play('songkey');

    this.scheduleNotesFromMap(songMap);

    /*const music = this.sound.add("song1");
    music.play();
    const startTime = this.time.now; // Phaser timestamp when song started */

    /*this.time.addEvent({
      delay: 2000,
      callback: this.spawnMusicNote,
      callbackScope: this,
      loop: true,
    });*/

    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });

    this.player = this.physics.add.sprite(
      width / 4,
      height * 0.5,
      "player"
    ) as PlayerSprite;
    const targetHeight = this.scale.height * 0.5;
    const frameHeight = this.textures.get("player").get(0).height;
    this.player.setScale(targetHeight / frameHeight);
    this.player.body!.setSize(
      this.player.displayWidth,
      this.player.displayHeight
    );
    //this.player.body!.setOffset(0, 0);
    this.player.setOrigin(0.5, 1);
    this.player.setGravityY(gravity);
    this.player.setCollideWorldBounds(true);
    this.player.play("walk");

    this.physics.add.collider(this.player, this.ground);
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

    this.updateCamera();
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

  private spawnMusicNote(lane: number, frame: number): void {
    const x = this.scale.width + 50;
    const yPositions = [100, 200, 300, 400]; //lanes
    const y = yPositions[lane - 1];

    const note = new MusicNoteSprite(this, x, y, frame);
    this.musicNotes.add(note);
  }

  private scheduleNotesFromMap(songMap: any) {
    const distanceToHitLine = 600; // px from spawn to hit line
    const speed = 200; // px/s your notes move
    const travelTime = (distanceToHitLine / speed) * 1000; // convert seconds to ms

    songMap.notes.forEach((note: any) => {
      const spawnTime = note.time - travelTime; // when the note should spawn
      if (spawnTime >= 0) {
        this.time.delayedCall(spawnTime, () => {
          this.spawnMusicNote(note.lane, note.frame);
        });
      }
    });
  }

  private handleNoteCollision(
    playerObj: Phaser.GameObjects.GameObject,
    noteObj: Phaser.GameObjects.GameObject
  ): void {
    const note = noteObj as MusicNoteSprite;
    note.collect();
  }

  private updateCamera(): void {
    const camera = this.cameras.main;
    // Make the camera match the canvas exactly
    camera.setViewport(0, 0, this.scale.width, this.scale.height);

    // No zooming (RESIZE mode already handles scaling internally)
    camera.setZoom(1);

    camera.centerOn(this.scale.width / 2, this.scale.height / 2);

    // Resize backgrounds to match full screen automatically
    this.cloudsWhite.setSize(this.scale.width, this.scale.height);
    this.cloudsWhiteSmall.setSize(this.scale.width, this.scale.height);
  }

  private handleResize(): void {
    // If scene isn't fully created yet, ignore the event.
    if (!this.cameras || !this.cameras.main) return;

    const width = this.scale.width;
    const height = this.scale.height;

    // Update camera
    this.updateCamera();

    // Safely resize backgrounds ONLY if they exist
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

    this.musicNotes.getChildren().forEach((child) => {
      const note = child as MusicNoteSprite;

      const targetHeight = this.scale.height * 0.2;
      const frameHeight = this.textures.get("musicnote").get(0).height;
      note.setScale(targetHeight / frameHeight);
      note.body?.setSize(note.displayWidth, note.displayHeight);
    });
  }
}
