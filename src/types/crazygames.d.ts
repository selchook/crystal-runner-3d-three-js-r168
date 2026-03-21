interface CrazyGamesSDKGame {
  gameplayStart(): void;
  gameplayStop(): void;
  loadingStart(): void;
  loadingStop(): void;
  happytime(): void;
  settings?: { muteAudio?: boolean };
}

interface CrazyGamesSDKInstance {
  init(): Promise<void>;
  game: CrazyGamesSDKGame;
}

declare global {
  interface Window {
    CrazyGames?: { SDK: CrazyGamesSDKInstance };
  }
}

export {};
