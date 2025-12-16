import Phaser from "phaser";
import UIButton from "../../components/ui/UiButton";
import Popup from "../../components/ui/Popup";

export default class StartMenuScene extends Phaser.Scene {
  private uiContainer!: Phaser.GameObjects.Container;
  private popupContainer: Popup | null = null;
  private popupStack: Popup[] = []; // stack popups for song select and part select
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
        this.openInfoPopup(
          "Instructions",
          [
            "• Use arrow keys to move",
            "• Avoid obstacles",
            "• Collect points",
            "• Enjoy the music",
          ].join("\n")
        );
      }
    );

    const scoringBtn = new UIButton(
      this,
      "Scoring",
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      () => {
        this.openInfoPopup(
          "Scoring",
          [
            "Every 12 hours:",
            "Leaderboard for the past 12 hours resets.",
            "",
            "Every 24 hours:",
            "Leaderboard info woo!",
            "",
            "All Time:",
            "Highest scores ever achieved are recorded here.",
          ].join("\n")
        );
      }
    );

    const socialBtn = new UIButton(
      this,
      "Socials",
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      () => {
        window.location.href =
          "https://linktr.ee/NoNSEnsSpex?utm_source=linktree_profile_share&ltsid=84c07043-7b55-49c4-be04-c9aa0b8fbec1";
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
          this.openPartSelectPopup(level);
        })
    );

    const popup = new Popup(
      this,
      width,
      height,
      "Select Song",
      "",
      songButtons,
      () => {
        this.popPopup();
      }
    );
    
    this.pushPopup(popup);
  }

  // ============================================================
  // POPUP: PART SELECT
  // ============================================================

  private openPartSelectPopup(level: { key: string; name: string }) {
    const { width, height } = this.scale;

    const buttons = [
      new UIButton(this, "Start Level", width * 0.35, 60, () => {
        this.clearPopups();
        this.scene.start(level.key);
      }),
    ];

    const popup = new Popup(
      this,
      width,
      height,
      "Select Part",
      `Choose a part for ${level.name}`,
      buttons,
      () => {
        this.popPopup(); // only closes this popup
      },
      {
        showBackButton: true,
      }
    );

    this.pushPopup(popup);
  }

  // ============================================================
  // POPUP: GENERIC INFO POPUP
  // ============================================================
  private openInfoPopup(titleText: string, content: string) {
    const { width, height } = this.scale;

    const popup = new Popup(
      this,
      width,
      height,
      titleText,
      content,
      [],
      () => this.popPopup(),
      { showBackButton: false }
    );

    this.pushPopup(popup);
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

  private pushPopup(popup: Popup) {
    const depthBase = 100 + this.popupStack.length * 10;
    popup.setDepth(depthBase);

    // disable input on previous popup
    this.popupStack.at(-1)?.setActive(false);

    this.popupStack.push(popup);
  }

  private popPopup() {
    const popup = this.popupStack.pop();
    popup?.destroy();

    // re-enable input on previous popup
    this.popupStack.at(-1)?.setActive(true);
  }

  private clearPopups() {
    while (this.popupStack.length) {
      this.popupStack.pop()?.destroy();
    }
  }
}
