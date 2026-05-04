interface GHAConfig {
  mode: string;
  isHost: boolean;
  playerIndex: number;
  playerCount: number;
}

interface GHASDK {
  _sdk?: boolean;
  _version?: string;
  ready(): void;
  onStart(cb: (config?: GHAConfig) => void): void;
  startGame(): void;
  endGame(opts?: { score?: number; won?: boolean; message?: string }): void;
  submitScore(score: number): void;
  sendMove(data: unknown): void;
  onMove(cb: (data: unknown) => void): void;
  onPause(cb: () => void): void;
  onResume(cb: () => void): void;
  openLeaderboard(): void;
  isEmbedded(): boolean;
  getConfig(): GHAConfig;
}

declare global {
  interface Window {
    GHA?: GHASDK;
  }
}

export {};
