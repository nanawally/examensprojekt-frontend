export interface PartConfig {
  key: string;
  displayName: string;
  songMapKey: string;
  playerSpriteKey: string;
  playerSpritePath: string;
  controlledTrackKey: string;
}

export interface SongConfig {
  key: string;
  sceneKey: string;
  displayName: string;
  bpm: number;
  background: {
    sky: string;
    ground: string;
  };
  parts: Record<string, PartConfig>;
}
