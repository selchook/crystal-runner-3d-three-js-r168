import * as THREE from 'three';
import { BaseScene } from './BaseScene';

export class GameOverScene extends BaseScene {
  private time = 0;
  private titleGroup!: THREE.Group;
  private particles: THREE.Points[] = [];

  public enter() {
    this.time = 0;
    this.scene.background = new THREE.Color(0x0a0005);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xff4444, 1.0);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);

    this.camera.position.set(0, 0, 10);

    this.createTitle();
    this.createScoreDisplay();
    this.createParticles();
    this.createRestartHint();
  }

  private createTitle() {
    this.titleGroup = new THREE.Group();

    // "GAME OVER" represented as broken shard shapes
    const shardGeo = new THREE.TetrahedronGeometry(0.4, 0);
    const shardMat = new THREE.MeshPhongMaterial({ color: 0xff2200, emissive: 0x440000, shininess: 80 });

    for (let i = 0; i < 8; i++) {
      const shard = new THREE.Mesh(shardGeo, shardMat);
      shard.position.x = (i - 3.5) * 1.1;
      shard.position.y = 2.5;
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.titleGroup.add(shard);
    }

    // Score label box row
    const boxGeo = new THREE.BoxGeometry(0.25, 0.25, 0.1);
    const boxMat = new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0x221100 });

    for (let i = 0; i < 10; i++) {
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.x = (i - 4.5) * 0.6;
      box.position.y = 1.2;
      this.titleGroup.add(box);
    }

    this.scene.add(this.titleGroup);
  }

  private createScoreDisplay() {
    const score = this.engine.score;
    const highScore = this.engine.highScore;

    // Score dots — one bright sphere per 10 points (capped at 20)
    const sphereGeo = new THREE.SphereGeometry(0.18, 8, 8);

    const scoreCapped = Math.min(Math.floor(score / 10), 20);
    const scoreMat = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x004444 });
    for (let i = 0; i < scoreCapped; i++) {
      const s = new THREE.Mesh(sphereGeo, scoreMat);
      s.position.x = (i % 10 - 4.5) * 0.55;
      s.position.y = 0.1 - Math.floor(i / 10) * 0.55;
      this.scene.add(s);
    }

    // High score marker (gold)
    const highCapped = Math.min(Math.floor(highScore / 10), 20);
    const hiMat = new THREE.MeshPhongMaterial({ color: 0xffdd00, emissive: 0x332200 });
    for (let i = 0; i < highCapped; i++) {
      const s = new THREE.Mesh(sphereGeo, hiMat);
      s.position.x = (i % 10 - 4.5) * 0.55;
      s.position.y = -1.1 - Math.floor(i / 10) * 0.55;
      this.scene.add(s);
    }
  }

  private createParticles() {
    const count = 80;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xff3300, size: 0.12, transparent: true, opacity: 0.5 });
    const pts = new THREE.Points(geo, mat);
    this.particles.push(pts);
    this.scene.add(pts);
  }

  private createRestartHint() {
    const hintGeo = new THREE.BoxGeometry(0.07, 0.07, 0.02);
    const hintMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    const group = new THREE.Group();

    const hint = 'TAP TO RESTART';
    for (let i = 0; i < hint.length; i++) {
      if (hint[i] === ' ') continue;
      const box = new THREE.Mesh(hintGeo, hintMat);
      box.position.x = (i - hint.length / 2) * 0.12;
      box.position.y = -2.8;
      group.add(box);
    }
    this.scene.add(group);
  }

  public update(deltaTime: number) {
    this.time += deltaTime;

    // Animate title shards
    this.titleGroup.children.forEach((child, i) => {
      if (i < 8) {
        child.rotation.y += deltaTime * (1 + i * 0.2);
        child.position.y = 2.5 + Math.sin(this.time * 2 + i) * 0.15;
      }
    });

    // Animate particles
    this.particles.forEach(p => { p.rotation.y += deltaTime * 0.3; });

    // Check for input to restart
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
