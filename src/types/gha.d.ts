interface GHASDK {
  _sdk?: boolean;
  ready(): void;
  onStart(cb: (config?: unknown) => void): void;
  startGame(): void;
  endGame(opts?: { score?: number; won?: boolean; message?: string }): void;
  submitScore(score: number): void;
}

declare global {
  interface Window {
    GHA?: GHASDK;
  }
}

export {};
