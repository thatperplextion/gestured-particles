export function initHandTracking(callback) {
  const video = document.getElementById("video");

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
    const middleTip = lm[12];
    const palm = lm[0];
    const wrist = lm[0];
    const middleBase = lm[9];

    const pinchDist = distance(thumbTip, indexTip);
    const openDist = distance(indexTip, palm);
    
    // Hand size (distance from wrist to middle finger base) indicates distance from camera
    const handSize = distance(wrist, middleBase);
    // Map hand size to expansion scale (closer = larger hand = more expansion)
    const expansion = Math.min(Math.max(handSize * 5, 0.5), 3);

    let gesture = "OPEN";
    if (pinchDist < 0.03) gesture = "PINCH";
    else if (openDist < 0.15) gesture = "FIST";

    callback(gesture, expansion);
  });

  const camera = new Camera(video, {
    onFrame: async () => await hands.send({ image: video }),
    width: 640,
    height: 480
  });

  camera.start();
}

function distance(a, b) {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  );
}
