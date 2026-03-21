import * as THREE from 'three';
import { BaseScene } from './BaseScene';

function makeTextSprite(
  text: string,
  opts: { fontSize?: number; color?: string; width?: number; height?: number } = {}
): THREE.Sprite {
  const { fontSize = 56, color = '#ffffff', width = 512, height = 128 } = opts;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set((width / height) * (height / 64), height / 64, 1);
  return sprite;
}

export class GameOverScene extends BaseScene {
  private time = 0;
  private shards: THREE.Mesh[] = [];
  private particles: THREE.Points[] = [];

  public enter() {
    this.time = 0;
    this.scene.background = new THREE.Color(0x080010);

    this.scene.add(new THREE.AmbientLight(0x404040, 0.5));
    const dir = new THREE.DirectionalLight(0xff4444, 1.0);
    dir.position.set(5, 5, 5);
    this.scene.add(dir);

    this.camera.position.set(0, 0, 10);

    this.createTitle();
    this.createScorePanel();
    this.createParticles();
    this.createRestartHint();
  }

  private createTitle() {
    // "GAME OVER" text sprite
    const title = makeTextSprite('GAME OVER', {
      fontSize: 80,
      color: '#ff3300',
      width: 640,
      height: 140
    });
    title.position.set(0, 3.2, 0);
    title.scale.set(8, 1.75, 1);
    this.scene.add(title);

    // Decorative broken shards
    const shardGeo = new THREE.TetrahedronGeometry(0.35, 0);
    const shardMat = new THREE.MeshPhongMaterial({ color: 0xff2200, emissive: 0x440000, shininess: 80 });
    for (let i = 0; i < 6; i++) {
      const shard = new THREE.Mesh(shardGeo, shardMat);
      shard.position.set((i - 2.5) * 1.5, 1.7, 0);
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      this.shards.push(shard);
      this.scene.add(shard);
    }
  }

  private createScorePanel() {
    const score = this.engine.score;
    const best  = this.engine.highScore;
    const isNew = score > 0 && score >= best;

    // Score value
    const scoreSprite = makeTextSprite(String(score), {
      fontSize: 90,
      color: '#00ffff',
      width: 300,
      height: 120
    });
    scoreSprite.position.set(0, 0.5, 0);
    scoreSprite.scale.set(3.5, 1.4, 1);
    this.scene.add(scoreSprite);

    // "YOUR SCORE" label
    const label = makeTextSprite('YOUR SCORE', {
      fontSize: 36,
      color: '#888888',
      width: 360,
      height: 72
    });
    label.position.set(0, 1.35, 0);
    label.scale.set(3.5, 0.7, 1);
    this.scene.add(label);

    // Divider line
    const lineGeo = new THREE.BoxGeometry(4.5, 0.03, 0.01);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x333355 });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(0, -0.45, 0);
    this.scene.add(line);

    // Best score row
    const bestColor = isNew ? '#ffdd00' : '#aaaaaa';
    const bestLabel = isNew ? '★  NEW BEST!' : `BEST  ${best}`;
    const bestSprite = makeTextSprite(bestLabel, {
      fontSize: 40,
      color: bestColor,
      width: 440,
      height: 80
    });
    bestSprite.position.set(0, -0.9, 0);
    bestSprite.scale.set(4.5, 0.8, 1);
    this.scene.add(bestSprite);
  }

  private createParticles() {
    const count = 100;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xff2200, size: 0.1, transparent: true, opacity: 0.45 });
    const pts = new THREE.Points(geo, mat);
    this.particles.push(pts);
    this.scene.add(pts);
  }

  private createRestartHint() {
    const hint = makeTextSprite('TAP / PRESS ANY KEY TO RESTART', {
      fontSize: 34,
      color: '#666688',
      width: 640,
      height: 72
    });
    hint.position.set(0, -2.4, 0);
    hint.scale.set(7, 0.72, 1);
    this.scene.add(hint);
  }

  public update(deltaTime: number) {
    this.time += deltaTime;

    // Spin shards slowly
    this.shards.forEach((s, i) => {
      s.rotation.y += deltaTime * (0.8 + i * 0.15);
      s.position.y = 1.7 + Math.sin(this.time * 1.5 + i) * 0.12;
    });

    this.particles.forEach(p => { p.rotation.y += deltaTime * 0.25; });

    if (this.time > 0.5 && this.engine.inputManager.isPressed()) {
      this.engine.audioManager.playMenuSound();
      this.engine.resetScore();
      this.engine.setScene('game');
    }
  }

  public exit() {
    this.shards = [];
    this.particles = [];
    this.scene.clear();
  }
}
