import Phaser from "phaser";
import UIButton from "./UiButton";

export default class Popup {
  private container: Phaser.GameObjects.Container;
  private scrollContainer: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Rectangle;
  private mask: Phaser.Display.Masks.GeometryMask;
  private scrollY = 0;
  private scrollHeight = 0;
  private scrollStartY: number;
  private maskHeight: number;
  private wheelHandler: (p: any, dx: number, dy: number) => void;
  
  private onClose?: () => void;
  scene: any;

  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    titleText: string,
    contentText: string,
    buttons: UIButton[] = [],
    onClose?: () => void
  ) {
    this.onClose = onClose;

    const popupWidth = width * 0.6;
    const popupHeight = height * 0.6;
    this.maskHeight = popupHeight - 180;
    this.scrollStartY = -popupHeight / 2 + 150;
    this.scene = scene;

    // -------------------------------------------------
    // OVERLAY (dark background behind popup)
    // -------------------------------------------------

    this.overlay = scene.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(100);

    // -------------------------------------------------
    // MAIN CONTAINER (all popup elements)
    // -------------------------------------------------

    this.container = scene.add.container(width / 2, height / 2);
    this.container.setDepth(101);

    // -------------------------------------------------
    // BACKGROUND
    // -------------------------------------------------

    const bg = scene.add
      .rectangle(0, 0, popupWidth, popupHeight, 0x222222, 1)
      .setStrokeStyle(4, 0xffffff)
      .setOrigin(0.5);

    bg.setDepth(0);
    this.container.add(bg);

    // -------------------------------------------------
    // TITLE TEXT
    // -------------------------------------------------

    const title = scene.add
      .text(0, -popupHeight / 2 + 50, titleText, {
        fontSize: "48px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    title.setDepth(1);
    this.container.add(title);

    // -------------------------------------------------
    // CONTENT TEXT
    // -------------------------------------------------

    const content = scene.add
      .text(0, -popupHeight / 2 + 110, contentText, {
        fontSize: "28px",
        color: "#dddddd",
        fontFamily: "Arial",
        align: "center",
        wordWrap: { width: popupWidth - 40 },
      })
      .setOrigin(0.5);

    content.setDepth(1);
    this.container.add(content);

    // -------------------------------------------------
    // SCROLL CONTAINER (for buttons)
    // -------------------------------------------------

    this.scrollContainer = scene.add.container(0, this.scrollStartY);
    buttons.forEach((btn, i) => {
      btn.x = 0;
      btn.y = 20 + i * 70;
      this.scrollContainer.add(btn);
    });

    this.scrollHeight = buttons.length * 70 + 20;
    this.scrollContainer.setDepth(2);
    this.container.add(this.scrollContainer);

    // -------------------------------------------------
    //  MASK FOR SCROLLING AREA
    // -------------------------------------------------
    
    const MASK_PADDING_TOP = 12;
    const worldX = width / 2 - popupWidth / 2 + 20;
    const worldY = height / 2 + this.scrollStartY - MASK_PADDING_TOP;

    const maskGfx = scene.add.graphics();
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(worldX, worldY, popupWidth - 40, this.maskHeight + MASK_PADDING_TOP);
    
    maskGfx.setVisible(false);

    this.mask = maskGfx.createGeometryMask();
    buttons.forEach((btn) => {
      btn.setMask(this.mask);
    });
    
    // -------------------------------------------------
    // CLOSE BUTTON (small X, top-right corner)
    // -------------------------------------------------

    const closeBtn = new UIButton(scene, "X", 40, 40, () => this.destroy());
    closeBtn.x = popupWidth / 2 - 30;
    closeBtn.y = -popupHeight / 2 + 30;
    closeBtn.setDepth(3);
    this.container.add(closeBtn);

    // -------------------------------------------------
    // SCROLL INPUT HANDLING
    // -------------------------------------------------

    let lastY = 0;
    this.overlay.on("pointerdown", (p: Phaser.Input.Pointer) => {
      lastY = p.y;
    });

    this.overlay.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      this.scroll(p.y - lastY);
      lastY = p.y;
    });

    this.wheelHandler = (_p: any, _dx: any, dy: number) => {
      this.scroll(-dy * 0.4);
    };

    // Add wheel listener
    scene.input.on("wheel", this.wheelHandler);

    // Auto-remove wheel listener when the scene shuts down
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off("wheel", this.wheelHandler);
    });
  }

  private scroll(delta: number) {
    this.scrollY += delta;
    const minY = Math.min(0, this.maskHeight - this.scrollHeight);
    this.scrollY = Phaser.Math.Clamp(this.scrollY, minY, 0);
    this.scrollContainer.y = this.scrollStartY + this.scrollY;
  }

  setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
    this.overlay.setPosition(x, y);
  }

  destroy() {
    // Remove wheel listener
    this.scene.input.off("wheel", this.wheelHandler);

    // Remove drag listeners
    this.overlay.off("pointerdown");
    this.overlay.off("pointermove");

    // Destroy visuals
    this.mask.destroy();
    this.overlay.destroy();
    this.container.destroy(true);

    // Call optional onClose callback
    this.onClose?.();
  }
}
