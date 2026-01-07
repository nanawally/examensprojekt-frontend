import Phaser from "phaser";
import UIButton from "../../components/ui/UiButton";
import Popup from "../../components/ui/Popup";
import { SongRegistry } from "../../songconfig/songregistry";
import type { SongConfig } from "../../songconfig/songconfig";

export default class StartMenuScene extends Phaser.Scene {
  private uiContainer!: Phaser.GameObjects.Container;
  private popupContainer: Popup | null = null;
  private popupStack: Popup[] = []; // stack popups for song select and part select
  private resizeHandler?: (size: Phaser.Structs.Size) => void;
  
  constructor() {
    super({ key: "StartMenuScene" });
  }

  preload(): void {
    this.load.image("menu-bg", "/assets/img/menu-bg-purple-grid.png");

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
        const email = localStorage.getItem("playeremail");
        const name = localStorage.getItem("playername");

        if (email && name) {
          this.openSongSelectPopup();
        } else {
          this.openPlayerInfoPopup();
        }
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
      <button type="button" name="submit">Continue</button>
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
        new UIButton(this, song.key.toUpperCase(), width * 0.35, 60, () => {
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
