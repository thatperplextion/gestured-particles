export function initHandTracking(callback) {
  const video = document.getElementById("video");
  const camStatusEl = document.getElementById("hud-cam");

  const hands = new Hands({
    locateFile: file =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults(results => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

    const lm = results.multiHandLandmarks[0];

    const thumbTip = lm[4];
    const indexTip = lm[8];
    const palm = lm[0];
    const wrist = lm[0];
    const middleBase = lm[9];

    const pinchDist = distance(thumbTip, indexTip);
    const openDist = distance(indexTip, palm);
    
    // Hand size (distance from wrist to middle finger base) indicates distance from camera
    const handSize = distance(wrist, middleBase);
    // Map hand size to expansion scale (closer = larger hand = more expansion)
    const expansion = Math.min(Math.max(handSize * 5, 0.5), 3);

    // Openness metric normalized 0..1 (higher means more open)
    const openness = Math.max(0, Math.min(1, (openDist - 0.05) / 0.25));

    let gesture = "OPEN";
    if (pinchDist < 0.03) gesture = "PINCH";
    else if (openDist < 0.15) gesture = "FIST";

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
