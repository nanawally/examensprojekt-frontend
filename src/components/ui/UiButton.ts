import Phaser from "phaser";

export default class UIButton extends Phaser.GameObjects.Container {
  public bg: Phaser.GameObjects.Rectangle;
  public text: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    label: string,
    width: number,
    height: number,
    callback: () => void
  ) {
    super(scene, 0, 0);

    this.bg = scene.add
      .rectangle(0, 0, width, height, 0x0A0A70)
      .setOrigin(0.5)
      .setRounded(10)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });
    
    this.bg.on("pointerdown", callback);

    this.text = scene.add
      .text(0, 0, label, {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);
    
    this.add([this.bg, this.text]);

    this.setSize(width, height);

    // ✨ IMPORTANT ✨
    // DO NOT add the button to the scene automatically.
    // It must be added only when the popup chooses the parent.
    //scene.add.existing(this); // <-- THIS IS OK ONLY IF buttons are added to popup afterwards
  }
}
