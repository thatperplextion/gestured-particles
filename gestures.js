export function initHandTracking(callback) {
  const video = document.getElementById("video");
  const camStatusEl = document.getElementById("hud-cam");
  const overlay = document.getElementById("overlay");
  const ctx = overlay ? overlay.getContext("2d") : null;

  const hands = new Hands({
    locateFile: file =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
    modelComplexity: 1,
    selfieMode: true
  });

  let firstResultTime = null;
  hands.onResults(results => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

    if (!firstResultTime) {
      firstResultTime = performance.now();
      if (camStatusEl) camStatusEl.textContent = "results";
    }

    const lm = results.multiHandLandmarks[0];

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

    const pinchDistNorm = distance(thumbTip, indexTip) / palmWidth;
    // Use average fingertip-to-palm distance for openness, normalized
    const middleTip = lm[12];
    const ringTip = lm[16];
    const pinkyTip = lm[20];
    const avgOpenNorm = (
      distance(indexTip, palm) +
      distance(middleTip, palm) +
      distance(ringTip, palm) +
      distance(pinkyTip, palm)
    ) / (4 * palmWidth);
    
    // Hand size (distance from wrist to middle finger base) indicates distance from camera
    const handSize = distance(wrist, middleBase);
    // Expansion based on inverse of palmWidth so farther hands still expand
    const distanceScale = 1 / palmWidth; // larger when farther
    const expansionRaw = 0.9 + distanceScale * 0.6; // base + gain
    const expansion = Math.min(Math.max(expansionRaw, 0.7), 3.2);

    // Openness metric normalized 0..1 (higher means more open)
    const openness = Math.max(0, Math.min(1, (avgOpenNorm - 0.15) / 0.35));

    let gesture = "OPEN";
    if (pinchDistNorm < 0.30) gesture = "PINCH"; // normalized threshold
    else if (avgOpenNorm < 0.28) gesture = "FIST"; // normalized threshold
    else if (avgOpenNorm > 0.55) gesture = "OPEN"; // explicitly mark open when wide

    // Swipe detection using wrist horizontal velocity
    // Keep a simple static cache on the function for previous wrist X
    if (!initHandTracking._prevWristX) initHandTracking._prevWristX = wrist.x;
    const vx = wrist.x - initHandTracking._prevWristX; // positive = right to left in image space
    initHandTracking._prevWristX = wrist.x;

    // Threshold for swipe; MediaPipe coords ~0..1 range
    const SWIPE_THRESHOLD = 0.06;
    if (Math.abs(vx) > SWIPE_THRESHOLD) {
      // With selfieMode, image x increases to the right relative to user
      const direction = vx > 0 ? "RIGHT" : "LEFT";
      try { callback("SWIPE", expansion, openness, direction); } catch (e) { console.warn(e); }
      return;
    }

    try { callback(gesture, expansion, openness); } catch (e) { console.warn(e); }
  });

  const camera = new Camera(video, {
    onFrame: async () => {
      try {
        await hands.send({ image: video });
      } catch (e) {
        console.warn("hands.send error", e);
      }
    },
    width: 640,
    height: 480
  });

  try {
    camera.start();
    if (camStatusEl) camStatusEl.textContent = "camera-started";
  } catch (e) {
    console.error("Camera start failed", e);
    if (camStatusEl) camStatusEl.textContent = "camera-error";
  }
}

function distance(a, b) {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  );
}
