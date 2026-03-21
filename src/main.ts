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
  if (window.CrazyGames) await window.CrazyGames.SDK.init();
  engine.start('menu');
})();