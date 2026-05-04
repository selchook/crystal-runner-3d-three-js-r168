# Technical Architecture: Crystal Runner 3D

## 1. Engine Choice: Three.js r168 (rationale)

**Three.js r168** selected for:
- **Procedural geometry**: Built-in BufferGeometry for tunnel segments, crystals, particles
- **WebGL shader support**: Custom materials for crystal refractions, tunnel glow effects
- **Performance**: Instanced rendering for thousands of gems/obstacles
- **Cross-platform**: Consistent rendering across Chrome/Edge/mobile
- **Bundle size**: Core Three.js ~600KB gzipped, fits GameHub Arena requirements
- **Web Audio integration**: Seamless positional audio for 3D spatial effects

## 2. Project File Structure

```
crystal-runner-3d/
├── src/
│   ├── main.js                 # Entry point, SDK init
│   ├── core/
│   │   ├── Game.js            # Main game class
│   │   ├── SceneManager.js    # Scene transitions
│   │   ├── StateManager.js    # Game state enum
│   │   └── AssetManager.js    # Procedural asset generation
│   ├── scenes/
│   │   ├── BootScene.js       # SDK initialization
│   │   ├── LoadScene.js       # Asset generation progress
│   │   ├── MenuScene.js       # Main menu
│   │   ├── GameScene.js       # Core gameplay
│   │   └── GameOverScene.js   # Results/restart
│   ├── entities/
│   │   ├── Player.js          # Glowing character
│   │   ├── Tunnel.js          # Procedural tunnel segments
│   │   ├── Crystal.js         # Collectible gems
│   │   └── Obstacle.js        # Deadly barriers
│   ├── systems/
│   │   ├── InputSystem.js     # Unified input handling
│   │   ├── AudioSystem.js     # Web Audio + GameHub Arena mute
│   │   ├── ParticleSystem.js  # GPU particle effects
│   │   └── CollisionSystem.js # AABB/sphere collision
│   └── utils/
│       ├── MathUtils.js       # 3D math helpers
│       └── ProceduralUtils.js # Geometry generation
├── index.html                 # GHA SDK script
├── style.css                  # Canvas setup, user-select:none
├── vite.config.js             # Build configuration
└── package.json               # Three.js r168 dependency
```

## 3. Scene Architecture (Boot→Load→Menu→Game→GameOver)

**BootScene**: GHA SDK initialization, immediate transition
**LoadScene**: Procedural asset generation (tunnel meshes, materials), progress bar
**MenuScene**: Title screen with play button, particle background
**GameScene**: Core 3D gameplay loop, tunnel generation, collision detection
**GameOverScene**: Score display, restart/menu options, achievement unlocks

Scene transitions use `SceneManager.transitionTo(sceneName)` with fade effects.

## 4. Game State Machine (exact enum names)

```javascript
const GameState = {
    BOOT: 'BOOT',
    LOADING: 'LOADING', 
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    RESTARTING: 'RESTARTING'
};
```

State transitions trigger GHA SDK events:
- LOADING → `loadingStart()`
- MENU → `loadingStop()` 
- PLAYING → `gameplayStart()`
- GAME_OVER → `gameplayStop()`

## 5. Entity & Component Design

**Player**: Three.js Mesh with glowing material, position interpolation, input response
**Tunnel**: Procedural CylinderGeometry segments, scrolling/rotation animation
**Crystal**: IcosahedronGeometry with refraction shader, collection particles
**Obstacle**: BoxGeometry barriers