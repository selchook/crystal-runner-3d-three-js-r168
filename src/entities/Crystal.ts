import * as THREE from 'three';

export class Crystal {
  private mesh: THREE.Mesh;
  private boundingBox = new THREE.Box3();
  private rotSpeed = Math.random() * 2 + 1;

  constructor(x: number, y: number, z: number) {
    const geo = new THREE.OctahedronGeometry(0.35, 0);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x004444,
      transparent: true,
      opacity: 0.9,
      shininess: 120
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, z);
  }

  public update(deltaTime: number, speed: number) {
    this.mesh.position.z += speed * deltaTime;
    this.mesh.rotation.y += this.rotSpeed * deltaTime;
    this.mesh.rotation.x += this.rotSpeed * 0.5 * deltaTime;
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
