import * as THREE from 'three';
import { GameEngine } from '../engine/GameEngine';

export abstract class BaseScene {
  protected scene: THREE.Scene;
  protected camera: THREE.PerspectiveCamera;
  protected engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Handle window resize
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };

  public abstract enter(): void;
  public abstract exit(): void;
  public abstract update(deltaTime: number): void;
  
  public render(renderer: THREE.WebGLRenderer) {
    renderer.render(this.scene, this.camera);
  }
}