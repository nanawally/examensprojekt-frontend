import Phaser from "phaser";
import ApiService from "../../logic/ApiService";
import PlayerSprite from "../../sprites/players/PlayerSprite";
import type { PlayerConfig } from "../../sprites/players/PlayerSprite";
import MusicNoteSprite from "../../sprites/items/MusicNoteSprite";
import { SongRegistry } from "../../songconfig/SongRegistry";
import type { SongConfig, PartConfig } from "../../songconfig/SongConfig";
import ScoreManager from "../../logic/ScoreManager";

interface RunEventDTO {
  timeMs: number;
  lane: number;
  type: "HIT" | "MISS";
}

interface SongMapNote {
  time: number;
  lane: number;
  frame: number;
}

interface SongMap {
  notes: SongMapNote[];
}

// Target aspect ratio for gameplay (landscape only)
const TARGET_ASPECT_RATIO = 16 / 9;

// Simple mobile detection - checks for touch support and screen size
function isMobileDevice(): boolean {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 1024)
  );
}

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

  // Mobile orientation handling
  private isMobile = false;
  private rotateOverlay?: Phaser.GameObjects.Container;
  private orientationHandler?: () => void;

  constructor(key: string) {
    super(key);
    this.levelKey = key;
    this.api = new ApiService(import.meta.env.VITE_API_URL ?? "http://localhost:8080");
  }

  /**
   * Locks the game to a fixed size that fits the current window.
   * Calculates the largest 16:9 size that fits, then locks it.
   * On mobile portrait, shows a "please rotate" overlay instead.
   */
  protected lockGameplaySize(): void {
    this.isMobile = isMobileDevice();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const isLandscape = windowWidth > windowHeight;

    // Mobile in portrait - show rotate message instead of gameplay
    if (this.isMobile && !isLandscape) {
      this.showRotateOverlay();
      this.setupOrientationListener();
      return;
    }

    this.hideRotateOverlay();

    if (this.isMobile) {
      this.setupOrientationListener();
    }

    const windowRatio = windowWidth / windowHeight;

    let gameWidth: number;
    let gameHeight: number;

    // Calculate largest size that fits within window while maintaining 16:9 aspect ratio
    if (windowRatio > TARGET_ASPECT_RATIO) {
      // Window is wider than 16:9 - constrain by height
      gameHeight = windowHeight;
      gameWidth = gameHeight * TARGET_ASPECT_RATIO;
    } else {
      // Window is taller than 16:9 - constrain by width
      gameWidth = windowWidth;
      gameHeight = gameWidth / TARGET_ASPECT_RATIO;
    }

    this.scale.setGameSize(Math.floor(gameWidth), Math.floor(gameHeight));
    this.scale.scaleMode = Phaser.Scale.FIT;
    this.scale.refresh();
  }

  /**
   * Shows a "Please rotate your device" overlay for mobile users in portrait mode.
   */
  private showRotateOverlay(): void {
    if (this.rotateOverlay) return;

    const { width, height } = this.scale;

    this.rotateOverlay = this.add.container(width / 2, height / 2);
    this.rotateOverlay.setDepth(1000);

    // Dark background
    const bg = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.9);
    this.rotateOverlay.add(bg);

    // Rotate icon (simple phone shape)
    const phoneIcon = this.add.text(0, -60, "📱↔️", {
      fontSize: "64px",
    }).setOrigin(0.5);
    this.rotateOverlay.add(phoneIcon);

    // Message
    const message = this.add.text(0, 40, "Please rotate your device\nto landscape mode", {
      fontSize: "28px",
      color: "#ffffff",
      fontFamily: "Arial",
      align: "center",
    }).setOrigin(0.5);
    this.rotateOverlay.add(message);

    // Pause gameplay while overlay is shown
    this.scene.pause();
  }

  /**
   * Hides the rotate overlay and resumes gameplay.
   */
  private hideRotateOverlay(): void {
    if (!this.rotateOverlay) return;

    this.rotateOverlay.destroy();
    this.rotateOverlay = undefined;

    // Resume gameplay if it was paused
    if (!this.scene.isActive()) {
      this.scene.resume();
    }
  }

  /**
   * Sets up a listener for device orientation changes.
   */
  private setupOrientationListener(): void {
    if (this.orientationHandler) return;

    this.orientationHandler = () => {
      const isLandscape = window.innerWidth > window.innerHeight;

      if (this.isMobile && !isLandscape) {
        this.showRotateOverlay();
      } else {
        this.hideRotateOverlay();
        // Recalculate game size for new orientation
        this.lockGameplaySize();
      }
    };

    window.addEventListener("resize", this.orientationHandler);

    // Clean up on scene shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.orientationHandler) {
        window.removeEventListener("resize", this.orientationHandler);
        this.orientationHandler = undefined;
      }
    });
  }

  /**
   * Restores responsive resize mode for menu scenes.
   * Call this before transitioning to a menu scene.
   */
  public static restoreResponsiveMode(scene: Phaser.Scene): void {
    scene.scale.scaleMode = Phaser.Scale.RESIZE;
    scene.scale.refresh();
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
  private scaleFactor = 1;

  create() {
    // Lock to fixed size to prevent note/player desync during gameplay
    this.lockGameplaySize();

    const { width, height } = this.scale;

    this.scaleFactor = height / this.baseScreenHeight;

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
      gravity: 1800 * this.scaleFactor, // incease = lower jumps, decrease = higher jumps
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
    // COMMON: jump input (tap/click + spacebar)
    // -----------------------------
    this.input.on("pointerdown", () => this.tryJump());

    const spaceBar = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceBar?.on("down", () => this.tryJump());

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

    this.physics.add.overlap(this.player, this.musicNotes, (_player, note) => {
      (note as MusicNoteSprite).collect();
    });

    this.positionPlayerOnGround();

    // Note: No resize listener - gameplay uses fixed size to prevent note desync
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

  /**
   * Attempts to make the player jump if they're on the ground.
   */
  private tryJump(): void {
    if (!this.player?.body) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (body.blocked.down || body.touching.down) {
      const jumpVelocity = -1500 * this.scaleFactor;
      this.player.setVelocityY(jumpVelocity);
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

    // Scale lane positions based on screen height
    // Player is 25% tall, standing at ground (~83%), so player top is ~58%
    // Notes are 10% tall (centered), so need 5% margin from edges
    // All lanes must be ABOVE player's standing position to require jumping
    const { height } = this.scale;
    const yPositions = [
      height * 0.18,  // Lane 1 - highest (note spans 13%-23%)
      height * 0.30,  // Lane 2 (note spans 25%-35%)
      height * 0.42,  // Lane 3 (note spans 37%-47%)
      height * 0.52,  // Lane 4 - lowest (note spans 47%-57%, just above player head at 58%)
    ];
    const y = yPositions[lane - 1];

    const actualSpawnTime = spawnTimeMs ?? Date.now();

    const note = new MusicNoteSprite(this, x, y, lane, actualSpawnTime, frame);
    const body = note.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(-200);
    body.enable = true;

    note.setDepth(20);

    this.musicNotes.add(note);
  }

  protected scheduleNotesFromMap(songMap: SongMap) {
    const speed = 200; // px/s

    const spawnX = this.scale.width + 50;
    const hitX = this.player.x;
    const distance = spawnX - hitX;
    const travelTimeMs = (distance / speed) * 1000;

    let lastNoteTime = 0;

    songMap.notes.forEach((note: SongMapNote) => {
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
    // Restore responsive mode before transitioning to menu
    BaseLevelScene.restoreResponsiveMode(this);

    this.scene.start("EndMenuScene", {
      levelKey: this.levelKey,
      songKey: this.songConfig.key,
      partKey: this.partConfig.key,
    });
  }

  // -----------------------------
  // SCORING
  // -----------------------------
  protected score: number = 0;
  protected combo: number = 0;
  protected scoreText!: Phaser.GameObjects.Text;
  protected scoreManager!: ScoreManager;

  protected createScoreDisplay(): void {
    this.scoreManager = new ScoreManager();
    // Display score in the top-left corner
    this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
      fontSize: "32px",
      color: "#ffffff",
      fontFamily: "Arial",
    });
    this.scoreText.setDepth(50); // make sure it's on top

    this.scoreManager.onScoreChange((score) => {
      this.scoreText.setText(`Score: ${score}`);
    });
  }

  protected addScore(points: number): void {
    this.scoreManager.addPoints(points);
    //this.score += points;
    //this.scoreText.setText(`Score: ${this.score}`);
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

  /*protected collectRunEvents() {
    return [...this.runEvents].sort((a, b) => a.timeMs - b.timeMs);
  }*/
  protected collectRunEvents(): RunEventDTO[] {
    return this.runEvents
      .filter((e) => e.type === "HIT" || e.type === "MISS")
      .map((e) => ({
        timeMs: Math.round(e.timeMs),
        lane: e.lane,
        type: e.type,
      }))
      .sort((a, b) => a.timeMs - b.timeMs);
  }
  
  protected async endRun(): Promise<void> {
    const email = localStorage.getItem("playeremail");
    const name = localStorage.getItem("playername");

    if (!email || !name) {
      console.error("Missing player email or name in localStorage");
      return;
    }

    const runData = {
      email,
      name,
      run: {
        songKey: this.songConfig.key,
        partKey: this.partConfig.key,
        events: this.collectRunEvents(),
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
