import { useEffect } from "react";
import Phaser from "phaser";
import BackgroundScene from "./scenes/BackgroundScene";

function App() {
  useEffect(() => {
    const existingGame = (window as any).phaserGame as Phaser.Game | undefined;
    if (existingGame) existingGame.destroy(true);

    (window as any).phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: "phaser-container",
      backgroundColor: "#5DACD8",
      scene: [BackgroundScene],
      scale: {
        mode: Phaser.Scale.RESIZE, // important for full-viewport responsiveness
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
  }, []);

  return (
    <div id="phaser-container" style={{ width: "100%", height: "100%" }} />
  );
}

export default App;
