import Phaser from "phaser";
import ApiService from "../../logic/ApiService";
import PlayerSprite from "../../sprites/players/PlayerSprite";
import type { PlayerConfig } from "../../sprites/players/PlayerSprite";
import MusicNoteSprite from "../../sprites/items/MusicNoteSprite";
import { SongRegistry } from "../../songconfig/songregistry";
import type { SongConfig, PartConfig } from "../../songconfig/songconfig";

export default abstract class BaseLevelScene extends Phaser.Scene {
  private api: ApiService;
  protected songConfig!: SongConfig;
  protected partConfig!: PartConfig;
  protected musicTracks: Phaser.Sound.BaseSound[] = [];
  protected musicTrackMap = new Map<string, Phaser.Sound.BaseSound>();
  protected controlledTrack?: Phaser.Sound.BaseSound;
  protected controlledTrackFaded = false;
  protected musicStartTimeMs = 0;
  protected readonly PRE_ROLL_MS = 1000;

  constructor(key: string) {
    super(key);
    this.levelKey = key;
    this.api = new ApiService("http://localhost:8080");
  }

  init(data: { songKey: string; partKey: string }) {
    this.songConfig = SongRegistry[data.songKey];
    this.partConfig = this.songConfig.parts[data.partKey];

    if (!this.songConfig || !this.partConfig) {
      throw new Error(
        `Invalid song/part combination: ${data.songKey} / ${data.partKey}`
      );
    }
  }

  /** Child scenes MUST provide these before calling super.create() */
  protected get songMapKey(): string {
    return this.partConfig.songMapKey;
  }

  protected get visualTheme() {
    return {
      playerSpriteKey: this.partConfig.playerSpriteKey,
      playerWalkAnimKey: "walk",
    };
  }

  private levelKey!: string;
  protected player!: PlayerSprite;
  protected musicNotes!: Phaser.GameObjects.Group;
  protected abstract createBackground(): void;
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
          end: 3, // amount of animation frames (-1)
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

    this.runEvents = [];
    
    this.events.on(
      "note-hit",
      (event: { timeMs: number; lane: number; type: "HIT" | "MISS" }) => {
        this.runEvents.push(event);
        this.onNoteHit();
        this.addScore(100); // if want combo: , this.addComboScore(100);
      }
    );

    this.events.on(
      "note-missed",
      (event: { timeMs: number; lane: number; type: "HIT" | "MISS" }) => {
        this.runEvents.push(event);
        this.onNoteMissed();
      }
    );

    // -----------------------------
    // COMMON: BACKGROUND
    // (child creates ground + tiles here)
    // -----------------------------
    this.createBackground();

    // -----------------------------
    // COMMON: create PlayerSprite
    // (scene-specific assets already loaded in child preload)
    // -----------------------------
    const playerConfig: PlayerConfig = {
      spriteKey: this.visualTheme.playerSpriteKey,
      walkAnimKey: this.visualTheme.playerWalkAnimKey,
      gravity: 1800 * scaleFactor, // incease = lower jumps, decrease = higher jumps
    };

    if (!this.ground) {
      console.warn("Ground not yet created before player spawn!");
      return;
    }

    // Spawn player slightly above the ground so physics resolves collision naturally
    const spawnY = this.ground.getBounds().top - 2; // 2px buffer above ground
    this.player = new PlayerSprite(this, width / 6, spawnY, playerConfig);
    this.player.setDepth(10);

    // Add collider immediately
    this.physics.add.collider(this.player, this.ground);

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
    // COMMON: start music
    // -----------------------------
    this.startMusic();

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

    this.createScoreDisplay();

    // -----------------------------
    // COMMON: collisions after child sets up ground
    // -----------------------------
    if (this.ground) {
      this.physics.add.collider(this.player, this.ground);
    }

    this.physics.add.overlap(this.player, this.musicNotes, (_player, note) => {
      (note as MusicNoteSprite).collect();
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

  protected startMusic(): void {
    // default: do nothing
  }

  protected positionPlayerOnGround(): void {
    if (!this.ground || !this.player.body) return;

    const groundTop = this.ground.getBounds().top;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (body) {
      // Align the bottom of the physics body with the top of the ground
      body.y = groundTop - body.height;

      // Move the sprite so it matches the body (takes origin into account)
      this.player.y = body.y + body.height * (1 - this.player.originY);
    }
  }

  // =====================================================
  //                  NOTE SPAWN LOGIC
  // =====================================================

  protected spawnMusicNote(
    lane: number,
    frame: number,
    xOffsetPx: number = 0,
    spawnTimeMs?: number
  ): void {
    const baseX = this.scale.width + 50;
    const x = baseX - xOffsetPx;

    const yPositions = [100, 200, 300, 400];
    const y = yPositions[lane - 1];

    const actualSpawnTime = spawnTimeMs ?? Date.now();

    const note = new MusicNoteSprite(this, x, y, lane, actualSpawnTime, frame);
    const body = note.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(-200);
    body.enable = true;

    note.setDepth(20);

    this.musicNotes.add(note);
  }

  protected scheduleNotesFromMap(songMap: any) {
    const speed = 200; // px/s

    const spawnX = this.scale.width + 50;
    const hitX = this.player.x;
    const distance = spawnX - hitX;
    const travelTimeMs = (distance / speed) * 1000;

    let lastNoteTime = 0;

    songMap.notes.forEach((note: any) => {
      const hitTimeMs = this.musicStartTimeMs + note.time;
      const spawnTimeMs = hitTimeMs - travelTimeMs;
      const delay = spawnTimeMs - this.time.now;

      if (delay >= 0) {
        this.time.delayedCall(delay, () => {
          // Normal spawn
          this.spawnMusicNote(note.lane, note.frame, 0, spawnTimeMs);
        });
      } else {
        const latenessMs = -delay; // Late note — spawn immediately, but shifted left
        const xOffsetPx = (latenessMs / 1000) * speed;

        this.spawnMusicNote(note.lane, note.frame, xOffsetPx, spawnTimeMs);
      }

      lastNoteTime = Math.max(lastNoteTime, hitTimeMs);
    });

    const extraDelay = 2000;
    const now = this.time.now;
    const delayMs = Math.max(0, lastNoteTime + extraDelay - now);

    //this.time.delayedCall(delayMs, () => this.showEndMenu());
    this.time.delayedCall(delayMs, async () => {
      await this.endRun();
      this.showEndMenu();
    });
  }

  protected onNoteMissed(): void {
    if (!this.controlledTrack || this.controlledTrackFaded) return;

    this.controlledTrackFaded = true;

    this.tweens.add({
      targets: this.controlledTrack,
      volume: 0,
      duration: 300,
      ease: "Linear",
    });
  }

  protected onNoteHit(): void {
    if (!this.controlledTrack || !this.controlledTrackFaded) return;

    this.controlledTrackFaded = false;

    this.tweens.add({
      targets: this.controlledTrack,
      volume: 1,
      duration: 150,
      ease: "Linear",
    });
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

  // -----------------------------
  // SEND DATA TO BACKEND
  // -----------------------------
  protected runEvents: Array<{
    timeMs: number;
    lane: number;
    type: "HIT" | "MISS";
  }> = [];

  protected collectRunEvents() {
    return [...this.runEvents].sort((a, b) => a.timeMs - b.timeMs);
  }

  protected async endRun(): Promise<void> {
    const runData = {
      email: localStorage.getItem("playeremail"),
      name: localStorage.getItem("playername"),
      run: {
        songKey: this.songConfig.key,
        partKey: this.partConfig.key,
        events: this.collectRunEvents(), // you will implement this
      },
    };

    try {
      const result = await this.api.submitRun(runData);
      console.log("Run submitted! Score:", result.score);

      // optionally update UI
      this.scoreText.setText(`Final Score: ${result.score}`);
    } catch (err) {
      console.error("Failed to submit run:", err);
    }
  }
}
