import * as THREE from 'three';
import { InputManager } from '../engine/InputManager';

const MOVE_SPEED = 6;
const BOUNDS = 3;

// ── material palette ─────────────────────────────────────────────────────────
const fuselageMat  = new THREE.MeshPhongMaterial({ color: 0x7d8fa0, specular: 0x334455, shininess: 70 });
const darkMat      = new THREE.MeshPhongMaterial({ color: 0x4a5a68, specular: 0x223344, shininess: 40 });
const wingMat      = new THREE.MeshPhongMaterial({ color: 0x6a7c8c, specular: 0x223344, shininess: 50, side: THREE.DoubleSide });
const canopyMat    = new THREE.MeshPhongMaterial({ color: 0x1c3c58, transparent: true, opacity: 0.8,  specular: 0x99aaff, shininess: 150 });
const nozzleMat    = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, specular: 0x556677, shininess: 90 });
const exhaustMat   = new THREE.MeshPhongMaterial({ color: 0xff7700, emissive: 0x551100, transparent: true, opacity: 0.55 });
const navRedMat    = new THREE.MeshBasicMaterial({ color: 0xff2200 });
const navGreenMat  = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
const intakeMat    = new THREE.MeshPhongMaterial({ color: 0x18242e, side: THREE.FrontSide });

// ── helper: flat quad from 4 corners (two triangles) ─────────────────────────
function quad(
  x0: number, y0: number, z0: number,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  x3: number, y3: number, z3: number
): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    x0, y0, z0,  x1, y1, z1,  x2, y2, z2,
    x0, y0, z0,  x2, y2, z2,  x3, y3, z3
  ]), 3));
  g.computeVertexNormals();
  return g;
}

function add(parent: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  parent.add(m);
  return m;
}

export class Player {
  private mesh: THREE.Group;
  private boundingBox = new THREE.Box3();
  private exhaustLight!: THREE.PointLight;
  private exhaustFlame!: THREE.Mesh;

  constructor() {
    this.mesh = new THREE.Group();

    // inner group scaled to fit the game
    const f16 = new THREE.Group();
    f16.scale.setScalar(0.78);
    this.mesh.add(f16);

    this.buildF16(f16);
  }

  private buildF16(g: THREE.Group) {

    // ── fuselage body (octagonal cylinder) ──────────────────────────────────
    const bodyGeo = new THREE.CylinderGeometry(0.115, 0.095, 1.55, 8);
    bodyGeo.rotateX(Math.PI / 2);
    add(g, bodyGeo, fuselageMat);

    // ventral belly fairing
    const bellyGeo = new THREE.BoxGeometry(0.23, 0.09, 1.3);
    const belly = new THREE.Mesh(bellyGeo, fuselageMat);
    belly.position.set(0, -0.05, -0.02);
    g.add(belly);

    // ── nose cone ────────────────────────────────────────────────────────────
    const noseGeo = new THREE.ConeGeometry(0.115, 0.58, 8);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, fuselageMat);
    nose.position.set(0, 0.01, -1.065);   // base aligns with fuselage front
    g.add(nose);

    // ── chin air-intake ───────────────────────────────────────────────────────
    // Intake duct box
    const ductGeo = new THREE.BoxGeometry(0.18, 0.115, 0.52);
    const duct = new THREE.Mesh(ductGeo, darkMat);
    duct.position.set(0, -0.12, -0.42);
    g.add(duct);

    // Intake ramp (angled top face of intake)
    const rampGeo = quad(
      -0.09, -0.065, -0.68,
       0.09, -0.065, -0.68,
       0.09, -0.065, -0.18,
      -0.09, -0.065, -0.18
    );
    add(g, rampGeo, darkMat);

    // Intake mouth (dark ellipse at opening)
    const mouthGeo = new THREE.CylinderGeometry(0.078, 0.078, 0.015, 14, 1, false);
    mouthGeo.rotateX(Math.PI / 2);
    const mouth = new THREE.Mesh(mouthGeo, intakeMat);
    mouth.position.set(0, -0.12, -0.68);
    g.add(mouth);

    // ── canopy bubble ─────────────────────────────────────────────────────────
    const canopyGeo = new THREE.SphereGeometry(0.118, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.105, -0.30);
    canopy.rotation.x = 0.22;
    g.add(canopy);

    // canopy frame rail
    const frameGeo = new THREE.TorusGeometry(0.116, 0.009, 4, 24, Math.PI * 0.95);
    const frame = new THREE.Mesh(frameGeo, darkMat);
    frame.rotation.x = Math.PI / 2 + 0.22;
    frame.position.set(0, 0.105, -0.30);
    g.add(frame);

    // canopy rear edge strip
    const rearFrameGeo = new THREE.BoxGeometry(0.22, 0.012, 0.012);
    const rearFrame = new THREE.Mesh(rearFrameGeo, darkMat);
    rearFrame.position.set(0, 0.105, 0.03);
    g.add(rearFrame);

    // ── leading-edge root extensions (LERX) ──────────────────────────────────
    add(g, quad(
      -0.115, 0.005, -0.68,
      -0.22,  0.005, -0.52,
      -0.22,  0.005, -0.26,
      -0.115, 0.005, -0.26
    ), fuselageMat);

    add(g, quad(
       0.115, 0.005, -0.68,
       0.22,  0.005, -0.52,
       0.22,  0.005, -0.26,
       0.115, 0.005, -0.26
    ), fuselageMat);

    // ── delta wings ───────────────────────────────────────────────────────────
    // Left wing — swept leading edge, straight trailing edge
    add(g, quad(
      -0.115, -0.03, -0.36,    // root LE
      -0.82,  -0.03, -0.13,    // tip LE (swept)
      -1.10,  -0.03,  0.23,    // tip TE
      -0.115, -0.03,  0.28     // root TE
    ), wingMat);

    // Right wing
    add(g, quad(
       0.115, -0.03, -0.36,
       0.82,  -0.03, -0.13,
       1.10,  -0.03,  0.23,
       0.115, -0.03,  0.28
    ), wingMat);

    // Wing top faces (gives wings slight thickness)
    add(g, quad(
      -0.115, 0.00, -0.36,
      -0.82,  0.00, -0.13,
      -1.10,  0.00,  0.23,
      -0.115, 0.00,  0.28
    ), wingMat);

    add(g, quad(
       0.115, 0.00, -0.36,
       0.82,  0.00, -0.13,
       1.10,  0.00,  0.23,
       0.115, 0.00,  0.28
    ), wingMat);

    // ── vertical tail fin ─────────────────────────────────────────────────────
    add(g, quad(
       0.008, 0.09,  0.18,     // base front
       0.008, 0.09,  0.72,     // base rear
       0.008, 0.70,  0.62,     // tip rear
       0.008, 0.52,  0.22      // tip front
    ), darkMat);

    add(g, quad(
      -0.008, 0.09,  0.18,
      -0.008, 0.09,  0.72,
      -0.008, 0.70,  0.62,
      -0.008, 0.52,  0.22
    ), darkMat);

    // fin leading-edge cap
    add(g, quad(
       0.008, 0.09, 0.18,
      -0.008, 0.09, 0.18,
      -0.008, 0.52, 0.22,
       0.008, 0.52, 0.22
    ), fuselageMat);

    // ── horizontal stabilizers ────────────────────────────────────────────────
    add(g, quad(
      -0.115, -0.04,  0.40,
      -0.58,  -0.04,  0.44,
      -0.55,  -0.04,  0.72,
      -0.115, -0.04,  0.68
    ), wingMat);

    add(g, quad(
      -0.115, -0.015,  0.40,
      -0.58,  -0.015,  0.44,
      -0.55,  -0.015,  0.72,
      -0.115, -0.015,  0.68
    ), wingMat);

    add(g, quad(
       0.115, -0.04,  0.40,
       0.58,  -0.04,  0.44,
       0.55,  -0.04,  0.72,
       0.115, -0.04,  0.68
    ), wingMat);

    add(g, quad(
       0.115, -0.015,  0.40,
       0.58,  -0.015,  0.44,
       0.55,  -0.015,  0.72,
       0.115, -0.015,  0.68
    ), wingMat);

    // ── engine nozzle ─────────────────────────────────────────────────────────
    const nozzleGeo = new THREE.CylinderGeometry(0.096, 0.078, 0.24, 12);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.set(0, 0, 0.895);
    g.add(nozzle);

    // afterburner petals
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const petalGeo = new THREE.BoxGeometry(0.014, 0.028, 0.09);
      const petal = new THREE.Mesh(petalGeo, nozzleMat);
      petal.position.set(Math.cos(angle) * 0.088, Math.sin(angle) * 0.088, 0.925);
      petal.rotation.z = angle;
      g.add(petal);
    }

    // exhaust flame
    const flameGeo = new THREE.ConeGeometry(0.068, 0.28, 10);
    flameGeo.rotateX(Math.PI / 2);
    this.exhaustFlame = new THREE.Mesh(flameGeo, exhaustMat);
    this.exhaustFlame.position.set(0, 0, 1.1);
    g.add(this.exhaustFlame);

    // exhaust glow light
    this.exhaustLight = new THREE.PointLight(0xff6600, 0.7, 1.4);
    this.exhaustLight.position.set(0, 0, 1.05);
    g.add(this.exhaustLight);

    // ── navigation lights ─────────────────────────────────────────────────────
    const navGeo = new THREE.SphereGeometry(0.024, 6, 6);

    const leftNav = new THREE.Mesh(navGeo, navRedMat);
    leftNav.position.set(-1.10, -0.01, 0.05);
    g.add(leftNav);
    const leftNavLight = new THREE.PointLight(0xff2200, 0.25, 0.6);
    leftNavLight.position.set(-1.10, -0.01, 0.05);
    g.add(leftNavLight);

    const rightNav = new THREE.Mesh(navGeo, navGreenMat);
    rightNav.position.set(1.10, -0.01, 0.05);
    g.add(rightNav);
    const rightNavLight = new THREE.PointLight(0x00ff44, 0.25, 0.6);
    rightNavLight.position.set(1.10, -0.01, 0.05);
    g.add(rightNavLight);

    // tail strobe (white)
    const strobeGeo = new THREE.SphereGeometry(0.018, 6, 6);
    const strobe = new THREE.Mesh(strobeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    strobe.position.set(0, 0.72, 0.62);
    g.add(strobe);
  }

  public update(deltaTime: number, inputManager: InputManager) {
    const h = inputManager.getHorizontalInput();
    const v = inputManager.getVerticalInput();

    this.mesh.position.x = THREE.MathUtils.clamp(
      this.mesh.position.x + h * MOVE_SPEED * deltaTime,
      -BOUNDS, BOUNDS
    );
    this.mesh.position.y = THREE.MathUtils.clamp(
      this.mesh.position.y + v * MOVE_SPEED * deltaTime,
      -BOUNDS, BOUNDS
    );

    // Bank and pitch with movement
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, -h * 0.38, 0.12);
    this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x,  v * 0.20, 0.12);

    // Pulsing afterburner
    const flicker = 0.5 + Math.sin(Date.now() * 0.022) * 0.2 + Math.random() * 0.08;
    this.exhaustLight.intensity = flicker;
    this.exhaustFlame.scale.setScalar(0.9 + Math.sin(Date.now() * 0.03) * 0.12);
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public getBoundingBox(): THREE.Box3 {
    this.boundingBox.setFromObject(this.mesh);
    return this.boundingBox;
  }
}
