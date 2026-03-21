import * as THREE from 'three';
import { BaseScene } from './BaseScene';

export class MenuScene extends BaseScene {
  private titleGroup!: THREE.Group;
  private startButton!: THREE.Mesh;
  private particles: THREE.Points[] = [];
  private time = 0;

  public enter() {
    this.scene.background = new THREE.Color(0x001122);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);

    // Position camera
    this.camera.position.set(0, 0, 10);

    // Create title
    this.createTitle();
    
    // Create start button
    this.createStartButton();
    
    // Create background particles
    this.createParticles();
    
    // Add controls hint
    this.createControlsHint();
  }

  private createTitle() {
    this.titleGroup = new THREE.Group();
    
    // Create "CRYSTAL RUNNER 3D" using geometric shapes
    const crystalGeometry = new THREE.ConeGeometry(0.3, 0.6, 6);
    const runnerGeometry = new THREE.BoxGeometry(0.4, 0.5, 0.2);
    
    const crystalMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      emissive: 0x003333
    });
    
    const runnerMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff4444,
      emissive: 0x330000
    });

    // Crystal symbols
    for (let i = 0; i < 5; i++) {
      const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
      crystal.position.x = (i - 2) * 1.2;
      crystal.position.y = 2;
      crystal.rotation.y = Math.PI / 6;
      this.titleGroup.add(crystal);
    }

    // Runner text as blocks
    for (let i = 0; i < 6; i++) {
      const block = new THREE.Mesh(runnerGeometry, runnerMaterial);
      block.position.x = (i - 2.5) * 0.8;
      block.position.y = 0.5;
      this.titleGroup.add(block);
    }

    this.scene.add(this.titleGroup);
  }

  private createStartButton() {
    const geometry = new THREE.BoxGeometry(3, 1, 0.3);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x00aa00,
      emissive: 0x002200
    });
    
    this.startButton = new THREE.Mesh(geometry, material);
    this.startButton.position.y = -1.5;
    this.scene.add(this.startButton);

    // Add "TAP TO START" text using small cubes
    const textGroup = new THREE.Group();
    const letterGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.05);
    const letterMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const text = "TAP TO START";
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') continue;
      const letter = new THREE.Mesh(letterGeometry, letterMaterial);
      letter.position.x = (i - text.length / 2) * 0.15;
      textGroup.add(letter);
    }
    
    textGroup.position.copy(this.startButton.position);
    textGroup.position.z = 0.2;
    this.scene.add(textGroup);
  }

  private createParticles() {
    for (let i = 0; i < 3; i++) {
      const particleCount = 100;
      const positions = new Float32Array(particleCount * 3);
      
      for (let j = 0; j < particleCount; j++) {
        positions[j * 3] = (Math.random() - 0.5) * 40;
        positions[j * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[j * 3 + 2] = (Math.random() - 0.5) * 20;
      }
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.PointsMaterial({
        color: [0x00ffff, 0xff00ff, 0xffff00][i],
        size: 0.1,
        transparent: true,
        opacity: 0.6
      });
      
      const particles = new THREE.Points(geometry, material);
      this.particles.push(particles);
      this.scene.add(particles);
    }
  }

  private createControlsHint() {
    const hintGroup = new THREE.Group();
    
    // Create simple hint geometry
    const hintGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.02);
    const hintMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    
    const hints = [
      "ARROW KEYS OR WASD TO MOVE",
      "TOUCH AND DRAG ON MOBILE",
      "COLLECT CRYSTALS AVOID OBSTACLES"
    ];
    
    hints.forEach((hint, hintIndex) => {
      for (let i = 0; i < hint.length; i++) {
        if (hint[i] === ' ') continue;
        const letter = new THREE.Mesh(hintGeometry, hintMaterial);
        letter.position.x = (i - hint.length / 2) * 0.08;
        letter.position.y = -3 - hintIndex * 0.4;
        hintGroup.add(letter);
      }
    });
    
    this.scene.add(hintGroup);
  }

  public update(deltaTime: number) {
    this.time += deltaTime;
    
    // Animate title crystals
    this.titleGroup.children.forEach((child, index) => {
      if (index < 5) { // Crystals
        child.rotation.y += deltaTime * 2;
        child.position.y = 2 + Math.sin(this.time * 3 + index) * 0.2;
      }
    });
    
    // Animate start button
    this.startButton.scale.setScalar(1 + Math.sin(this.time * 4) * 0.05);
    
    // Animate particles
    this.particles.forEach((particles, index) => {
      particles.rotation.y += deltaTime * (0.5 + index * 0.2);
      particles.rotation.x += deltaTime * (0.3 + index * 0.1);
    });
    
    // Check for input
    if (this.engine.inputManager.isPressed()) {
      this.engine.audioManager.playMenuSound();
      this.engine.resetScore();
      this.engine.setScene('game');
    }
  }

  public exit() {
    this.scene.clear();
  }
}