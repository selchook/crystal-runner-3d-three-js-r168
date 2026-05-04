import * as THREE from 'three';
import { GameEngine } from './engine/GameEngine';

const container = document.getElementById('gameContainer')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const engine = new GameEngine(renderer);

(async () => {
  if (window.GHA) {
    // GHA manages the session lifecycle: splash → onStart → gameplay → endGame → Play Again
    window.GHA.onStart(() => {
      engine.resetScore();
      engine.setScene('game');
      window.GHA?.startGame();
    });

    window.GHA.onPause(() => {
      engine.stop();
    });

    window.GHA.onResume(() => {
      engine.resume();
    });

    // Start the engine on menu (renders as background behind GHA splash)
    engine.start('menu');
    // Signal the platform that the game page is loaded
    window.GHA.ready();
    return;
  }

  engine.start('menu');
})();