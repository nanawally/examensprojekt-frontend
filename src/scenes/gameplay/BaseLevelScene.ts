import Phaser from "phaser";
import PlayerSprite from "../../sprites/players/PlayerSprite";
import type { PlayerConfig } from "../../sprites/players/PlayerSprite";
import MusicNoteSprite from "../../sprites/items/MusicNoteSprite";

export default abstract class BaseLevelScene extends Phaser.Scene {
  constructor(key: string) {
    super(key);
    this.levelKey = key;
  }

  /* ADD THIS CONSUMMATION OF CONFIG SOMEWHERE
  export default class BaseLevelScene extends Phaser.Scene {
  protected songConfig!: SongConfig;
  protected partConfig!: PartConfig;

  init(data: { songKey: string; partKey: string }) {
    this.songConfig = SongRegistry[data.songKey];
    this.partConfig = this.songConfig.parts[data.partKey];
  }
}
  
  
  
  */

  /** Child scenes MUST provide these before calling super.create() */
  protected abstract songMapKey: string;
  protected abstract visualTheme: {
    playerSpriteKey: string;
    playerWalkAnimKey: string;
  };

  private levelKey!: string;
  protected player!: PlayerSprite;
  protected musicNotes!: Phaser.GameObjects.Group;
  protected ground!: Phaser.Physics.Arcade.Sprite;
  private baseScreenHeight = 1080;

  create() {
    const { width, height } = this.scale;

    const scaleFactor = height / this.baseScreenHeight;

    // -----------------------------
    // COMMON: create animation for this player type
    // -----------------------------
    this.anims.create({
      key: this.visualTheme.playerWalkAnimKey,
      frames: this.anims.generateFrameNumbers(
        this.visualTheme.playerSpriteKey,
        {
          start: 0,
          end: 1,
        }
      ),
      frameRate: 4,
      repeat: -1,
    });

    // -----------------------------
    // COMMON: music notes group
    // -----------------------------
    this.musicNotes = this.add.group({
      runChildUpdate: true,
    });

    // -----------------------------
    // COMMON: create PlayerSprite
    // (scene-specific assets already loaded in child preload)
    // -----------------------------
    const playerConfig: PlayerConfig = {
      spriteKey: this.visualTheme.playerSpriteKey,
      walkAnimKey: this.visualTheme.playerWalkAnimKey,
      gravity: 1800 * scaleFactor, // incease = lower jumps, decrease = higher jumps
    };

    this.player = new PlayerSprite(this, width / 4, height * 0.5, playerConfig);
    this.player.setDepth(10);

    // -----------------------------
    // COMMON: jump input
    // -----------------------------
    this.input.on("pointerdown", () => {
      const body = this.player.body as Phaser.Physics.Arcade.Body;

      if (body.blocked.down || body.touching.down) {
        const jumpVelocity = -1500 * scaleFactor; // increase negative number = snappier jumps
        this.player.setVelocityY(jumpVelocity);
      }
    });

    // -----------------------------
    // COMMON: schedule notes
    // songMap was preloaded by the child scene
    // -----------------------------
    const songMap = this.cache.json.get(this.songMapKey);
    this.scheduleNotesFromMap(songMap);

    // -----------------------------
    // Allow child scene to finish setup
    // backgrounds, ground, cameras, etc.
    // -----------------------------
    this.onCreateComplete();

    this.createScoreDisplay();

    // -----------------------------
    // COMMON: collisions after child sets up ground
    // -----------------------------
    if (this.ground) {
      this.physics.add.collider(this.player, this.ground);
    }

    this.physics.add.overlap(this.player, this.musicNotes, (_player, note) => {
      (note as MusicNoteSprite).collect();
      this.addScore(100); // if want combo: , this.addComboScore(100);
    });

    this.positionPlayerOnGround();

    // -----------------------------
    // COMMON: resize event
    // -----------------------------
    this.scale.on("resize", () => this.handleResize());
  }

  // -----------------------------
  // Child scene override to create backgrounds & ground
  // -----------------------------
  protected onCreateComplete(): void {}

  protected positionPlayerOnGround(): void {
    if (!this.ground || !this.player.body) return;

    const groundTop = this.ground.getBounds().top;

    // Place player's feet exactly on ground top
    this.player.y = groundTop;
    this.player.body.updateFromGameObject();
  }

  // =====================================================
  //                  NOTE SPAWN LOGIC
  // =====================================================

  protected spawnMusicNote(lane: number, frame: number): void {
    const x = this.scale.width + 50;
    const yPositions = [100, 200, 300, 400];
    const y = yPositions[lane - 1];

    const note = new MusicNoteSprite(this, x, y, frame);
    note.setDepth(20);
    this.musicNotes.add(note);
  }

  protected scheduleNotesFromMap(songMap: any) {
    const distanceToHitLine = 600; // px
    const speed = 200; // px/s
    const travelTime = (distanceToHitLine / speed) * 1000; // ms

    let lastNoteTime = 0;

    songMap.notes.forEach((note: any) => {
      const spawnTime = note.time - travelTime;

      if (spawnTime >= 0) {
        this.time.delayedCall(spawnTime, () =>
          this.spawnMusicNote(note.lane, note.frame)
        );

        if (note.time > lastNoteTime) lastNoteTime = note.time;
      }
    });

    const endDelay = lastNoteTime + travelTime;
    this.time.delayedCall(endDelay, () => this.showEndMenu());
  }
  // -----------------------------
  // COMMON resize logic
  // -----------------------------
  protected handleResize(): void {
    this.positionPlayerOnGround();
  }

  protected showEndMenu(): void {
    this.scene.start("EndMenuScene", { levelKey: this.levelKey });
  }

  // -----------------------------
  // SCORING
  // -----------------------------
  protected score: number = 0;
  protected combo: number = 0;
  protected scoreText!: Phaser.GameObjects.Text;

  protected createScoreDisplay(): void {
    // Display score in the top-left corner
    this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
      fontSize: "32px",
      color: "#ffffff",
      fontFamily: "Arial",
    });
    this.scoreText.setDepth(50); // make sure it's on top
  }

  protected addScore(points: number): void {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
  }
  /*
  protected addComboScore(points: number): void {
    this.combo++;
    this.addScore(points * this.combo);
  }
  
  protected resetCombo(): void {
    this.combo = 0;
  }*/
}
