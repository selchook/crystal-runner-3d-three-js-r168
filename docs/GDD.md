# Game Design Document: **Crystal Runner 3D**

## 1. Concept & Hook (web-first, instant engagement)

**Core Hook**: Navigate a glowing character through an endless 3D crystal tunnel, collecting gems while avoiding deadly obstacles. The tunnel constantly morphs and rotates, creating a mesmerizing, addictive experience.

**Web-First Appeal**:
- Instant visual impact with procedural crystal formations and particle effects
- One-handed play possible (touch/WASD/arrows)
- Progressive difficulty keeps sessions short but engaging
- Satisfying collection mechanics with visual/audio feedback

**Unique Identity**: Unlike generic runners, the 3D rotating tunnel creates spatial disorientation challenges while crystal-themed visuals provide a distinct aesthetic. The tunnel itself becomes a character through its organic morphing behavior.

## 2. Core Loop (sessions 2-10 min, replayable)

**Primary Loop (30-90 seconds)**:
1. Start in tunnel center, moving forward automatically
2. Collect crystals for points while avoiding spikes/barriers
3. Tunnel rotates/morphs, requiring spatial adaptation
4. Hit obstacle → death screen with score/best
5. One-click restart

**Secondary Loop (5-10 runs)**:
- Unlock new crystal colors/effects at score milestones
- Tunnel themes change every 1000 points
- Personal best tracking drives "one more try" mentality

**Retention Mechanics**:
- Daily crystal bonus multiplier
- Screenshot-worthy moments for social sharing
- Leaderboard integration (local storage)

## 3. Mechanics (keyboard+mouse+touch controls)

**Movement System**:
- Character moves in circle around tunnel walls
- Forward movement is automatic and accelerates over time

**Control Schemes**:

| Input | Action | Notes |
|-------|--------|-------|
| **Touch** | Tap left/right screen halves | Primary mobile control |
| **Keyboard** | A/D or Left/Right arrows | WASD alternative |
| **Mouse** | Move left/right of center | Smooth analog control |

**Core Mechanics**:
- **Gravity Shift**: Character sticks to tunnel walls, can run on ceiling/sides
- **Crystal Magnetism**: Crystals have subtle magnetic pull when close
- **Momentum**: Sharp turns require timing; speed affects turning radius
- **Wall-Running**: Seamless transition between tunnel surfaces

**Forbidden Controls**: No Escape key usage, no Ctrl+W interception

## 4. Levels & Progression (clear goals per session)

**Endless Progression**:
- **0-500**: Tutorial tunnel (wide, few obstacles)
- **500-1500**: Crystal Cavern (blue crystals, moderate complexity)
- **1500-3000**: Fire Depths (red crystals, lava obstacles)
- **3000-5000**: Ice Palace (white crystals, slippery surfaces)
- **5000+**: Prismatic Void (rainbow crystals, maximum chaos)

**Session Goals**:
- **Immediate**: Survive next obstacle
- **Short-term**: Beat previous run score
- **Medium-term**: Unlock next theme (visual milestone)
- **Long-term**: Reach leaderboard position

**Difficulty Scaling**:
- Speed increases 5% every 200 points
- Obstacle density increases every theme
- Tunnel morphing becomes more aggressive
- New obstacle types introduced per theme

## 5. Onboarding Plan (in-game, skippable, visual-first, ≤30 seconds)

**Visual Tutorial Sequence** (skippable with any input):

1. **0-3s**: Animated arrows show movement controls
2. **3-8s**: Character demonstrates wall-running around tunnel
3. **8-15s**: Highlight crystal collection with glow effect
4. **15-20s**: Show obstacle (spike) with danger indicator
5. **20-25s**: "TAP TO START" with pulsing effect

**Tutorial Elements**:
- Translucent overlay text: "MOVE", "COLLECT", "AVOID"
- No modal popups or external UI
- Ghost trail shows optimal movement path
- First 3 obstacles are clearly telegraphed
- First 10 crystals have enhanced glow

**Skip Method**: Any input immediately starts