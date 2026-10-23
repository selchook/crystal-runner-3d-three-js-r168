import * as THREE from 'three';
import { BaseScene } from './BaseScene';

/** Canvas-text sprite that always renders on top of 3-D geometry */
function makeTextSprite(
  text: string,
  opts: { fontSize?: number; color?: string; width?: number; height?: number } = {}
): THREE.Sprite {
  const { fontSize = 56, color = '#ffffff', width = 512, height = 128 } = opts;
  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,   // never hidden behind 3-D objects
    depthWrite: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 10;  // draw after all 3-D meshes
  return sprite;
}

export class GameOverScene extends BaseScene {
  private time = 0;
  private particles: THREE.Points[] = [];

  public enter() {
    this.time = 0;
    this.scene.background = new THREE.Color(0x080010);

    this.scene.add(new THREE.AmbientLight(0x404040, 0.5));
    const dir = new THREE.DirectionalLight(0xff4444, 1.0);
    dir.position.set(5, 5, 5);
    this.scene.add(dir);

    this.camera.position.set(0, 0, 10);

    this.createParticles(); // background — z spread, low opacity
    this.createPanel();     // all text sprites at z = 0 with depthTest off
  }

  private createParticles() {
    const count = 100;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = -5 - Math.random() * 15; // all behind the panel
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xff2200, size: 0.1, transparent: true, opacity: 0.4 });
    const pts = new THREE.Points(geo, mat);
    this.particles.push(pts);
    this.scene.add(pts);
  }

  /** All text sprites — depthTest:false ensures they sit on top */
  private createPanel() {
    const score  = this.engine.score;
    const best   = this.engine.highScore;
    const isNew  = score > 0 && score >= best;

    // ── GAME OVER title ──────────────────────────────────────────────────────
    const title = makeTextSprite('GAME OVER', { fontSize: 82, color: '#ff3300', width: 640, height: 140 });
    title.position.set(0, 3.1, 0);
    title.scale.set(8.5, 1.85, 1);
    this.scene.add(title);

    // ── "YOUR SCORE" label ───────────────────────────────────────────────────
    const label = makeTextSprite('YOUR SCORE', { fontSize: 34, color: '#777799', width: 360, height: 66 });
    label.position.set(0, 1.5, 0);
    label.scale.set(3.8, 0.65, 1);
    this.scene.add(label);

    // ── Score number ─────────────────────────────────────────────────────────
    const scoreSprite = makeTextSprite(String(score), { fontSize: 96, color: '#00ffff', width: 320, height: 128 });
    scoreSprite.position.set(0, 0.55, 0);
    scoreSprite.scale.set(3.8, 1.5, 1);
    this.scene.add(scoreSprite);

    // ── Thin divider ─────────────────────────────────────────────────────────
    const lineGeo = new THREE.BoxGeometry(4.8, 0.025, 0.01);
    const lineMesh = new THREE.Mesh(lineGeo, new THREE.MeshBasicMaterial({ color: 0x2a2a55 }));
    lineMesh.position.set(0, -0.35, 0);
    lineMesh.renderOrder = 9; // just below sprites, above particles
    this.scene.add(lineMesh);

    // ── Best score ───────────────────────────────────────────────────────────
    const bestText  = isNew ? '★  NEW BEST!' : `BEST  ${best}`;
    const bestColor = isNew ? '#ffdd00'       : '#888888';
    const bestSprite = makeTextSprite(bestText, { fontSize: 40, color: bestColor, width: 480, height: 80 });
    bestSprite.position.set(0, -0.85, 0);
    bestSprite.scale.set(5.0, 0.85, 1);
    this.scene.add(bestSprite);

    // ── Restart hint ─────────────────────────────────────────────────────────
    const hint = makeTextSprite('TAP / PRESS ANY KEY TO PLAY AGAIN', { fontSize: 32, color: '#555577', width: 680, height: 66 });
    hint.position.set(0, -2.3, 0);
    hint.scale.set(7.5, 0.72, 1);
    this.scene.add(hint);
  }

  public update(deltaTime: number) {
    this.time += deltaTime;

    this.particles.forEach(p => { p.rotation.y += deltaTime * 0.2; });

    if (this.time > 0.5 && this.engine.inputManager.isPressed()) {
      this.engine.audioManager.playMenuSound();
      this.engine.resetScore();
      this.engine.setScene('game');
    }
  }

  public exit() {
    this.particles = [];
    this.scene.clear();
  }
}
