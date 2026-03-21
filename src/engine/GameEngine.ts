import * as THREE from 'three';
import { InputManager } from './InputManager';
import { AudioManager } from './AudioManager';
import { BaseScene } from '../scenes/BaseScene';
import { MenuScene } from '../scenes/MenuScene';
import { GameScene } from '../scenes/GameScene';
import { GameOverScene } from '../scenes/GameOverScene';

export type SceneType = 'menu' | 'game' | 'gameOver';

export class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private clock = new THREE.Clock();
  private scenes = new Map<SceneType, BaseScene>();
  private currentScene: BaseScene | null = null;
  private isRunning = false;
  
  public inputManager: InputManager;
  public audioManager: AudioManager;
  public score = 0;
  public highScore = 0;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.inputManager = new InputManager();
    this.audioManager = new AudioManager();
    
    // Load high score from localStorage
    this.highScore = parseInt(localStorage.getItem('crystalRunner3D_highScore') || '0');
    
    this.initializeScenes();
  }

  private initializeScenes() {
    this.scenes.set('menu', new MenuScene(this));
    this.scenes.set('game', new GameScene(this));
    this.scenes.set('gameOver', new GameOverScene(this));
  }

  public setScene(sceneType: SceneType) {
    if (this.currentScene) {
      this.currentScene.exit();
    }
    
    this.currentScene = this.scenes.get(sceneType) || null;
    
    if (this.currentScene) {
      this.currentScene.enter();
    }
  }

  public start(initialScene: SceneType) {
    this.setScene(initialScene);
    this.isRunning = true;
    this.animate();
  }

  public stop() {
    this.isRunning = false;
  }

  private animate = () => {
    if (!this.isRunning) return;
    
    const deltaTime = this.clock.getDelta();
    
    this.inputManager.update();
    
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
      this.currentScene.render(this.renderer);
    }
    
    requestAnimationFrame(this.animate);
  };

  public updateScore(newScore: number) {
    this.score = newScore;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('crystalRunner3D_highScore', this.highScore.toString());
    }
  }

  public resetScore() {
    this.score = 0;
  }
}