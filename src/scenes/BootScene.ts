import * as THREE from 'three';
import { BaseScene } from './BaseScene';

export class BootScene extends BaseScene {
  private loadingProgress = 0;
  private loadingCube!: THREE.Mesh;
  private titleText!: THREE.Group;

  public enter() {
    this.scene.background = new THREE.Color(0x000520);
    
    // Add loading cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88,
      wireframe: true 
    });
    this.loadingCube = new THREE.Mesh(geometry, material);
    this.scene.add(this.loadingCube);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Position camera
    this.camera.position.set(0, 0, 5);

    // Create title text using 3D geometry
    this.createTitleText();

    // Start loading
    this.initGame();
  }

  private createTitleText() {
    this.titleText = new THREE.Group();
    
    const letterGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.1);
    const letterMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    // Create "LOADING..." letters as simple boxes
    const letters = 'LOADING...';
    for (let i = 0; i < letters.length; i++) {
      const letter = new THREE.Mesh(letterGeometry, letterMaterial);
      letter.position.x = (i - letters.length / 2) * 0.5;
      letter.position.y = 1.5;
      this.titleText.add(letter);
    }

    this.scene.add(this.titleText);
  }

  private async initGame() {
    // Simulate loading with progress
    const loadSteps = [
      () => this.loadAudio(),
      () => this.loadGeometry(),
      () => this.loadMaterials()
    ];

    for (let i = 0; i < loadSteps.length; i++) {
      await loadSteps[i]();
      this.loadingProgress = (i + 1) / loadSteps.length;
      await this.delay(300);
    }

    await this.delay(500);
    this.engine.setScene('menu');
  }

  private async loadAudio() {
    // Initialize audio manager
  }

  private async loadGeometry() {
    // Pre-create common geometries
  }

  private async loadMaterials() {
    // Pre-create common materials
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public update(deltaTime: number) {
    // Rotate loading cube
    this.loadingCube.rotation.x += deltaTime * 2;
    this.loadingCube.rotation.y += deltaTime * 1.5;

    // Scale cube based on loading progress
    const scale = 1 + this.loadingProgress * 0.5;
    this.loadingCube.scale.setScalar(scale);

    // Animate title letters
    this.titleText.children.forEach((letter, index) => {
      letter.position.y = 1.5 + Math.sin(Date.now() * 0.005 + index * 0.5) * 0.1;
    });
  }

  public exit() {
    // Clean up
    this.scene.clear();
  }
}