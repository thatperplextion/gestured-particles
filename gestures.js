export function initHandTracking(callback) {
  const video = document.getElementById("video");
  const hudEl = document.getElementById("hud");
  const overlay = document.getElementById("overlay");
  const ctx = overlay ? overlay.getContext("2d") : null;
  
  // Enhanced smoothing with Kalman-like filtering
  let smoothedExpansion = 1;
  let smoothedOpenness = 0;
  let smoothedPalmX = 0.5;
  let smoothedPalmY = 0.5;
  let smoothedPalmZ = 0.5;
  let prevPalm = null;
  let palmVel = { x: 0, y: 0 };
  
  // Adaptive smoothing (stronger when hand is moving fast, lighter when stable)
  const baseSmoothFactor = 0.15; // decreased from 0.2 for smoother transitions
  const maxSmoothFactor = 0.25; // max smoothing during fast motion
  
  // Gesture validation buffer: track multiple metrics to confirm gesture
  let gestureHistory = [];
  const gestureBufferSize = 6; // increased from 4 for more reliable detection
  let lastConfirmedGesture = "OPEN";

  const hands = new Hands({
    locateFile: file =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.5,  // lower threshold for detection at any distance
    minTrackingConfidence: 0.5,   // lower threshold for continuous tracking
    modelComplexity: 1,
    selfieMode: true
  });

  let firstResultTime = null;
  // Simple stability buffer to avoid flicker: require N consecutive frames
  let lastGesture = "OPEN";
  let stableGesture = "OPEN";
  let stableCount = 0;
  const STABLE_FRAMES = 4;
  hands.onResults(results => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      if (hudEl) hudEl.innerHTML = `<span style="color:#ff6b6b">❌ No hand detected - Move closer to camera</span>`;
      return;
    }

    if (!firstResultTime) {
      firstResultTime = performance.now();
      if (hudEl) hudEl.textContent = "results";
    }

    const lm = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness && results.multiHandedness[0] ? results.multiHandedness[0].label : "Unknown";

    // Draw landmarks on overlay
    if (ctx && overlay) {
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      // Convert normalized coords (0..1) to canvas coords
      const toX = x => x * overlay.width;
      const toY = y => y * overlay.height;
      // Draw connections (simple: fingertips to palm)
      const tips = [4,8,12,16,20];
      ctx.strokeStyle = "rgba(0,255,200,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      tips.forEach(i => {
        ctx.moveTo(toX(lm[i].x), toY(lm[i].y));
        ctx.lineTo(toX(lm[0].x), toY(lm[0].y));
      });
      ctx.stroke();
      // Draw points
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      for (let i = 0; i < lm.length; i++) {
        ctx.beginPath();
        ctx.arc(toX(lm[i].x), toY(lm[i].y), i % 4 === 0 ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const thumbTip = lm[4];
    const indexTip = lm[8];
    const palm = lm[0];
    const wrist = lm[0];
    const middleBase = lm[9];

    // Compute a scale-invariant normalization using palm width
    const palmLeft = lm[5];   // index finger MCP
    const palmRight = lm[17]; // pinky MCP
    const palmWidth = Math.max(distance(palmLeft, palmRight), 1e-6);

    // FIVE-FINGER COMPRESSION DETECTION
    // Measure all fingertip-to-palm distances for compression level
    const indexDist = distance(indexTip, palm);
    const middleTip = lm[12];
    const ringTip = lm[16];
    const pinkyTip = lm[20];
    const middleDist = distance(middleTip, palm);
    const ringDist = distance(ringTip, palm);
    const pinkyDist = distance(pinkyTip, palm);
    const thumbDist = distance(thumbTip, palm);
    
    // Average all five fingertip distances (compression metric)
    const allFingerDists = [thumbDist, indexDist, middleDist, ringDist, pinkyDist];
    const avgFingerDist = allFingerDists.reduce((a, b) => a + b) / 5;
    const avgFingerDistNorm = avgFingerDist / palmWidth;
    
    // Compression ratio: how close fingers are to palm (0 = fully closed, 1 = fully open)
    const compressionRatio = Math.max(0, Math.min(1, (avgFingerDistNorm - 0.12) / 0.50));
    
    // Five-finger expansion modifier: compressing all fingers contracts, opening expands
    let fiveFingerExpansionModifier = 1;
    if (compressionRatio < 0.35) {
      // Tight five-finger compression: maximum contraction
      fiveFingerExpansionModifier = 0.5 + (compressionRatio / 0.35) * 0.5; // range 0.5 to 1.0
    } else if (compressionRatio > 0.60) {
      // Open hand: maximum expansion
      fiveFingerExpansionModifier = Math.min(1 + (compressionRatio - 0.60) * 3, 3.0); // range 1.0 to 3.0
    } else {
      // Mid-range: smooth transition
      fiveFingerExpansionModifier = 0.75 + (compressionRatio - 0.35) * 1.0; // range 0.75 to 1.75
    }
    
    // Use average fingertip-to-palm distance for openness, normalized
    const avgOpenNorm = (indexDist + middleDist + ringDist + pinkyDist) / (4 * palmWidth);
    
    // Hand size (distance from wrist to middle finger base) indicates distance from camera
    const handSize = distance(wrist, middleBase);
    // Expansion based on inverse of palmWidth so farther hands still expand
    const distanceScale = 1 / palmWidth; // larger when farther
    const expansionRaw = 0.9 + distanceScale * 0.6; // base + gain
    const expansion = Math.min(Math.max(expansionRaw, 0.7), 3.2);
    
    // Apply five-finger compression modifier to final expansion
    const finalExpansion = expansion * fiveFingerExpansionModifier;

    // Openness metric normalized 0..1 (0 = fully closed fist, 1 = fully open hand)
    // Calibrated for reliable gesture-to-blend-weight mapping
    const openness = Math.max(0, Math.min(1, (avgOpenNorm - 0.10) / 0.45));
    
    // Smooth openness with adaptive factor for responsive gesture blending
    const opennessAdaptiveFactor = adaptiveSmoothFactor * 0.8; // slightly slower than expansion for stability
    smoothedOpenness += opennessAdaptiveFactor * (openness - smoothedOpenness);
    
    // Adaptive smoothing: faster during motion, slower when stable
    const palmMovement = prevPalm ? 
      Math.sqrt((palm.x - prevPalm.x)**2 + (palm.y - prevPalm.y)**2) : 0;
    const adaptiveSmoothFactor = baseSmoothFactor + Math.min(palmMovement * 2, maxSmoothFactor - baseSmoothFactor);
    
    smoothedExpansion += adaptiveSmoothFactor * (finalExpansion - smoothedExpansion);
    
    // GESTURE CLASSIFICATION based on five-finger compression
    let gesture = "OPEN";
    if (compressionRatio < 0.30) {
      // Fully closed fist/compression
      gesture = "FIST";
    } else if (compressionRatio < 0.45) {
      // Moderate compression (pinch-like state)
      gesture = "PINCH";
    } else {
      // Open hand
      gesture = "OPEN";
    }
    
    // Swipe detection using wrist horizontal velocity (momentum-based)
    if (!initHandTracking._prevWristX) initHandTracking._prevWristX = wrist.x;
    if (!initHandTracking._swipeVelocity) initHandTracking._swipeVelocity = 0;
    if (!initHandTracking._lastSwipeTime) initHandTracking._lastSwipeTime = 0;
    
    const vx = wrist.x - initHandTracking._prevWristX;
    initHandTracking._swipeVelocity = vx * 0.7 + initHandTracking._swipeVelocity * 0.3; // momentum smoothing
    initHandTracking._prevWristX = wrist.x;

    // Swipe threshold - lower for easier detection
    const SWIPE_THRESHOLD = 0.06;
    let swipeDirection = null;
    const now = Date.now();
    
    // Allow swipe in any gesture state, but require 500ms between swipes
    if (Math.abs(initHandTracking._swipeVelocity) > SWIPE_THRESHOLD && (now - initHandTracking._lastSwipeTime > 500)) {
      // In selfie mode: positive velocity = leftward swipe
      swipeDirection = initHandTracking._swipeVelocity > 0 ? "LEFT" : "RIGHT";
      initHandTracking._swipeVelocity = 0; // reset after detection
      initHandTracking._lastSwipeTime = now;
    }

    // Gesture history buffer for confident multi-frame validation
    gestureHistory.push({
      gesture: gesture,
      compression: compressionRatio,
      openness: openness
    });
    if (gestureHistory.length > gestureBufferSize) gestureHistory.shift();

    // Confirm gesture only if majority of recent frames agree
    const gestureVotes = {};
    gestureHistory.forEach(h => {
      gestureVotes[h.gesture] = (gestureVotes[h.gesture] || 0) + 1;
    });
    const votedGesture = Object.keys(gestureVotes).reduce((a, b) => 
      gestureVotes[a] > gestureVotes[b] ? a : b
    ) || "OPEN";
    
    if (votedGesture !== lastConfirmedGesture) {
      lastConfirmedGesture = votedGesture;
    }

    // Compute palm velocity with advanced smoothing and acceleration tracking
    if (prevPalm) {
      // Current frame velocity
      const currentVx = palm.x - prevPalm.x;
      const currentVy = palm.y - prevPalm.y;
      
      // Exponential moving average for smooth velocity (0.6 current, 0.4 previous)
      palmVel.x = currentVx * 0.6 + palmVel.x * 0.4;
      palmVel.y = currentVy * 0.6 + palmVel.y * 0.4;
    }
    prevPalm = { x: palm.x, y: palm.y };

    // Smooth palm position with Kalman-like filtering
    // Velocity-based adaptive smoothing: faster motion = less smoothing
    const palmSpeed = Math.sqrt(palmVel.x * palmVel.x + palmVel.y * palmVel.y);
    const velocityAdaptiveFactor = palmSpeed > 0.05 ? 0.25 : Math.min(0.15 + palmSpeed * 2, 0.25);
    
    smoothedPalmX += velocityAdaptiveFactor * (palm.x - smoothedPalmX);
    smoothedPalmY += velocityAdaptiveFactor * (palm.y - smoothedPalmY);
    smoothedPalmZ += velocityAdaptiveFactor * (palm.z - smoothedPalmZ);

    // Emit swipe or regular gesture - SINGLE CALLBACK ONLY
    if (swipeDirection) {
      const swipeSpeedDisplay = (palmSpeed * 100).toFixed(0);
      if (hudEl) hudEl.innerHTML = `<span style="color:#ffd700">→ SWIPE ${swipeDirection}</span> | Speed: ${swipeSpeedDisplay}% | Exp: ${smoothedExpansion.toFixed(1)}`;
      try { callback("SWIPE", smoothedExpansion, smoothedOpenness, swipeDirection); } catch (e) { console.warn(e); }
    } else {
      let gestureEmoji = lastConfirmedGesture === "FIST" ? "✊" : lastConfirmedGesture === "PINCH" ? "🤏" : "🖐️";
      const speedDisplay = (palmSpeed * 100).toFixed(0);
      if (hudEl) hudEl.innerHTML = `Gesture: <b>${gestureEmoji} ${lastConfirmedGesture}</b> | Speed: ${speedDisplay}% | Exp: ${smoothedExpansion.toFixed(1)} | Compress: ${(compressionRatio*100).toFixed(0)}%`;
      const handPos = { 
        x: smoothedPalmX, 
        y: smoothedPalmY, 
        z: smoothedPalmZ, 
        vx: palmVel.x, 
        vy: palmVel.y 
      };
      try { callback(lastConfirmedGesture, smoothedExpansion, smoothedOpenness, undefined, handPos); } catch (e) { console.warn(e); }
    }
  });

  // Fallback: ensure getUserMedia starts the video stream before MediaPipe Camera
  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 }, 
        audio: false 
      });
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play().catch(e => console.error("Video play error:", e));
      };
      if (hudEl) hudEl.innerHTML = `<span style="color:#51cf66">✓ Camera streaming...</span>`;
    } catch (err) {
      console.error("getUserMedia error:", err);
      if (hudEl) hudEl.innerHTML = `<span style="color:#ff6b6b">❌ Camera blocked. Allow in browser settings</span>`;
    }
  };

  const camera = new Camera(video, {
    onFrame: async () => {
      try {
        await hands.send({ image: video });
      } catch (e) {
        console.warn("hands.send error:", e);
      }
    },
    width: 640,
    height: 480
  });

  (async () => {
    await startStream();
    try {
      await camera.start();
      if (hudEl) hudEl.innerHTML = `<span style="color:#51cf66">✓ Ready. Show your hand...</span>`;
    } catch (e) {
      console.error("Camera.start failed:", e);
      if (hudEl) hudEl.innerHTML = `<span style="color:#ff6b6b">❌ Camera failed. Reload page.</span>`;
    }
  })();
}

function distance(a, b) {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  );
}
