# CrazyGames Submission Guide for Crystal Runner 3D

## 1. Account Setup

- Visit [developer.crazygames.com](https://developer.crazygames.com) and create a developer account
- Complete profile with studio information and contact details
- Verify email address and accept developer terms
- Set up payment information for revenue sharing (70% developer, 30% CrazyGames)

## 2. Pre-submission Checklist (Technical Requirements)

### Core Requirements
- ✅ **HTTPS hosting** (Vercel provides this automatically)
- ✅ **Responsive design** supporting 800x600 minimum resolution
- ✅ **WebGL compatibility** (Three.js handles this)
- ✅ **Mobile-friendly controls** (touch + keyboard/mouse support)
- ✅ **No external dependencies** that require user accounts/logins
- ✅ **Clean URL structure** (no query parameters in main game URL)
- ✅ **Loading screen** with progress indicator
- ✅ **Pause functionality** when game loses focus

### Performance Targets
- Initial load time: <10 seconds on average connection
- Frame rate: 30+ FPS on mid-range devices
- Memory usage: <500MB peak

## 3. SDK Integration Verification Steps

### Install CrazyGames SDK
```bash
npm install @crazygames/sdk
```

### Essential SDK Integration
```javascript
import { CrazyGames } from '@crazygames/sdk';

// Initialize SDK
CrazyGames.SDK.init();

// Ad integration points
function showRewardedAd() {
    CrazyGames.SDK.ad.requestAd('rewarded', {
        adFinished: () => {
            // Grant reward (extra lives, gems, etc.)
        },
        adError: () => {
            // Handle ad failure gracefully
        }
    });
}

// Gameplay events tracking
CrazyGames.SDK.game.gameplayStart();
CrazyGames.SDK.game.gameplayStop();

// Happy time (optimal ad moments)
CrazyGames.SDK.game.happyTime();
```

### Test SDK Integration
- Verify ads show in development environment
- Test gameplay event triggers
- Confirm no console errors related to SDK

## 4. Bundle Size Optimization (Target ≤20MB Initial)

### Three.js Optimization
- Use `three/examples/jsm/` imports instead of full library
- Enable tree shaking in build process
- Compress textures (use .jpg for photos, .png for transparency)
- Implement asset streaming for large models/textures

### Build Optimization
```json
// vite.config.js example
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['three'],
          game: ['./src/game']
        }
      }
    }
  }
}
```

### Asset Management
- Compress audio files (use .ogg or .mp3, 64-128kbps)
- Optimize 3D models (reduce polygon count, merge materials)
- Use texture atlases to reduce HTTP requests
- Implement progressive loading for non-essential assets

## 5. Game Cover Images Required

### Create These Assets:
- **Thumbnail**: 280x280px PNG
  - Show main character and crystal tunnel
  - High contrast, clear at small size
  - Include game title text

- **Banner**: 1900x1200px PNG
  - Landscape orientation
  - Showcase 3D tunnel environment
  - Character in action pose
  - Clean, modern UI elements visible

### Design Tips:
- Use bright, saturated colors for visibility
- Avoid text smaller than 24px
- Show gameplay elements, not just characters
- A/B testing shows action shots perform better

## 6. Categories & Tags Selection

### Primary Category:
- **3D Games** or **Running Games**

### Recommended Tags:
- `3d`, `running`, `endless`, `collecting`, `arcade`
- `crystals`, `tunnel`, `speed`, `reflex`, `casual`
- `webgl`, `three-js`, `mobile-