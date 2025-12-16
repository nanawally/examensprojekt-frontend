import Phaser from "phaser";
import UIButton from "../../components/ui/UiButton";
import Popup from "../../components/ui/Popup";

export default class StartMenuScene extends Phaser.Scene {
  private uiContainer!: Phaser.GameObjects.Container;
  private popupContainer: Popup | null = null;
  private resizeHandler?: (size: Phaser.Structs.Size) => void;

  constructor() {
    super({ key: "StartMenuScene" });
  }

  preload(): void {
    this.load.image("menu-bg", "/assets/img/menu-bg.png");
  }

  create(): void {
    const { width, height } = this.scale;

    // --------------------------------------------
    // BACKGROUND
    // --------------------------------------------
    const bg = this.add
      .image(width / 2, height / 2, "menu-bg")
      .setOrigin(0.5)
      .setDisplaySize(width, height)
      .setDepth(-10);

    // --------------------------------------------
    // MAIN UI CONTAINER
    // --------------------------------------------
    this.uiContainer = this.add.container(width / 2, height / 2);

    // Title
    const title = this.add
      .text(0, -200, "Music Runner", {
        fontSize: "64px",
        fontFamily: "Arial",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // --------------------------------------------
    // BUTTONS
    // --------------------------------------------
    const BUTTON_WIDTH = width * 0.3;
    const BUTTON_HEIGHT = 70;
    const GAP = 40;

    const startBtn = new UIButton(
      this,
      "Choose Level",
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      () => {
        this.openSongSelectPopup();
      }
    );

    const instructionsBtn = new UIButton(
      this,
      "Instructions",
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      () => {
        this.openInfoPopup("Instructions", "How to play the game...");
      }
    );

    const scoringBtn = new UIButton(
      this,
      "Scoring",
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      () => {
        this.openInfoPopup("Scoring", "Scoring rules go here...");
      }
    );

    const socialBtn = new UIButton(
      this,
      "Socials",
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      () => {
        window.location.href = "https://example.com";
      }
    );

    const buttons = [startBtn, instructionsBtn, scoringBtn, socialBtn];

    // Stack buttons vertically under title
    this.stackVertically(buttons, -100, BUTTON_HEIGHT + GAP);

    this.uiContainer.add([title, ...buttons]);

    // --------------------------------------------
    // RESPONSIVE
    // --------------------------------------------

    this.resizeHandler = (size: any) => {
      bg.setDisplaySize(size.width, size.height);
      this.uiContainer.setPosition(size.width / 2, size.height / 2);
      if (this.popupContainer)
        this.popupContainer.setPosition(size.width / 2, size.height / 2);
    };

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off("resize", this.resizeHandler);
    });
  }

  // ============================================================
  // POPUP: SONG SELECT
  // ============================================================
  private openSongSelectPopup() {
    if (this.popupContainer) return; // prevent double popup
    
    const { width, height } = this.scale;
    
    const levels = [
      { key: "TestScene1", name: "Test Song" },
      { key: "Song2Scene", name: "Rock Beat" },
      { key: "Song2Scene", name: "Epic Drop" },
      { key: "Song2Scene", name: "Neon Rush" },
      { key: "Song2Scene", name: "Drift King" },
      { key: "Song2Scene", name: "Night Drive" },
      { key: "Song2Scene", name: "Synthwave" },
      { key: "Song2Scene", name: "Final Boss" },
      { key: "Song2Scene", name: "Victory Lap" },
    ];
    
    // Create song buttons
    const songButtons: UIButton[] = levels.map(
      (level) =>
        new UIButton(this, level.name, width * 0.35, 60, () => {
          this.popupContainer?.destroy();
          this.scene.start(level.key);
        })
    );
    
    this.popupContainer = new Popup(
      this,
      width,
      height,
      "Select Song",
      "Choose your track and run!",
      songButtons,
      () => {
        this.popupContainer = null; // Only set to null here — safe & clean
      }
    );
  }

  // ============================================================
  // POPUP: GENERIC INFO POPUP
  // ============================================================
  private openInfoPopup(titleText: string, content: string) {
    if (this.popupContainer) return;

    const { width, height } = this.scale;

    this.popupContainer = new Popup(
      this,
      width,
      height,
      titleText,
      content,
      [], // no buttons
      () => {
        this.popupContainer = null; // Cleanup reference
      }
    );
  }

  // ============================================================
  // HELPERS
  // ============================================================
  private stackVertically(
    items: Phaser.GameObjects.Container[],
    startY: number,
    gap: number
  ) {
    let y = startY;
    for (const item of items) {
      item.y = y;
      y += gap;
    }
  }
}
