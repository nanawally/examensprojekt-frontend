import Phaser from "phaser";
import BaseLevelScene from "../gameplay/BaseLevelScene";

interface EndMenuData {
  levelKey: string;
  songKey: string;
  partKey: string;
}

export default class EndMenuScene extends Phaser.Scene {
  private levelKey!: string;
  private songKey!: string;
  private partKey!: string;
  private resizeHandler?: (size: Phaser.Structs.Size) => void;

  // UI elements for responsive layout
  private bg!: Phaser.GameObjects.Image;
  private title!: Phaser.GameObjects.Text;
  private replayButton!: Phaser.GameObjects.Image;
  private mainMenuButton!: Phaser.GameObjects.Image;
  private baseButtonScale = 1;

  constructor() {
    super({ key: "EndMenuScene" });
  }

  init(data: EndMenuData) {
    this.levelKey = data.levelKey;
    this.songKey = data.songKey;
    this.partKey = data.partKey;
  }

  preload(): void {
    this.load.image("endmenu-bg", "/assets/img/menu-bg-purple-grid.png");
    this.load.image("replay-button", "/assets/img/replay-button.png");
    this.load.image("mainmenu-button", "/assets/img/start-menu-button.png");
  }

  create(): void {
    // Ensure responsive mode is active for menu
    BaseLevelScene.restoreResponsiveMode(this);

    const { width, height } = this.scale;

    // Background
    this.bg = this.add
      .image(width / 2, height / 2, "endmenu-bg")
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // Level Complete text
    this.title = this.add
      .text(width / 2, height * 0.25, "Level Complete!", {
        fontSize: "64px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // Replay button (left side)
    this.replayButton = this.add
      .image(width * 0.35, height * 0.55, "replay-button")
      .setInteractive({ useHandCursor: true });

    this.replayButton.on("pointerover", () =>
      this.replayButton.setScale(this.baseButtonScale * 1.1)
    );
    this.replayButton.on("pointerout", () =>
      this.replayButton.setScale(this.baseButtonScale)
    );
    this.replayButton.on("pointerdown", () => {
      this.scene.start(this.levelKey, {
        songKey: this.songKey,
        partKey: this.partKey,
      });
    });

    // Main menu button (right side)
    this.mainMenuButton = this.add
      .image(width * 0.65, height * 0.55, "mainmenu-button")
      .setInteractive({ useHandCursor: true });

    this.mainMenuButton.on("pointerover", () =>
      this.mainMenuButton.setScale(this.baseButtonScale * 1.1)
    );
    this.mainMenuButton.on("pointerout", () =>
      this.mainMenuButton.setScale(this.baseButtonScale)
    );
    this.mainMenuButton.on("pointerdown", () => {
      this.scene.start("StartMenuScene");
    });

    // Initial layout
    this.layoutUI(width, height);

    // Resize handler for responsive menu
    this.resizeHandler = (size: Phaser.Structs.Size) => {
      this.layoutUI(size.width, size.height);
    };

    this.scale.on("resize", this.resizeHandler);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off("resize", this.resizeHandler);
    });
  }

  /**
   * Lays out UI elements based on current screen dimensions.
   */
  private layoutUI(width: number, height: number): void {
    // Scale factor based on screen size
    const baseSize = 800;
    const scaleFactor = Math.min(width, height) / baseSize;
    const clampedScale = Math.max(0.4, Math.min(1.2, scaleFactor));

    // Background
    this.bg.setPosition(width / 2, height / 2);
    this.bg.setDisplaySize(width, height);

    // Title - scale font size
    const fontSize = Math.floor(48 * clampedScale);
    this.title.setFontSize(fontSize);
    this.title.setPosition(width / 2, height * 0.25);

    // Buttons - scale and position
    this.baseButtonScale = clampedScale * 0.8;
    this.replayButton.setScale(this.baseButtonScale);
    this.mainMenuButton.setScale(this.baseButtonScale);

    this.replayButton.setPosition(width * 0.35, height * 0.55);
    this.mainMenuButton.setPosition(width * 0.65, height * 0.55);
  }
}
