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

// ── CrazyGames-style HUD scoreboard ─────────────────────────────────────────
// Two separate sprites: score pill (left) + best badge (right)

const HUD_W = 256, HUD_H = 72;   // score pill canvas
const BDG_W = 180, BDG_H = 52;   // best badge canvas

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function makeHudSprites(): { score: THREE.Sprite; best: THREE.Sprite } {
  function pill(w: number, h: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const mat = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true, depthWrite: false, depthTest: false
    });
    const s = new THREE.Sprite(mat);
    s.renderOrder = 999;
    return s;
  }
  return { score: pill(HUD_W, HUD_H), best: pill(BDG_W, BDG_H) };
}

function updateHud(score: THREE.Sprite, best: THREE.Sprite, scoreVal: number, bestVal: number) {
  // ── score pill ─────────────────────────────────────────────────────────────
  {
    const mat = score.material as THREE.SpriteMaterial;
    const tex = mat.map as THREE.CanvasTexture;
    const cv  = tex.image as HTMLCanvasElement;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, HUD_W, HUD_H);

    // dark semi-transparent pill background
    ctx.fillStyle = 'rgba(10,10,26,0.72)';
    roundRect(ctx, 2, 2, HUD_W - 4, HUD_H - 4, 18);
    ctx.fill();

    // subtle border
    ctx.strokeStyle = 'rgba(0,200,255,0.25)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 2, 2, HUD_W - 4, HUD_H - 4, 18);
    ctx.stroke();

    // "SCORE" micro-label
    ctx.font = '500 16px Arial, sans-serif';
    ctx.fillStyle = 'rgba(0,200,255,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('SCORE', HUD_W / 2, 7);

    // large score number
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(scoreVal), HUD_W / 2, HUD_H - 6);

    tex.needsUpdate = true;
  }

  // ── best badge ─────────────────────────────────────────────────────────────
  {
    const mat = best.material as THREE.SpriteMaterial;
    const tex = mat.map as THREE.CanvasTexture;
    const cv  = tex.image as HTMLCanvasElement;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, BDG_W, BDG_H);

    ctx.fillStyle = 'rgba(10,10,26,0.60)';
    roundRect(ctx, 2, 2, BDG_W - 4, BDG_H - 4, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,210,0,0.22)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 2, 2, BDG_W - 4, BDG_H - 4, 14);
    ctx.stroke();

    // star + label
    ctx.font = '500 13px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,200,0,0.60)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('★  BEST', BDG_W / 2, 5);

    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,220,80,0.92)';
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(bestVal), BDG_W / 2, BDG_H - 5);

    tex.needsUpdate = true;
  }
}

export class GameScene extends BaseScene {
  private player!: Player;
  private crystals: Crystal[] = [];
  private obstacles: Obstacle[] = [];
  private tunnel!: THREE.Group;
  private speed = 5;
  private spawnTimer = 0;
  private hudScore!: THREE.Sprite;
  private hudBest!: THREE.Sprite;
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
    const { score, best } = makeHudSprites();
    this.hudScore = score;
    this.hudBest  = best;

    // Right-align both pills to the upper-right corner.
    // At z=-3, FOV=75°, 16:9 → half-width≈4.1, half-height≈2.3.
    // Right-edge target = 3.95; top-edge target = 2.18.
    // Center_x = right_edge - scale_x/2
    this.hudScore.scale.set(1.55, 0.44, 1);
    this.hudScore.position.set(3.95 - 1.55 / 2, 2.18 - 0.44 / 2, -3); // (3.175, 1.96)

    this.hudBest.scale.set(1.1, 0.32, 1);
    this.hudBest.position.set(3.95 - 1.1 / 2, 2.18 - 0.44 - 0.04 - 0.32 / 2, -3); // (3.40, 1.54)

    this.camera.add(this.hudScore);
    this.camera.add(this.hudBest);
    this.scene.add(this.camera); // camera must be in scene for children to render
    this.updateScoreDisplay();
  }

  private updateScoreDisplay() {
    updateHud(this.hudScore, this.hudBest, this.engine.score, this.engine.highScore);
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
    this.camera.remove(this.hudScore);
    this.camera.remove(this.hudBest);
    this.crystals.forEach(c => this.scene.remove(c.getMesh()));
    this.obstacles.forEach(o => this.scene.remove(o.getMesh()));
    this.crystals = [];
    this.obstacles = [];
    this.scene.clear();
  }
}
