import Phaser from "phaser";
import UIButton from "../../components/ui/UiButton";
import Popup from "../../components/ui/Popup";
import { SongRegistry } from "../../songconfig/SongRegistry";
import type { SongConfig } from "../../songconfig/songconfig";
import ImgButton from "../../components/ui/ImgButton";
import BaseLevelScene from "../gameplay/BaseLevelScene";

// Simple mobile detection
function isMobileDevice(): boolean {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 1024)
  );
}

export default class StartMenuScene extends Phaser.Scene {
  private uiContainer!: Phaser.GameObjects.Container;
  private popupContainer: Popup | null = null;
  private popupStack: Popup[] = []; // stack popups for song select and part select
  private resizeHandler?: (size: Phaser.Structs.Size) => void;

  // UI elements that need repositioning on resize
  private title!: Phaser.GameObjects.Image;
  private buttons: Phaser.GameObjects.Container[] = [];
  private bg!: Phaser.GameObjects.Image;

  // Mobile orientation handling
  private rotateOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "StartMenuScene" });
  }

  preload(): void {
    this.load.image("menu-bg", "/assets/img/menu-bg-purple-grid.png");
    this.load.image("title-graphic", "/assets/img/title-graphic.png");
    this.load.image("start-button", "/assets/img/start-button.png");
    this.load.image(
      "instructions-button",
      "/assets/img/instructions-button.png"
    );
    this.load.image("scoring-button", "/assets/img/scoring-button.png");
    this.load.image("socials-button", "/assets/img/socials-button.png");

    Object.values(SongRegistry).forEach((song) => {
      Object.values(song.parts).forEach((part) => {
        this.load.spritesheet(part.playerSpriteKey, part.playerSpritePath, {
          frameWidth: 512,
          frameHeight: 512,
        });
      });
    });
  }

  create(): void {
    // Ensure responsive mode is active for menu
    BaseLevelScene.restoreResponsiveMode(this);

    const { width, height } = this.scale;

    // --------------------------------------------
    // BACKGROUND
    // --------------------------------------------
    this.bg = this.add
      .image(width / 2, height / 2, "menu-bg")
      .setOrigin(0.5)
      .setDisplaySize(width, height)
      .setDepth(-10);

    // --------------------------------------------
    // MAIN UI CONTAINER
    // --------------------------------------------
    this.uiContainer = this.add.container(width / 2, height / 2);

    // Title
    this.title = this.add.image(0, 0, "title-graphic").setOrigin(0.5);
    this.uiContainer.add(this.title);

    // --------------------------------------------
    // BUTTONS
    // --------------------------------------------
    const startBtn = new ImgButton(this, 0, 0, "start-button", () => {
      const email = localStorage.getItem("playeremail");
      const name = localStorage.getItem("playername");
      if (email && name) {
        this.openSongSelectPopup();
      } else {
        this.openPlayerInfoPopup();
      }
    });

    const instructionsBtn = new ImgButton(
      this,
      0,
      0,
      "instructions-button",
      () => {
        this.openInfoPopup(
          "Instructions",
          [
            "• Click to jump",
            "• Collect musical notes to score points",
            "• If you miss a note, the part you play will go quiet",
            "• Collect musical notes to restore the music",
            "• Each note is worth 100 points",
          ].join("\n")
        );
      }
    );

    const scoringBtn = new ImgButton(this, 0, 0, "scoring-button", () => {
      this.openInfoPopup(
        "Scoring",
        [
          "Every 12 hours:",
          "Every 12 hours, the top 3 scores are moved to the '1 Week' leaderboard, and this leaderboard is reset. All scores are also moved to the All-Time Leaderboard. Players cannot be duplicate; your score will be updated if you achieve a higher score.",
          "",
          "Every week:",
          "Every week, a random player on this leaderboard will be sent an email with a special reward code for an upcoming concert. This leaderboard is then reset. Players can be duplicate on this leaderboard to increase their chances of winning.",
          "",
          "All Time:",
          "Each player's highest score ever achieved is recorded here. This leaderboard is never reset.",
        ].join("\n")
      );
    });

    const socialBtn = new ImgButton(this, 0, 0, "socials-button", () => {
      window.open(
        "https://linktr.ee/NoNSEnsSpex?utm_source=linktree_profile_share&ltsid=84c07043-7b55-49c4-be04-c9aa0b8fbec1",
        "_blank"
      );
    });

    this.buttons = [startBtn, instructionsBtn, scoringBtn, socialBtn];
    this.uiContainer.add(this.buttons);

    // Initial layout
    this.layoutUI(width, height);

    // --------------------------------------------
    // RESPONSIVE + MOBILE ORIENTATION CHECK
    // --------------------------------------------
    this.resizeHandler = (size: Phaser.Structs.Size) => {
      this.bg.setPosition(size.width / 2, size.height / 2);
      this.bg.setDisplaySize(size.width, size.height);
      this.uiContainer.setPosition(size.width / 2, size.height / 2);
      this.layoutUI(size.width, size.height);
      if (this.popupContainer) {
        this.popupContainer.setPosition(size.width / 2, size.height / 2);
      }
      // Check mobile orientation
      this.checkMobileOrientation();
    };

    this.scale.on("resize", this.resizeHandler);

    // Initial orientation check
    this.checkMobileOrientation();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off("resize", this.resizeHandler);
    });
  }

  /**
   * Lays out UI elements based on current screen dimensions.
   * Scales and positions elements to fit any screen size.
   */
  private layoutUI(width: number, height: number): void {
    // Scale based on the smaller dimension to ensure everything fits
    const baseSize = 600; // Reference size for scaling
    const scaleFactor = Math.min(width, height) / baseSize;
    const clampedScale = Math.max(0.5, Math.min(1.5, scaleFactor));

    // Title - scale to be readable but not huge
    const titleScale = clampedScale * 0.4;
    this.title.setScale(titleScale);
    this.title.y = -height * 0.26;

    // Buttons - scale and stack with proper gaps
    const buttonScale = clampedScale * 0.55;
    const buttonGap = 85 * clampedScale;
    const buttonsStartY = -height * 0.12;

    this.buttons.forEach((btn, i) => {
      btn.setScale(buttonScale);
      btn.y = buttonsStartY + i * buttonGap;
    });
  }

  // ============================================================
  // MOBILE ORIENTATION HANDLING
  // ============================================================
  private checkMobileOrientation(): void {
    const isMobile = isMobileDevice();
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isMobile && !isLandscape) {
      this.showRotateOverlay();
    } else {
      this.hideRotateOverlay();
    }
  }

  private showRotateOverlay(): void {
    if (this.rotateOverlay) return;

    const { width, height } = this.scale;

    this.rotateOverlay = this.add.container(width / 2, height / 2);
    this.rotateOverlay.setDepth(1000);

    // Dark background
    const bg = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.9);
    this.rotateOverlay.add(bg);

    // Rotate icon
    const phoneIcon = this.add
      .text(0, -60, "📱↔️", { fontSize: "64px" })
      .setOrigin(0.5);
    this.rotateOverlay.add(phoneIcon);

    // Message
    const message = this.add
      .text(0, 40, "Please rotate your device\nto landscape mode", {
        fontSize: "28px",
        color: "#ffffff",
        fontFamily: "Arial",
        align: "center",
      })
      .setOrigin(0.5);
    this.rotateOverlay.add(message);
  }

  private hideRotateOverlay(): void {
    if (!this.rotateOverlay) return;

    this.rotateOverlay.destroy();
    this.rotateOverlay = undefined;
  }

  // ============================================================
  // POPUP: PLAYER INFO
  // ============================================================
  private openPlayerInfoPopup() {
    const { width, height } = this.scale;

    const popup = new Popup(
      this,
      width,
      height,
      "Player Info",
      "Enter your email and leaderboard name",
      [],
      () => this.popPopup(),
      { showBackButton: false }
    );

    const form = this.add.dom(0, 40).createFromHTML(`
    <form style="display:flex;flex-direction:column;gap:12px;width:300px">
      <input name="email" type="email" placeholder="Email" />
      <input name="name" type="text" placeholder="Leaderboard Name" />
      <button type="button" name="submit" style="
        background-color:#E8C1FA;
        color:#000;
        border:none;
        padding:10px;
        font-size:16px;
        border-radius:6px;
        cursor:pointer;
      ">Continue</button>
    </form>
  `);

    popup.addToContainer(form);

    form.addListener("click");
    form.on("click", (event: any) => {
      if (event.target.name === "submit") {
        const email = form.getChildByName("email") as HTMLInputElement;
        const name = form.getChildByName("name") as HTMLInputElement;

        if (!email.value || !name.value) return;

        localStorage.setItem("playeremail", email.value);
        localStorage.setItem("playername", name.value);

        this.popPopup();
        this.openSongSelectPopup();
      }
    });

    this.pushPopup(popup);
  }

  // ============================================================
  // POPUP: SONG SELECT
  // ============================================================
  private openSongSelectPopup() {
    const { width, height } = this.scale;

    const songButtons = Object.values(SongRegistry).map(
      (song) =>
        new UIButton(this, song.displayName, width * 0.35, 60, () => {
          //song.key.toUpperCase()
          this.openPartSelectPopup(song);
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

  private openPartSelectPopup(song: SongConfig) {
    const { width, height } = this.scale;

    const BUTTON_WIDTH = width * 0.2;
    const BUTTON_HEIGHT = 150;
    const GAP_X = 40;
    const GAP_Y = 40;

    const partButtons = Object.values(song.parts).map((part) => {
      const btn = new UIButton(
        this,
        part.displayName,
        BUTTON_WIDTH,
        BUTTON_HEIGHT,
        () => {
          this.clearPopups();
          this.scene.start(song.sceneKey, {
            songKey: song.key,
            partKey: part.key,
          });
        }
      );

      btn.remove(btn.text); // Remove default text

      // Add thumbnail sprite to the button
      const thumb = this.add
        .sprite(0, -BUTTON_HEIGHT / 4 + 20, part.playerSpriteKey, 0) // 0 = first frame
        .setOrigin(0.5);
      thumb.setScale((BUTTON_HEIGHT * 0.65) / thumb.height);
      btn.add(thumb);

      // Add text below the sprite
      const label = this.add
        .text(
          0,
          thumb.displayHeight + 15 - BUTTON_HEIGHT / 2,
          part.displayName,
          {
            fontSize: "24px",
            color: "#ffffff",
            fontFamily: "Arial",
          }
        )
        .setOrigin(0.5, 0); // top-center
      btn.add(label);

      return btn;
    });

    const popup = new Popup(
      this,
      width,
      height,
      "Select Part",
      `Choose a part for ${song.key}`,
      partButtons,
      () => this.popPopup(),
      { showBackButton: true }
    );

    // Arrange buttons in 2 columns, multiple rows
    partButtons.forEach((btn, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);

      btn.x = col * (BUTTON_WIDTH + GAP_X) - (BUTTON_WIDTH + GAP_X) / 2;
      btn.y = 150 + row * (BUTTON_HEIGHT + GAP_Y);
    });

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
