import * as THREE from 'three';
import { GameEngine } from './engine/GameEngine';
import { onPlatform } from './ayvago/platform';

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

engine.start('menu');

// Inside Ayvago the platform pauses the game when its tab is hidden and can mute it.
onPlatform((platform) => {
  platform.onPause(() => engine.stop());
  platform.onResume(() => engine.resume());
  platform.onMute((muted) => (muted ? engine.audioManager.mute() : engine.audioManager.unmute()));
});