// 👋 Advanced Gesture Detector - Two-Hand Support
// Detects 12+ gestures including pinch, grab, clap, swipe, thumbs up/down

class GestureDetector {
  constructor() {
    this.hands = [];
    this.prevHands = [];
    this.gestureHistory = [];
    this.prevTwoHandDistance = null;
    this.swipeStartPosition = null;
    this.swipeStartTime = null;
    
    // Thresholds
    this.pinchThreshold = 0.05; // Normalized distance
    this.clapThreshold = 0.15;
    this.clapVelocityThreshold = 2.0;
    this.swipeDistanceThreshold = 0.2;
    this.swipeTimeWindow = 500; // ms
    
    this.currentGestures = {
      single: null,
      twoHand: null,
      confidence: 0
    };
  }
  
  // Update with MediaPipe results
  update(results, deltaTime) {
    this.prevHands = [...this.hands];
    this.hands = [];
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((landmarks, index) => {
        const handedness = results.multiHandedness[index].label; // "Left" or "Right"
        this.hands.push({
          landmarks,
          handedness,
          palmPosition: landmarks[0],
          fingers: this.analyzeFingers(landmarks)
        });
      });
    }
    
    // Detect gestures
    if (this.hands.length === 1) {
      this.detectSingleHandGestures(deltaTime);
    } else if (this.hands.length === 2) {
      this.detectTwoHandGestures(deltaTime);
    } else {
      this.currentGestures = { single: null, twoHand: null, confidence: 0 };
    }
    
    return this.currentGestures;
  }
  
  // Analyze finger states (extended or curled)
  analyzeFingers(landmarks) {
    const fingers = {
      thumb: this.isFingerExtended(landmarks, 4, 3, 2),
      index: this.isFingerExtended(landmarks, 8, 7, 6),
      middle: this.isFingerExtended(landmarks, 12, 11, 10),
      ring: this.isFingerExtended(landmarks, 16, 15, 14),
      pinky: this.isFingerExtended(landmarks, 20, 19, 18)
    };
    
    fingers.extendedCount = Object.values(fingers).filter(Boolean).length;
    fingers.allExtended = fingers.extendedCount === 5;
    fingers.allCurled = fingers.extendedCount === 0;
    
    return fingers;
  }
  
  // Check if finger is extended
  isFingerExtended(landmarks, tipIdx, middleIdx, baseIdx) {
    const tip = landmarks[tipIdx];
    const middle = landmarks[middleIdx];
    const base = landmarks[baseIdx];
    
    // Distance from tip to base should be greater than middle to base
    const tipToBase = this.distance3D(tip, base);
    const middleToBase = this.distance3D(middle, base);
    
    return tipToBase > middleToBase * 1.1;
  }
  
  // ===== SINGLE-HAND GESTURES =====
  detectSingleHandGestures(deltaTime) {
    const hand = this.hands[0];
    const fingers = hand.fingers;
    
    // OPEN PALM - all fingers extended
    if (fingers.allExtended) {
      this.currentGestures = {
        single: 'OPEN_PALM',
        twoHand: null,
        confidence: 1.0,
        data: { hand: hand.handedness }
      };
      return;
    }
    
    // CLOSED FIST - all fingers curled
    if (fingers.allCurled) {
      this.currentGestures = {
        single: 'FIST',
        twoHand: null,
        confidence: 1.0,
        data: { hand: hand.handedness }
      };
      return;
    }
    
    // PINCH - thumb and index close together
    const pinch = this.detectPinch(hand.landmarks);
    if (pinch.isPinching) {
      this.currentGestures = {
        single: 'PINCH',
        twoHand: null,
        confidence: pinch.strength,
        data: { 
          hand: hand.handedness,
          position: pinch.position,
          strength: pinch.strength
        }
      };
      return;
    }
    
    // POINTING - only index extended
    if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      this.currentGestures = {
        single: 'POINTING',
        twoHand: null,
        confidence: 0.9,
        data: { 
          hand: hand.handedness,
          direction: this.getPointingDirection(hand.landmarks)
        }
      };
      return;
    }
    
    // THUMBS UP
    if (fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      const thumbUp = this.isThumbUp(hand.landmarks);
      if (thumbUp) {
        this.currentGestures = {
          single: 'THUMBS_UP',
          twoHand: null,
          confidence: 0.8,
          data: { hand: hand.handedness }
        };
        return;
      }
    }
    
    // THUMBS DOWN
    if (fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      const thumbDown = this.isThumbDown(hand.landmarks);
      if (thumbDown) {
        this.currentGestures = {
          single: 'THUMBS_DOWN',
          twoHand: null,
          confidence: 0.8,
          data: { hand: hand.handedness }
        };
        return;
      }
    }
    
    // SWIPE - detect horizontal movement
    const swipe = this.detectSwipe(hand, deltaTime);
    if (swipe.isSwiping) {
      this.currentGestures = {
        single: 'SWIPE',
        twoHand: null,
        confidence: 0.9,
        data: {
          hand: hand.handedness,
          direction: swipe.direction,
          velocity: swipe.velocity
        }
      };
      return;
    }
    
    // PEACE SIGN - index and middle extended
    if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
      this.currentGestures = {
        single: 'PEACE',
        twoHand: null,
        confidence: 0.8,
        data: { hand: hand.handedness }
      };
      return;
    }
    
    // Default: PARTIAL (some fingers extended)
    this.currentGestures = {
      single: 'PARTIAL',
      twoHand: null,
      confidence: 0.5,
      data: { 
        hand: hand.handedness,
        extendedCount: fingers.extendedCount
      }
    };
  }
  
  // ===== TWO-HAND GESTURES =====
  detectTwoHandGestures(deltaTime) {
    const hand1 = this.hands[0];
    const hand2 = this.hands[1];
    
    // TWO-HAND PINCH (zoom gesture)
    const pinch1 = this.detectPinch(hand1.landmarks);
    const pinch2 = this.detectPinch(hand2.landmarks);
    
    if (pinch1.isPinching && pinch2.isPinching) {
      const currentDistance = this.distance3D(
        pinch1.position, 
        pinch2.position
      );
      
      if (this.prevTwoHandDistance !== null) {
        const delta = currentDistance - this.prevTwoHandDistance;
        const action = delta > 0.01 ? 'PINCH_OUT' : delta < -0.01 ? 'PINCH_IN' : 'PINCH_HOLD';
        
        this.currentGestures = {
          single: null,
          twoHand: action,
          confidence: 0.9,
          data: {
            distance: currentDistance,
            delta,
            zoomFactor: currentDistance / (this.prevTwoHandDistance || 1)
          }
        };
        
        this.prevTwoHandDistance = currentDistance;
        return;
      }
      
      this.prevTwoHandDistance = currentDistance;
    } else {
      this.prevTwoHandDistance = null;
    }
    
    // HAND CLAP - palms close together with velocity
    const palmDistance = this.distance3D(hand1.palmPosition, hand2.palmPosition);
    
    if (palmDistance < this.clapThreshold) {
      const velocity = this.getPalmsVelocity(hand1, hand2);
      
      if (velocity > this.clapVelocityThreshold) {
        this.currentGestures = {
          single: null,
          twoHand: 'CLAP',
          confidence: 1.0,
          data: {
            intensity: Math.min(velocity / 5, 1),
            position: {
              x: (hand1.palmPosition.x + hand2.palmPosition.x) / 2,
              y: (hand1.palmPosition.y + hand2.palmPosition.y) / 2,
              z: (hand1.palmPosition.z + hand2.palmPosition.z) / 2
            }
          }
        };
        return;
      }
    }
    
    // PARALLEL HANDS (rotate gesture)
    if (this.areHandsParallel(hand1, hand2)) {
      const avgY = (hand1.palmPosition.y + hand2.palmPosition.y) / 2;
      const horizontalDistance = Math.abs(hand1.palmPosition.x - hand2.palmPosition.x);
      
      this.currentGestures = {
        single: null,
        twoHand: 'PARALLEL_ROTATE',
        confidence: 0.8,
        data: {
          distance: horizontalDistance,
          height: avgY,
          direction: hand1.palmPosition.x < hand2.palmPosition.x ? 'left_to_right' : 'right_to_left'
        }
      };
      return;
    }
    
    // TWO OPEN PALMS (spread gesture)
    if (hand1.fingers.allExtended && hand2.fingers.allExtended) {
      this.currentGestures = {
        single: null,
        twoHand: 'TWO_OPEN_PALMS',
        confidence: 1.0,
        data: {
          distance: this.distance3D(hand1.palmPosition, hand2.palmPosition)
        }
      };
      return;
    }
    
    // TWO FISTS (power gesture)
    if (hand1.fingers.allCurled && hand2.fingers.allCurled) {
      this.currentGestures = {
        single: null,
        twoHand: 'TWO_FISTS',
        confidence: 1.0,
        data: {
          distance: this.distance3D(hand1.palmPosition, hand2.palmPosition)
        }
      };
      return;
    }
    
    // Default: Two hands present but no specific gesture
    this.currentGestures = {
      single: null,
      twoHand: 'TWO_HANDS_IDLE',
      confidence: 0.3,
      data: {
        hand1Fingers: hand1.fingers.extendedCount,
        hand2Fingers: hand2.fingers.extendedCount
      }
    };
  }
  
  // ===== HELPER FUNCTIONS =====
  
  // Detect pinch between thumb and index
  detectPinch(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    
    const distance = this.distance3D(thumbTip, indexTip);
    const threshold = this.pinchThreshold;
    
    if (distance < threshold) {
      return {
        isPinching: true,
        strength: 1 - (distance / threshold),
        position: {
          x: (thumbTip.x + indexTip.x) / 2,
          y: (thumbTip.y + indexTip.y) / 2,
          z: (thumbTip.z + indexTip.z) / 2
        }
      };
    }
    
    return { isPinching: false };
  }
  
  // Detect swipe gesture
  detectSwipe(hand, deltaTime) {
    const palmPos = hand.palmPosition;
    
    if (!this.swipeStartPosition) {
      this.swipeStartPosition = { x: palmPos.x, y: palmPos.y };
      this.swipeStartTime = Date.now();
      return { isSwiping: false };
    }
    
    const elapsed = Date.now() - this.swipeStartTime;
    const dx = palmPos.x - this.swipeStartPosition.x;
    const dy = palmPos.y - this.swipeStartPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Reset if too slow
    if (elapsed > this.swipeTimeWindow) {
      this.swipeStartPosition = { x: palmPos.x, y: palmPos.y };
      this.swipeStartTime = Date.now();
      return { isSwiping: false };
    }
    
    // Detect swipe
    if (distance > this.swipeDistanceThreshold) {
      const direction = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'RIGHT' : 'LEFT')
        : (dy > 0 ? 'DOWN' : 'UP');
      
      const velocity = distance / (elapsed / 1000);
      
      this.swipeStartPosition = null;
      this.swipeStartTime = null;
      
      return {
        isSwiping: true,
        direction,
        velocity,
        distance
      };
    }
    
    return { isSwiping: false };
  }
  
  // Check if thumb is pointing up
  isThumbUp(landmarks) {
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    const wrist = landmarks[0];
    
    // Thumb tip should be above thumb base and wrist
    return thumbTip.y < thumbBase.y && thumbTip.y < wrist.y;
  }
  
  // Check if thumb is pointing down
  isThumbDown(landmarks) {
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    const wrist = landmarks[0];
    
    // Thumb tip should be below thumb base and wrist
    return thumbTip.y > thumbBase.y && thumbTip.y > wrist.y;
  }
  
  // Get pointing direction vector
  getPointingDirection(landmarks) {
    const indexTip = landmarks[8];
    const indexBase = landmarks[5];
    
    return {
      x: indexTip.x - indexBase.x,
      y: indexTip.y - indexBase.y,
      z: indexTip.z - indexBase.z
    };
  }
  
  // Check if hands are parallel (for rotation gesture)
  areHandsParallel(hand1, hand2) {
    const h1Middle = hand1.landmarks[12];
    const h2Middle = hand2.landmarks[12];
    
    const yDiff = Math.abs(h1Middle.y - h2Middle.y);
    const xDistance = Math.abs(hand1.palmPosition.x - hand2.palmPosition.x);
    
    // Hands should be at similar height and reasonable distance apart
    return yDiff < 0.1 && xDistance > 0.2 && xDistance < 0.6;
  }
  
  // Get velocity of palms moving together
  getPalmsVelocity(hand1, hand2) {
    if (this.prevHands.length < 2) return 0;
    
    const prevHand1 = this.prevHands[0];
    const prevHand2 = this.prevHands[1];
    
    const dist1 = this.distance3D(hand1.palmPosition, prevHand1.palmPosition);
    const dist2 = this.distance3D(hand2.palmPosition, prevHand2.palmPosition);
    
    return (dist1 + dist2) / 2;
  }
  
  // 3D distance
  distance3D(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = (p2.z || 0) - (p1.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  // Get gesture info for display
  getGestureInfo() {
    const gesture = this.currentGestures.twoHand || this.currentGestures.single;
    const confidence = this.currentGestures.confidence;
    const data = this.currentGestures.data;
    
    return { gesture, confidence, data };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GestureDetector;
}
