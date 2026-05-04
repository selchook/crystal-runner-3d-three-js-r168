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
    window.GHA.onStart(() => {
      engine.resetScore();
      engine.setScene('game');
      window.GHA?.startGame();
    });

    // Keep engine render loop alive, but let GHA decide when gameplay starts.
    engine.start('menu');
    window.GHA.ready();
    return;
  }

  engine.start('menu');
})();