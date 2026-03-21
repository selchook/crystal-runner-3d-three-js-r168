import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { Player } from '../entities/Player';
import { Crystal } from '../entities/Crystal';
import { Obstacle } from '../entities/Obstacle';

const CrazySDK = {
  gameplayStart() { try { if(window.CrazyGames) window.CrazyGames.SDK.game.gameplayStart(); } catch{} },
  gameplayStop()  { try { if(window.CrazyGames) window.CrazyGames.SDK.game.gameplayStop();  } catch{} }
};

const TUNNEL_SEGMENTS = 20;
const SEGMENT_LENGTH  = 5;
const TUNNEL_TOTAL    = TUNNEL_SEGMENTS * SEGMENT_LENGTH; // 100

function makeScoreSprite(): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width  = 384;
  canvas.height = 96;
  const mat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true,
    depthWrite: false,
    depthTest: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 999;
  return sprite;
}

function updateScoreSprite(sprite: THREE.Sprite, score: number, highScore: number) {
  const mat = sprite.material as THREE.SpriteMaterial;
  const tex = mat.map as THREE.CanvasTexture;
  const canvas = tex.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 40px Arial, sans-serif';
  ctx.textBaseline = 'top';

  ctx.fillStyle = '#00ffff';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 12, 4);

  ctx.fillStyle = '#ffdd00';
  ctx.textAlign = 'right';
  ctx.fillText(`BEST  ${highScore}`, canvas.width - 12, 4);

  tex.needsUpdate = true;
}

export class GameScene extends BaseScene {
  private player!: Player;
  private crystals: Crystal[] = [];
  private obstacles: Obstacle[] = [];
  private tunnel!: THREE.Group;
  private speed = 5;
  private spawnTimer = 0;
  private scoreSprite!: THREE.Sprite;
  private gameTime = 0;

  public enter() {
    CrazySDK.gameplayStart();

    this.scene.background = new THREE.Color(0x000011);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x8888ff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    this.camera.position.set(0, 1, 3);
    this.camera.lookAt(0, 0, 0);

    this.createTunnel();

    this.player = new Player();
    this.scene.add(this.player.getMesh());
    this.player.getMesh().add(this.engine.audioManager.getListener());

    this.createScoreDisplay();

    // Reset state
    this.speed = 5;
    this.spawnTimer = 0;
    this.gameTime = 0;
    this.crystals = [];
    this.obstacles = [];
  }

  private createTunnel() {
    this.tunnel = new THREE.Group();

    for (let i = 0; i < TUNNEL_SEGMENTS; i++) {
      const seg = new THREE.Group();
      // Position the GROUP itself — children sit at local z=0
      seg.position.z = -i * SEGMENT_LENGTH;

      // Ring
      const ringGeo = new THREE.RingGeometry(4, 5, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x002244,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      seg.add(new THREE.Mesh(ringGeo, ringMat));

      // Detail pillars around the ring
      const pillarGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
      const pillarMat = new THREE.MeshBasicMaterial({ color: 0x0044aa });
      for (let j = 0; j < 8; j++) {
        const angle = (j / 8) * Math.PI * 2;
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(Math.cos(angle) * 4.5, Math.sin(angle) * 4.5, 0);
        seg.add(pillar);
      }

      this.tunnel.add(seg);
    }

    this.scene.add(this.tunnel);
  }

  private createScoreDisplay() {
    this.scoreSprite = makeScoreSprite();
    // Attach to camera so it always stays in view
    this.scoreSprite.position.set(0, 1.55, -3);
    this.scoreSprite.scale.set(5.5, 1.1, 1);
    this.camera.add(this.scoreSprite);
    this.scene.add(this.camera); // camera must be in scene for children to render
    this.updateScoreDisplay();
  }

  private updateScoreDisplay() {
    updateScoreSprite(this.scoreSprite, this.engine.score, this.engine.highScore);
  }

  public update(deltaTime: number) {
    this.gameTime += deltaTime;
    this.spawnTimer += deltaTime;

    // Gradually increase speed
    this.speed = 5 + this.gameTime * 0.3;

    // Scroll tunnel — wrap segments that pass the camera
    this.tunnel.children.forEach((seg: THREE.Object3D) => {
      seg.position.z += this.speed * deltaTime;
      if (seg.position.z > SEGMENT_LENGTH) {
        seg.position.z -= TUNNEL_TOTAL;
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

      if (this.player.getBoundingBox().intersectsBox(crystal.getBoundingBox())) {
        this.engine.audioManager.playCollectSound();
        this.engine.updateScore(this.engine.score + 10);
        this.updateScoreDisplay();
        this.scene.remove(crystal.getMesh());
        this.crystals.splice(i, 1);
        if (this.engine.score % 100 === 0) {
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

      if (this.player.getBoundingBox().intersectsBox(obstacle.getBoundingBox())) {
        this.engine.audioManager.playHitSound();
        CrazySDK.gameplayStop();
        this.engine.setScene('gameOver');
        return;
      }
    }
  }

  private spawnEntities() {
    const x = (Math.random() - 0.5) * 5;
    const y = (Math.random() - 0.5) * 5;

    if (Math.random() < 0.6) {
      const crystal = new Crystal(x, y, -60);
      this.crystals.push(crystal);
      this.scene.add(crystal.getMesh());
    } else {
      const obstacle = new Obstacle(x, y, -60);
      this.obstacles.push(obstacle);
      this.scene.add(obstacle.getMesh());
    }
  }

  public exit() {
    this.camera.remove(this.scoreSprite);
    this.crystals.forEach(c => this.scene.remove(c.getMesh()));
    this.obstacles.forEach(o => this.scene.remove(o.getMesh()));
    this.crystals = [];
    this.obstacles = [];
    this.scene.clear();
  }
}
