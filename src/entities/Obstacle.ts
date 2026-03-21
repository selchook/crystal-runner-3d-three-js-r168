import * as THREE from 'three';

const SHAPES = [
  () => new THREE.BoxGeometry(0.8, 0.8, 0.8),
  () => new THREE.CylinderGeometry(0.3, 0.4, 0.9, 8),
  () => new THREE.TetrahedronGeometry(0.55, 0),
];

const COLORS = [0xff3300, 0xff6600, 0xcc0044];

export class Obstacle {
  private mesh: THREE.Mesh;
  private boundingBox = new THREE.Box3();
  private rotSpeed = (Math.random() - 0.5) * 3;

  constructor(x: number, y: number, z: number) {
    const shapeIdx = Math.floor(Math.random() * SHAPES.length);
    const colorIdx = Math.floor(Math.random() * COLORS.length);

    const geo = SHAPES[shapeIdx]();
    const mat = new THREE.MeshPhongMaterial({
      color: COLORS[colorIdx],
      emissive: 0x110000,
      shininess: 60
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  }

  public update(deltaTime: number, speed: number) {
    this.mesh.position.z += speed * deltaTime;
    this.mesh.rotation.y += this.rotSpeed * deltaTime;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public getBoundingBox(): THREE.Box3 {
    this.boundingBox.setFromObject(this.mesh);
    return this.boundingBox;
  }

  public isOutOfBounds(): boolean {
    return this.mesh.position.z > 5;
  }
}
