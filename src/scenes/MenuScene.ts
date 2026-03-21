import * as THREE from 'three';
import { BaseScene } from './BaseScene';

function makeTextSprite(
  text: string,
  opts: { fontSize?: number; color?: string; bgColor?: string; width?: number; height?: number } = {}
): THREE.Sprite {
  const { fontSize = 56, color = '#00ffff', bgColor = 'transparent', width = 512, height = 128 } = opts;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set((width / height) * 2, 2, 1);
  return sprite;
}

export class MenuScene extends BaseScene {
  private crystals: THREE.Mesh[] = [];
  private particles: THREE.Points[] = [];
  private startButton!: THREE.Mesh;
  private time = 0;

  public enter() {
    this.time = 0;
    this.scene.background = new THREE.Color(0x001122);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);

    this.camera.position.set(0, 0, 10);

    this.createTitle();
    this.createStartButton();
    this.createParticles();
    this.createControlsHint();
  }

  private createTitle() {
    // Main title sprite
    const title = makeTextSprite('CRYSTAL RUNNER 3D', {
      fontSize: 60,
      color: '#00ffff',
      width: 768,
      height: 128
    });
    title.position.set(0, 3.5, 0);
    title.scale.set(9, 1.5, 1);
    this.scene.add(title);

    // Decorative crystal cones below title
    const coneGeo = new THREE.ConeGeometry(0.25, 0.55, 6);
    const coneMat = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.85,
      emissive: 0x003333
    });
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(coneGeo, coneMat);
      c.position.set((i - 2) * 1.3, 2.2, 0);
      c.rotation.y = Math.PI / 6;
      this.crystals.push(c);
      this.scene.add(c);
    }
  }

  private createStartButton() {
    const geo = new THREE.BoxGeometry(5, 1.1, 0.3);
    const mat = new THREE.MeshPhongMaterial({ color: 0x007700, emissive: 0x002200 });
    this.startButton = new THREE.Mesh(geo, mat);
    this.startButton.position.set(0, -1.2, 0);
    this.scene.add(this.startButton);

    const label = makeTextSprite('TAP / PRESS ANY KEY TO START', {
      fontSize: 38,
      color: '#ffffff',
      width: 768,
      height: 96
    });
    label.position.set(0, -1.2, 0.25);
    label.scale.set(6, 0.9, 1);
    this.scene.add(label);
  }

  private createParticles() {
    for (let i = 0; i < 3; i++) {
      const count = 120;
      const positions = new Float32Array(count * 3);
      for (let j = 0; j < count; j++) {
        positions[j * 3]     = (Math.random() - 0.5) * 40;
        positions[j * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[j * 3 + 2] = (Math.random() - 0.5) * 20;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: ([0x00ffff, 0xff00ff, 0xffff00] as number[])[i],
        size: 0.1,
        transparent: true,
        opacity: 0.6
      });
      const pts = new THREE.Points(geo, mat);
      this.particles.push(pts);
      this.scene.add(pts);
    }
  }

  private createControlsHint() {
    const lines = [
      'ARROW KEYS / WASD to move',
      'Touch & drag on mobile',
      'Collect crystals — avoid obstacles'
    ];
    lines.forEach((text, idx) => {
      const sprite = makeTextSprite(text, {
        fontSize: 32,
        color: '#aaaaaa',
        width: 640,
        height: 72
      });
      sprite.position.set(0, -2.6 - idx * 0.85, 0);
      sprite.scale.set(7, 0.75, 1);
      this.scene.add(sprite);
    });
  }

  public update(deltaTime: number) {
    this.time += deltaTime;

    // Animate crystals
    this.crystals.forEach((c, i) => {
      c.rotation.y += deltaTime * 2;
      c.position.y = 2.2 + Math.sin(this.time * 3 + i) * 0.18;
    });

    // Pulse start button
    this.startButton.scale.setScalar(1 + Math.sin(this.time * 4) * 0.04);

    // Rotate particles
    this.particles.forEach((p, i) => {
      p.rotation.y += deltaTime * (0.5 + i * 0.2);
      p.rotation.x += deltaTime * (0.3 + i * 0.1);
    });

    // Check for input
    if (this.engine.inputManager.isPressed()) {
      this.engine.audioManager.playMenuSound();
      this.engine.resetScore();
      this.engine.setScene('game');
    }
  }

  public exit() {
    this.crystals = [];
    this.particles = [];
    this.scene.clear();
  }
}
