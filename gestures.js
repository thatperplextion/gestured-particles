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
    if (!results.multiHandLandmarks) return;

    const lm = results.multiHandLandmarks[0];

    const thumbTip = lm[4];
    const indexTip = lm[8];
    const palm = lm[0];

    const pinchDist = distance(thumbTip, indexTip);
    const openDist = distance(indexTip, palm);

    if (pinchDist < 0.03) callback("PINCH");
    else if (openDist < 0.15) callback("FIST");
    else callback("OPEN");
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
