import { useEffect } from "react";
import Phaser from "phaser";
import TestScene1 from "./scenes/gameplay/TestScene/TestScene1";
import StartMenuScene from "./scenes/util/StartMenuScene";
import EndMenuScene from "./scenes/util/EndMenuScene";
import LuciaScene from "./scenes/gameplay/Lucia/LuciaScene";

function App() {
  useEffect(() => {
    const existingGame = (window as any).phaserGame as Phaser.Game | undefined;
    if (existingGame) existingGame.destroy(true);

    (window as any).phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "phaser-container",
      //backgroundColor: "#5DACD8",
      dom: {
        createContainer: true,
      },
      scene: [StartMenuScene, EndMenuScene, TestScene1, LuciaScene],
      scale: {
        mode: Phaser.Scale.RESIZE, // important for full-viewport responsiveness
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 640,
        height: 960,
        min: { width: 320, height: 480 },
        max: { width: 1400, height: 1200 },
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 300 },
          debug: false, // set to false before publishing
        },
      },
    });
  }, []);

  return (
    <div id="phaser-container" style={{ width: "100%", height: "100%" }} />
  );
}

export default App;
