import Phaser from "phaser";
import PlayerSprite from "../sprites/PlayerSprite";

export default class BackgroundScene extends Phaser.Scene {
  private cloudsWhite!: Phaser.GameObjects.TileSprite;
  private cloudsWhiteSmall!: Phaser.GameObjects.TileSprite;
  private bricks!: Phaser.GameObjects.TileSprite;
  private player!: PlayerSprite;

  constructor() {
    super({ key: "BackgroundScene" });
  }

  preload(): void {
    const effectiveWidth = window.innerWidth * window.devicePixelRatio;

    let spriteSize: 256 | 512 | 1024;
    if (effectiveWidth > 2000) spriteSize = 1024;
    else if (effectiveWidth > 1000) spriteSize = 512;
    else spriteSize = 256;

    this.load.spritesheet(
      "player",
      `/assets/spritesheets/boy_right_${spriteSize}.png`,
      { frameWidth: spriteSize, frameHeight: spriteSize }
    );

    this.load.image("clouds-white", "/assets/img/clouds-white.png");
    this.load.image("clouds-white-small", "/assets/img/clouds-white-small.png");
    this.load.image("bricks", "/assets/img/bricks.png");
  }

  create(): void {
    // Add tile sprites centered on screen
    // (640, 200) = x, y midpoint; (1280, 400) = width, height
    const width = this.scale.width;
    const height = this.scale.height;
    this.physics.world.setBounds(0, 0, width, height);

    this.cloudsWhite = this.add.tileSprite(
      width / 2,
      height * (2 / 6),
      width,
      height * (2 / 3),
      "clouds-white"
    );

    this.cloudsWhiteSmall = this.add.tileSprite(
      width / 2,
      height * (2 / 6),
      width,
      height * (2 / 3),
      "clouds-white-small"
    );

    this.bricks = this.add.tileSprite(
      width / 2,
      height * (5 / 6),
      width,
      height / 3,
      "bricks"
    );

    const ground = this.physics.add.staticSprite(
      width / 2,
      height * (5 / 6),
      "bricks"
    );
    ground.displayWidth = width;
    ground.displayHeight = height / 3;
    ground.setVisible(false); //invisible, only used for collision

    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });

    this.player = this.physics.add.sprite(
      width / 4,
      height * (3 / 6),
      "player"
    ) as PlayerSprite;
    this.player.setGravityY(100);
    //this.player.setScale(1);
    // Shrink the physics body
    this.player.body!.setSize(this.player.width, this.player.height / 2); // only bottom half collides
    this.player.body!.setOffset(0, this.player.height / 2);
    this.player.setCollideWorldBounds(true);
    this.player.play("walk");

    this.physics.add.collider(this.player, ground);

    this.input.on("pointerdown", () => {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      // Only jump if touching the ground
      if (body.blocked.down || body.touching.down) {
        this.player.setVelocityY(-500);
      }
    });

    // 4️⃣ Recreate scene when resized significantly (optional)
    window.addEventListener("resize", () => this.handleResize());
  }

  private handleResize(): void {
    // Throttle reload to avoid flickering
    this.time.delayedCall(500, () => {
      const effectiveWidth = window.innerWidth * window.devicePixelRatio;
      const currentSpriteSize = this.textures.get("player").get(0).width ?? 512;

      let idealSize: 256 | 512 | 1024;
      if (effectiveWidth > 2000) idealSize = 1024;
      else if (effectiveWidth > 1000) idealSize = 512;
      else idealSize = 256;

      if (idealSize !== currentSpriteSize) {
        // Reload scene to use new asset
        this.scene.restart();
      }
    });
  }

  update(): void {
    this.cloudsWhite.tilePositionX += 0.5;
    this.cloudsWhiteSmall.tilePositionX += 0.25;
    this.bricks.tilePositionX += 0.5;
  }
}
