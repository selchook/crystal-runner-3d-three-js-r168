# HTML5 3D Game Error Reference Guide
**Three.js r168 | Vercel | CrazyGames**

---

## 1. npm install / Vite build errors

### ❌ `npm ERR! peer dep missing`
```bash
npm ERR! peer dep missing: three@^0.168.0
```
**Fix:**
```bash
npm install three@0.168.0 --save-exact
npm install @types/three --save-dev
```

### ❌ Vite build fails: `RollupError: Could not resolve import`
```bash
[vite]: Rollup failed to resolve import "three/examples/jsm/..."
```
**Fix - vite.config.js:**
```js
import { defineConfig } from 'vite'
export default defineConfig({
  resolve: {
    alias: {
      'three/examples/jsm': 'three/examples/jsm'
    }
  },
  assetsInclude: ['**/*.gltf', '**/*.glb']
})
```

### ❌ `Cannot resolve module 'three/addons'`
**Fix - Use correct r168 imports:**
```js
// ❌ Wrong
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// ✅ Correct for r168
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
```

---

## 2. Three.js r168 engine errors

### ❌ `WebGLRenderer: Error creating WebGL context`
```js
THREE.WebGLRenderer: Error creating WebGL context.
```
**Fix:**
```js
// Add fallback canvas creation
function createRenderer() {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
  
  if (!context) {
    document.body.innerHTML = '<h1>WebGL not supported</h1>'
    return null
  }
  
  const renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: window.devicePixelRatio < 2,
    powerPreference: "high-performance"
  })
  return renderer
}
```

### ❌ `BufferGeometry.computeBoundingSphere(): Computed radius is NaN`
```js
THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN
```
**Fix:**
```js
// Validate geometry before adding to scene
function addMesh(geometry, material) {
  if (geometry.attributes.position.count === 0) {
    console.warn('Empty geometry detected')
    return null
  }
  
  geometry.computeBoundingSphere()
  if (isNaN(geometry.boundingSphere.radius)) {
    geometry.boundingSphere.radius = 1
  }
  
  return new THREE.Mesh(geometry, material)
}
```

### ❌ Texture loading fails silently
**Fix:**
```js
const loader = new THREE.TextureLoader()
const texture = loader.load(
  'path/to/texture.jpg',
  (tex) => console.log('Texture loaded'),
  (progress) => console.log('Loading progress:', progress),
  (error) => {
    console.error('Texture failed:', error)
    // Use fallback color
    material.map = null
    material.color.setHex(0x00ff00)
  }
)
```

---

## 3. CrazyGames SDK errors

### ❌ `CrazyGames SDK failed to initialize`
```js
CrazyGames SDK is not available
```
**Fix - index.html:**
```html
<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>
<script>
window.addEventListener('load', async () => {
  try {
    if (window.CrazyGames) {
      await window.CrazyGames.SDK.