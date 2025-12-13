import { initParticles, updateParticles, setShape, setColor, setMotion } from "./particles.js";
import { initHandTracking } from "./gestures.js";

let scene, camera, renderer;
let shapeOrder = ["heart", "flower", "saturn", "fireworks"];
let currentShapeIndex = 0;
const hudGesture = document.getElementById("hud-gesture");
const hudExp = document.getElementById("hud-exp");
const hudOpen = document.getElementById("hud-open");
const hudCam = document.getElementById("hud-cam");
let hudMotionLabel = document.getElementById("hud-motion");

initScene();
initParticles(scene);
initHandTracking((gesture, expansion, openness, direction) => {
  if (hudCam) hudCam.textContent = "running";
  onGesture(gesture, expansion, openness, direction);
});

animate();

function initScene() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
  );
  camera.position.z = 8;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

function animate() {
  requestAnimationFrame(animate);
  updateParticles();
  renderer.render(scene, camera);
}

function onGesture(gesture, expansion, openness, direction) {
  // HUD debug
  if (hudGesture) hudGesture.textContent = gesture || "none";
  if (hudExp) hudExp.textContent = (expansion ?? 1).toFixed(2);
  if (hudOpen) hudOpen.textContent = (openness ?? 0).toFixed(2);
  console.log("Gesture", { gesture, expansion, openness, direction });
  // Map gestures to shapes
  if (gesture === "OPEN") setShape("heart", expansion);
  if (gesture === "FIST") setShape("saturn", expansion);
  if (gesture === "PINCH") setShape("fireworks", expansion);

  // Extra: if openness is high, show flower
  if (openness && openness > 0.7) setShape("flower", expansion);

  // Swipe cycles shapes
  if (gesture === "SWIPE") {
    if (direction === "RIGHT") currentShapeIndex = (currentShapeIndex + 1) % shapeOrder.length;
    else if (direction === "LEFT") currentShapeIndex = (currentShapeIndex - 1 + shapeOrder.length) % shapeOrder.length;
    setShape(shapeOrder[currentShapeIndex], expansion);
  }

  // Map gestures to motion modes for smoother dynamics
  if (gesture === "OPEN") setMotion("pulse");
  if (gesture === "FIST") setMotion("orbit");
  if (gesture === "PINCH") setMotion("swirl");
  if (hudMotionLabel) hudMotionLabel.textContent = `motion: ${gesture === "OPEN" ? "pulse" : gesture === "FIST" ? "orbit" : gesture === "PINCH" ? "swirl" : ""}`;

  // Dynamic color: hue from openness; fallback by gesture
  const colorByGesture = {
    OPEN: 0xff66cc,
    FIST: 0x66ccff,
    PINCH: 0xffcc66
  };
  const hex = openness != null
    ? hsvToHex((openness * 0.8) % 1, 0.8, 1.0)
    : colorByGesture[gesture] || 0xffffff;
  setColor(hex);
}

// Keyboard fallback for testing
window.addEventListener("keydown", (e) => {
  if (e.key === "1") setShape("heart", 1);
  if (e.key === "2") setShape("flower", 1);
  if (e.key === "3") setShape("saturn", 1);
  if (e.key === "4") setShape("fireworks", 1);
  if (e.key === "q") setMotion("pulse");
  if (e.key === "w") setMotion("orbit");
  if (e.key === "e") setMotion("swirl");
});

function hsvToHex(h, s, v) {
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return ((Math.round(r * 255) << 16) |
          (Math.round(g * 255) << 8) |
           Math.round(b * 255)) >>> 0;
}
