import { heartShape, saturnShape, fireworksShape, flowerShape } from "./shapes.js";

let points, geometry;
let targetPositions = [];
let shapeHeart = [];
let shapeSaturn = [];
let shapeFlower = [];
let shapeFireworks = [];
let blend = { heart: 1, saturn: 0, flower: 0, fireworks: 0 };
let currentExpansion = 1;
let targetExpansion = 1;
const COUNT = 2000;
let material;
let jitterOffsets;
let time = 0;
let motionMode = "pulse"; // pulse | orbit | swirl
let centerOffset = { x: 0, y: 0, z: 0 };
let handVel = { x: 0, y: 0 };

export function initParticles(scene) {
  geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  material = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xff66cc
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);

  // Precompute base shapes once for blending
  shapeHeart = heartShape(COUNT);
  shapeSaturn = saturnShape(COUNT);
  shapeFlower = flowerShape(COUNT);
  shapeFireworks = fireworksShape(COUNT);

  setShape("heart", 1);

  // Initialize small per-particle jitter offsets
  jitterOffsets = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    jitterOffsets[i*3] = (Math.random() - 0.5);
    jitterOffsets[i*3+1] = (Math.random() - 0.5);
    jitterOffsets[i*3+2] = (Math.random() - 0.5);
  }
}

export function setShape(type, expansion = 1) {
  if (type === "heart") targetPositions = shapeHeart;
  if (type === "saturn") targetPositions = shapeSaturn;
  if (type === "fireworks") targetPositions = shapeFireworks;
  if (type === "flower") targetPositions = shapeFlower;
  targetExpansion = expansion;
}

export function setColor(hex) {
  if (!material) return;
  material.color.setHex(hex);
}

export function setMotion(mode) {
  motionMode = mode;
}

export function setCenterOffset(normX, normY, normZ = 0) {
  // Convert normalized hand coords (0..1) to scene space: center at (0,0)
  // Map x in [0,1] to [-2, 2], y in [0,1] to [2, -2] (invert y)
  const newX = (normX - 0.5) * 4;
  const newY = (0.5 - normY) * 4;
  handVel.x = newX - centerOffset.x;
  handVel.y = newY - centerOffset.y;
  centerOffset.x = newX;
  centerOffset.y = newY;
  centerOffset.z = normZ * 2;
}

export function setBlendWeights(weights) {
  // weights: {heart, saturn, flower, fireworks} should sum to ~1
  blend = weights;
}

export function updateParticles() {
  const pos = geometry.attributes.position.array;

  // Smooth expansion transition
  currentExpansion += (targetExpansion - currentExpansion) * 0.08;
  time += 0.02;

  // Adaptive follow gain based on hand velocity magnitude
  const speed = Math.sqrt(handVel.x * handVel.x + handVel.y * handVel.y);
  const followGain = Math.min(0.08 + speed * 0.02, 0.18);

  for (let i = 0; i < COUNT; i++) {
    // Continuous shape blending
    const bx = (
      (shapeHeart[i].x * (blend.heart || 0)) +
      (shapeSaturn[i].x * (blend.saturn || 0)) +
      (shapeFlower[i].x * (blend.flower || 0)) +
      (shapeFireworks[i].x * (blend.fireworks || 0))
    );
    const by = (
      (shapeHeart[i].y * (blend.heart || 0)) +
      (shapeSaturn[i].y * (blend.saturn || 0)) +
      (shapeFlower[i].y * (blend.flower || 0)) +
      (shapeFireworks[i].y * (blend.fireworks || 0))
    );
    const bz = (
      (shapeHeart[i].z * (blend.heart || 0)) +
      (shapeSaturn[i].z * (blend.saturn || 0)) +
      (shapeFlower[i].z * (blend.flower || 0)) +
      (shapeFireworks[i].z * (blend.fireworks || 0))
    );

    const targetX = bx * currentExpansion + centerOffset.x;
    const targetY = by * currentExpansion + centerOffset.y;
    const targetZ = bz * currentExpansion + centerOffset.z;

    // Base morphing
    pos[i*3] += (targetX - pos[i*3]) * followGain;
    pos[i*3+1] += (targetY - pos[i*3+1]) * followGain;
    pos[i*3+2] += (targetZ - pos[i*3+2]) * followGain;

    // Sparkle jitter (subtle) using per-particle offsets animated over time
    const jx = jitterOffsets[i*3] * 0.02 * Math.sin(time + i * 0.001);
    const jy = jitterOffsets[i*3+1] * 0.02 * Math.cos(time + i * 0.001);
    const jz = jitterOffsets[i*3+2] * 0.02 * Math.sin(time * 0.8 + i * 0.001);
    pos[i*3] += jx;
    pos[i*3+1] += jy;
    pos[i*3+2] += jz;

    // Motion modes
    if (motionMode === "orbit") {
      const angle = 0.01 + (i % 100) * 0.00002;
      const x = pos[i*3], z = pos[i*3+2];
      pos[i*3] = x * Math.cos(angle) - z * Math.sin(angle);
      pos[i*3+2] = x * Math.sin(angle) + z * Math.cos(angle);
    } else if (motionMode === "swirl") {
      const swirl = Math.sin(time * 0.5 + i * 0.002) * 0.02;
      pos[i*3+1] += swirl;
    } else if (motionMode === "pulse") {
      const pulsescale = 1 + Math.sin(time * 2) * 0.02;
      pos[i*3] *= pulsescale;
      pos[i*3+1] *= pulsescale;
      pos[i*3+2] *= pulsescale;
    }
  }

  geometry.attributes.position.needsUpdate = true;
}
