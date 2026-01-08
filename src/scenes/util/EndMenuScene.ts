import Phaser from "phaser";

interface EndMenuData {
  levelKey: string; // key of the level that just finished
}

export default class EndMenuScene extends Phaser.Scene {
  private levelKey!: string;

  constructor() {
    super({ key: "EndMenuScene" });
  }

  init(data: EndMenuData) {
    this.levelKey = data.levelKey;
  }

  preload(): void {
    this.load.image("endmenu-bg", "/assets/img/menu-bg-purple-grid.png");
    this.load.image("replay-button", "/assets/img/replay-button.png");
    this.load.image("mainmenu-button", "/assets/img/start-menu-button.png");
  }
  
  create(): void {
    const { width, height } = this.scale;

    // Background
    this.add
      .image(width / 2, height / 2, "endmenu-bg")
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // Level Complete text
    this.add
      .text(width / 2, height * 0.2, "Level Complete!", {
        fontSize: "64px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // Replay button (left side)
    const replayButton = this.add
      .image(width * 0.25, height * 0.6, "replay-button")
      .setInteractive({ useHandCursor: true });

    replayButton.on("pointerover", () => replayButton.setScale(1.1));
    replayButton.on("pointerout", () => replayButton.setScale(1));
    replayButton.on("pointerdown", () => {
      this.scene.start(this.levelKey);
    });
    
    // Main menu button (right side)
    const mainMenuButton = this.add
      .image(width * 0.75, height * 0.6, "mainmenu-button")
      .setInteractive({ useHandCursor: true });

    mainMenuButton.on("pointerover", () => mainMenuButton.setScale(1.1));
    mainMenuButton.on("pointerout", () => mainMenuButton.setScale(1));
    mainMenuButton.on("pointerdown", () => {
      this.scene.start("StartMenuScene");
    });
  }
}
