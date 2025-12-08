import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "StartMenuScene" });
  }

  preload(): void {
    this.load.image("menu-bg", "/assets/img/menu-bg.png");
    this.load.image("start-button", "/assets/img/start-button.png");
  }
  
  create(): void {
    const levels = [
      { key: "Song1Scene", name: "Chill Tune" },
      { key: "Song2Scene", name: "Rock Beat" },
    ];
    
    levels.forEach((level, index) => {
      const btn = this.add
        .text(100, 100 + index * 60, level.name)
        .setInteractive()
        .on("pointerdown", () => this.scene.start(level.key));
    });

    // add background
    this.add
      .image(this.scale.width / 2, this.scale.height / 2, "menu-bg")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(this.scale.width, this.scale.height);

    // add start button
    const startButton = this.add
      .image(this.scale.width / 2, this.scale.height * 0.6, "start-button")
      .setInteractive({ useHandCursor: true });

    startButton.on("pointerdown", () => {
      this.scene.start("TestScene1"); // launch gameplay
    });
  }
}
