import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { Player } from '../entities/Player';
import { Crystal } from '../entities/Crystal';
import { Obstacle } from '../entities/Obstacle';

const CrazySDK = {
  gameplayStart() { try { if(window.CrazyGames) window.CrazyGames.SDK.game.gameplayStart(); } catch{} },
  gameplayStop()  { try { if(window.CrazyGames) window.CrazyGames.SDK.game.gameplayStop();  } catch{} }
};

export class GameScene extends BaseScene {
  private player!: Player;
  private crystals: Crystal[] = [];
  private obstacles: Obstacle[] = [];
  private tunnel!: THREE.Group;
  private speed = 5;
  private spawnTimer = 0;
  private scoreDisplay!: THREE.Group;
  private gameTime = 0;
  private lastObstacleZ = 0;
  private lastCrystalZ = 0;

  public enter() {
    CrazySDK.gameplayStart();

    this.scene.background = new THREE.Color(0x000011);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x8888ff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Position camera
    this.camera.position.set(0, 1, 3);
    this.camera.lookAt(0, 0, 0);

    // Create tunnel
    this.createTunnel();

    // Create player
    this.player = new Player();
    this.scene.add(this.player.getMesh());

    // Add camera to player for audio
    this.player.getMesh().add(this.engine.audioManager.getListener());

    // Create score display
    this.createScoreDisplay();

    // Reset state
    this.speed = 5;
    this.spawnTimer = 0;
    this.gameTime = 0;
    this.crystals = [];
    this.obstacles = [];
    this.lastCrystalZ = -20;
    this.lastObstacleZ = -30;
  }

  private createTunnel() {
    this.tunnel = new THREE.Group();

    // Create tunnel segments
    for (let i = 0; i < 20; i++) {
      const segmentGroup = new THREE.Group();

      // Create tunnel ring
      const ringGeometry = new THREE.RingGeometry(4, 5, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x002244,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.z = -i * 5;
      segmentGroup.add(ring);

      // Add some detail lines
      for (let j = 0; j < 8; j++) {
        const lineGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x0044aa });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);

        const angle = (j / 8) * Math.PI * 2;
        line.position.x = Math.cos(angle) * 4.5;
        line.position.y = Math.sin(angle) * 4.5;
        line.position.z = -i * 5;

        segmentGroup.add(line);
      }

      this.tunnel.add(segmentGroup);
    }

    this.scene.add(this.tunnel);
  }

  private createScoreDisplay() {
    this.scoreDisplay = new THREE.Group();
    this.updateScoreDisplay();
    this.scene.add(this.scoreDisplay);
  }

  private updateScoreDisplay() {
    // Clear existing score display
    while (this.scoreDisplay.children.length > 0) {
      this.scoreDisplay.remove(this.scoreDisplay.children[0]);
    }

    const score = this.engine.score;
    const digits = score.toString().padStart(5, '0');
    const dotGeo = new THREE.BoxGeometry(0.12, 0.18, 0.05);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    for (let i = 0; i < digits.length; i++) {
      const val = parseInt(digits[i]);
      // Draw a column of dots proportional to digit value
      for (let d = 0; d <= val; d++) {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.x = (i - digits.length / 2) * 0.2 - 2;
        dot.position.y = 2.5 + d * 0.22;
        dot.position.z = -0.5;
        this.scoreDisplay.add(dot);
      }
    }
  }

  public update(deltaTime: number) {
    this.gameTime += deltaTime;
    this.spawnTimer += deltaTime;

    // Gradually increase speed
    this.speed = 5 + this.gameTime * 0.3;

    // Scroll tunnel forward and wrap segments
    this.tunnel.children.forEach((segment: THREE.Object3D) => {
      segment.position.z += this.speed * deltaTime;
      if (segment.position.z > 10) {
        segment.position.z -= 20 * 5; // wrap back (20 segments * 5 units each)
      }
    });

    // Update player
    this.player.update(deltaTime, this.engine.inputManager);

    // Spawn entities
    const spawnInterval = Math.max(0.4, 1.2 - this.gameTime * 0.02);
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEntities();
    }

    // Update crystals
    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const crystal = this.crystals[i];
      crystal.update(deltaTime, this.speed);

      if (crystal.isOutOfBounds()) {
        this.scene.remove(crystal.getMesh());
        this.crystals.splice(i, 1);
        continue;
      }

      // Collision check
      if (this.player.getBoundingBox().intersectsBox(crystal.getBoundingBox())) {
        this.engine.audioManager.playCollectSound();
        this.engine.updateScore(this.engine.score + 10);
        this.updateScoreDisplay();
        this.scene.remove(crystal.getMesh());
        this.crystals.splice(i, 1);
        // Celebrate every 100 points
        if (this.engine.score % 100 === 0 && this.engine.score > 0) {
          try { if (window.CrazyGames) window.CrazyGames.SDK.game.happytime(); } catch {}
        }
      }
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.update(deltaTime, this.speed);

      if (obstacle.isOutOfBounds()) {
        this.scene.remove(obstacle.getMesh());
        this.obstacles.splice(i, 1);
        continue;
      }

      // Collision check
      if (this.player.getBoundingBox().intersectsBox(obstacle.getBoundingBox())) {
        this.engine.audioManager.playHitSound();
        CrazySDK.gameplayStop();
        this.engine.setScene('gameOver');
        return;
      }
    }
  }

  private spawnEntities() {
    const rand = Math.random();

    if (rand < 0.6) {
      // Spawn a crystal
      const x = (Math.random() - 0.5) * 5;
      const y = (Math.random() - 0.5) * 5;
      const crystal = new Crystal(x, y, -60);
      this.crystals.push(crystal);
      this.scene.add(crystal.getMesh());
    } else {
      // Spawn an obstacle
      const x = (Math.random() - 0.5) * 5;
      const y = (Math.random() - 0.5) * 5;
      const obstacle = new Obstacle(x, y, -60);
      this.obstacles.push(obstacle);
      this.scene.add(obstacle.getMesh());
    }
  }

  public exit() {
    // Remove all entities from scene
    this.crystals.forEach(c => this.scene.remove(c.getMesh()));
    this.obstacles.forEach(o => this.scene.remove(o.getMesh()));
    this.crystals = [];
    this.obstacles = [];
    this.scene.clear();
  }
}
