import type { SongConfig } from "../songconfig/songconfig.ts";

export const SongRegistry: Record<string, SongConfig> = {
  lucia: {
    key: "lucia",
    sceneKey: "LuciaScene",
    displayName: "Lucia",
    bpm: 110,
    background: {
      sky: "snow-mountain",
      ground: "bricks",
    },
    parts: {
      soprano: {
        key: "soprano",
        displayName: "Soprano",
        songMapKey: "lucia_soprano",
        playerSpriteKey: "lucia_soprano_player",
        playerSpritePath: "/assets/spritesheets/lucia/lucia_soprano_512.png",
      },
      alto: {
        key: "alto",
        displayName: "Alto",
        songMapKey: "lucia_alto",
        playerSpriteKey: "lucia_alto_player",
        playerSpritePath: "/assets/spritesheets/lucia/lucia_alto_512.png",
      },
    },
  },
  testsong: {
    key: "testsong",
    sceneKey: "TestScene1",
    displayName: "Test Song",
    bpm: 110,
    background: {
      sky: "snow-mountain",
      ground: "bricks",
    },
    parts: {
      soprano: {
        key: "soprano",
        displayName: "Soprano",
        songMapKey: "lucia_soprano",
        playerSpriteKey: "lucia_soprano_player",
        playerSpritePath: "/assets/spritesheets/lucia/lucia_soprano_512.png",
      },
      alto: {
        key: "alto",
        displayName: "Alto",
        songMapKey: "lucia_alto",
        playerSpriteKey: "lucia_alto_player",
        playerSpritePath: "/assets/spritesheets/lucia/lucia_alto_512.png",
      },
    },
  },
};
