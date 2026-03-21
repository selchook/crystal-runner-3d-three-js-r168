import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { Player } from '../entities/Player';
import { Crystal } from '../entities/Crystal';
import { Obstacle } from '../entities/Obstacle';

const CrazySDK = {
  gameplayStart() { try { if(window.CrazyGames) window.CrazyGames.SDK.game.gameplayStart(); } catch{} },
  gameplayStop()  { try { if(window.CrazyGames) window.CrazyGames.SDK.game.gameplayStop();  } catch{} }
};

export class GameScene extends BaseScene {
  private player!: Player;
  private crystals: Crystal[] = [];
  private obstacles: Obstacle[] = [];
  private tunnel!: THREE.Group;
  private speed = 5;
  private spawnTimer = 0;
  private scoreDisplay!: THREE.Group;
  private gameTime = 0;
  private lastObstacleZ = 0;
  private lastCrystalZ = 0;

  public enter() {
    CrazySDK.gameplayStart();
    
    this.scene.background = new THREE.Color(0x000011);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x8888ff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Position camera
    this.camera.position.set(0, 1, 3);
    this.camera.lookAt(0, 0, 0);

    // Create tunnel
    this.createTunnel();
    
    // Create player
    this.player = new Player(this.engine);
    this.scene.add(this.player.getMesh());
    
    // Add camera to player for audio
    this.player.getMesh().add(this.engine.audioManager.getListener());
    
    // Create score display
    this.createScoreDisplay();
  }

  private createTunnel() {
    this.tunnel = new THREE.Group();
    
    // Create tunnel segments
    for (let i = 0; i < 20; i++) {
      const segmentGroup = new THREE.Group();
      
      // Create tunnel ring
      const ringGeometry = new THREE.RingGeometry(4, 5, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x002244,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.z = -i * 5;
      segmentGroup.add(ring);
      
      // Add some detail lines
      for (let j = 0; j < 8; j++) {
        const lineGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x0044aa });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        
        const angle = (j / 8) * Math.PI * 2;
        line.position.x = Math.cos(angle) * 4.5;
        line.position.y = Math.sin(angle) * 4.5;
        line.position.z = -i * 5;
        
        segmentGroup.add(line);
      }
      
      this.tunnel.add(segmentGroup);
    }
    
    this.scene.add(this.tunnel);
  }

  private createScoreDisplay() {
    this.scoreDisplay = new THREE.Group();
    this.updateScoreDisplay();
    this.scene.add(this.scoreDisplay);
  }

  private updateScoreDisplay() {
    // Clear existing score display