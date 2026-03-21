import * as THREE from 'three';
import { InputManager } from '../engine/InputManager';

const MOVE_SPEED = 6;
const BOUNDS = 3;

export class Player {
  private mesh: THREE.Group;
  private boundingBox = new THREE.Box3();

  constructor() {
    this.mesh = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.3, 0.8);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xff4444, emissive: 0x330000 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.mesh.add(body);

    // Cockpit
    const cockpitGeo = new THREE.ConeGeometry(0.2, 0.4, 6);
    const cockpitMat = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x003333, transparent: true, opacity: 0.85 });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.rotation.x = -Math.PI / 2;
    cockpit.position.z = -0.5;
    this.mesh.add(cockpit);

    // Wing left
    const wingGeo = new THREE.BoxGeometry(0.8, 0.05, 0.4);
    const wingMat = new THREE.MeshPhongMaterial({ color: 0xcc2222, emissive: 0x220000 });
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.x = -0.5;
    this.mesh.add(wingL);

    // Wing right
    const wingR = wingL.clone();
    wingR.position.x = 0.5;
    this.mesh.add(wingR);

    this.mesh.position.set(0, 0, 0);
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

    // Tilt ship slightly based on input
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, -h * 0.3, 0.15);
    this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, v * 0.2, 0.15);
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public getBoundingBox(): THREE.Box3 {
    this.boundingBox.setFromObject(this.mesh);
    return this.boundingBox;
  }
}
