import { useEffect } from "react";
import Phaser from "phaser";
import BackgroundScene from "./scenes/BackgroundScene";

function App() {
  useEffect(() => {
    const existingGame = (window as any).phaserGame as Phaser.Game | undefined;
    if (existingGame) existingGame.destroy(true);

    (window as any).phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      /* width: window.innerWidth,
      height: window.innerHeight, */
      parent: "phaser-container",
      backgroundColor: "#5DACD8",
      scene: [BackgroundScene],
      scale: {
        mode: Phaser.Scale.RESIZE, // important for full-viewport responsiveness
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 640,
        height: 960,
        min: { width: 320, height: 480 },
        max: { width: 1400, height: 1200 },
      },
      /* The ‘debug: true’ setting will show you the velocity and the hit area of any object that has physics. It is great for debugging. Make sure you turn it off before publishing your game so your players don’t see the bounding boxes */
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 300 },
          debug: true,
        },
      },
    });
  }, []);

  return (
    <div id="phaser-container" style={{ width: "100%", height: "100%" }} />
  );
}

export default App;
