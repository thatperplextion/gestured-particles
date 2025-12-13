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

    const pinchDist = distance(thumbTip, indexTip);
    // Use average fingertip-to-palm distance for openness for robustness
    const middleTip = lm[12];
    const ringTip = lm[16];
    const pinkyTip = lm[20];
    const avgOpen = (
      distance(indexTip, palm) +
      distance(middleTip, palm) +
      distance(ringTip, palm) +
      distance(pinkyTip, palm)
    ) / 4;
    
    // Hand size (distance from wrist to middle finger base) indicates distance from camera
    const handSize = distance(wrist, middleBase);
    // Map hand size to expansion scale (closer = larger hand = more expansion)
    const expansion = Math.min(Math.max(handSize * 6, 0.6), 3.5);

    // Openness metric normalized 0..1 (higher means more open)
    const openness = Math.max(0, Math.min(1, (avgOpen - 0.05) / 0.25));

    let gesture = "OPEN";
    if (pinchDist < 0.035) gesture = "PINCH";
    else if (avgOpen < 0.12) gesture = "FIST";

    // Swipe detection using wrist horizontal velocity
    // Keep a simple static cache on the function for previous wrist X
    if (!initHandTracking._prevWristX) initHandTracking._prevWristX = wrist.x;
    const vx = wrist.x - initHandTracking._prevWristX; // positive = right to left in image space
    initHandTracking._prevWristX = wrist.x;

    // Threshold for swipe; MediaPipe coords ~0..1 range
    const SWIPE_THRESHOLD = 0.06;
    if (Math.abs(vx) > SWIPE_THRESHOLD) {
      const direction = vx > 0 ? "LEFT" : "RIGHT";
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
