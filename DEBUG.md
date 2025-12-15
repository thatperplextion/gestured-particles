# Gesture Detection Debugging Guide

## What You Should See in HUD:

### Phase 1: Startup
- `✓ Camera streaming...` - Camera is receiving video
- `✓ Ready. Show your hand...` - Hand detection is initialized

### Phase 2: Hand Detection
- `❌ No hand detected - Move closer to camera` - Hand not found (move hand into view)
- Gesture display appears when hand is detected

### Phase 3: Gesture Recognition
When hand is detected, HUD shows:
```
Gesture: 🖐️ OPEN | Exp: 1.5 | Compress: 75%
Gesture: 🤏 PINCH | Exp: 1.2 | Compress: 35%
Gesture: ✊ FIST | Exp: 0.8 | Compress: 15%
→ SWIPE RIGHT | Exp: 1.1 | Compress: 80%
→ SWIPE LEFT | Exp: 1.1 | Compress: 80%
```

---

## Testing Checklist:

### 1. **Camera Access**
- [ ] You see a video preview in bottom-left corner
- [ ] The preview shows your hand/face
- [ ] Preview is mirrored (selfie mode)

### 2. **Hand Detection**
- [ ] Open your hand wide
- [ ] Move hand closer/farther from camera
- [ ] You should see hand skeleton overlay (cyan lines, white dots)
- [ ] HUD updates with gesture data

### 3. **Five-Finger Compression**
- [ ] **OPEN HAND** (spread fingers): Shows "🖐️ OPEN" | Compress: 75-100%
- [ ] **PINCH** (curl fingers): Shows "🤏 PINCH" | Compress: 30-45%
- [ ] **FIST** (tight grip): Shows "✊ FIST" | Compress: 0-30%

### 4. **Swipe Gestures**
- [ ] **Swipe LEFT**: Fast hand motion left → Shows "→ SWIPE LEFT"
- [ ] **Swipe RIGHT**: Fast hand motion right → Shows "→ SWIPE RIGHT"
- [ ] Requires 500ms between swipes to prevent repeated triggers

### 5. **Particle Response**
- [ ] **Open hand**: Particles expand, heart shape pulses
- [ ] **Pinch**: Particles swirl, moderate compression
- [ ] **Fist**: Particles contract, orbit motion
- [ ] **Swipe**: Shapes cycle through (heart → flower → saturn → fireworks)
- [ ] **Hand movement**: Particles follow your hand position

---

## Troubleshooting:

### "No hand detected"
1. Check camera preview is working
2. Move hand closer to camera (12-24 inches)
3. Ensure good lighting
4. Avoid dark backgrounds

### Gestures not changing
1. Move hand more deliberately (bigger movements)
2. Check compression percentage in HUD
3. Make sure you're between the thresholds:
   - FIST: < 30%
   - PINCH: 30-45%
   - OPEN: > 45%

### Swipes not working
1. Swipe faster (higher velocity needed)
2. Ensure 500ms delay between swipes
3. Check HUD shows "→ SWIPE" message

### Particles not responding
1. Check HUD updates with gesture changes
2. Verify hand position is being sent (should follow hand)
3. Try pressing keys: 1-4 (shapes), q/w/e (motion)

---

## Console Debugging:
Open Chrome DevTools (F12) and check Console tab for:
- `hands.send error` - Hand detection failing
- `Camera.start failed` - Camera initialization issue
- `Callback error` - Gesture callback error
- Any red errors with details

If you see errors, include them in your next message!
