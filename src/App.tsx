import { useEffect } from "react";
import Phaser from "phaser";
import BackgroundScene from "./scenes/BackgroundScene";

function App() {
  useEffect(() => {
    const existingGame = (window as any).phaserGame as Phaser.Game | undefined;
    if (existingGame) existingGame.destroy(true);

    (window as any).phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: "phaser-container",
      backgroundColor: "#5DACD8",
      scene: [BackgroundScene],
    });
  }, []);

  return <div id="phaser-container" />;
}

export default App;
