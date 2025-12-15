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
let velocities; // per-particle velocity for smooth following
let time = 0;
let motionMode = "pulse"; // pulse | orbit | swirl
let centerOffset = { x: 0, y: 0, z: 0 };
let handVel = { x: 0, y: 0 };
let prevCenterOffset = { x: 0, y: 0, z: 0 };
let prevExpansion = 1;

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
  velocities = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    jitterOffsets[i*3] = (Math.random() - 0.5);
    jitterOffsets[i*3+1] = (Math.random() - 0.5);
    jitterOffsets[i*3+2] = (Math.random() - 0.5);
    velocities[i*3] = 0;
    velocities[i*3+1] = 0;
    velocities[i*3+2] = 0;
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

export function setCenterOffset(normX, normY, normZ = 0) {
  // Convert normalized hand coords (0..1) to scene space: center at (0,0)
  // Map x in [0,1] to [-2.5, 2.5], y in [0,1] to [2.5, -2.5] (invert y)
  const newX = (normX - 0.5) * 5;
  const newY = (0.5 - normY) * 5;
  
  // Smooth velocity computation for smooth hand following
  handVel.x = (newX - centerOffset.x) * 0.7 + handVel.x * 0.3;
  handVel.y = (newY - centerOffset.y) * 0.7 + handVel.y * 0.3;
  
  // Smooth offset transition
  centerOffset.x += (newX - centerOffset.x) * 0.15;
  centerOffset.y += (newY - centerOffset.y) * 0.15;
  centerOffset.z += (normZ * 2 - centerOffset.z) * 0.15;
} handVel.y = newY - centerOffset.y;
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

  // Ultra-smooth expansion transition with increased precision
  const expansionDamp = 0.05; // lower = smoother transitions
  currentExpansion += (targetExpansion - currentExpansion) * expansionDamp;
  time += 0.016; // match ~60fps frame time

  // Adaptive follow gain based on hand velocity + distance independence
  const speed = Math.sqrt(handVel.x * handVel.x + handVel.y * handVel.y);
  const baseFollowGain = 0.12;      // base responsiveness
  const maxFollowGain = 0.22;       // max responsiveness during fast motion
  const followGain = Math.min(baseFollowGain + speed * 0.08, maxFollowGain);
  
  // Distance-invariant damping: ensures smooth motion regardless of hand distance
  const centerOffsetDelta = Math.sqrt(
    (centerOffset.x - prevCenterOffset.x)**2 + 
    (centerOffset.y - prevCenterOffset.y)**2
  );
  const damping = 0.92 - Math.min(centerOffsetDelta * 0.1, 0.15); // higher damping when hand moves fast
  prevCenterOffset = { ...centerOffset };
  prevExpansion = currentExpansion;

  for (let i = 0; i < COUNT; i++) {
    // Continuous shape blending with smooth interpolation
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

    // Physics-based smooth following with per-particle velocity
    const dx = targetX - pos[i*3];
    const dy = targetY - pos[i*3+1];
    const dz = targetZ - pos[i*3+2];

    // Acceleration toward target
    velocities[i*3] += dx * followGain;
    velocities[i*3+1] += dy * followGain;
    velocities[i*3+2] += dz * followGain;

    // Apply damping (friction) to prevent overshoot
    velocities[i*3] *= damping;
    velocities[i*3+1] *= damping;
    velocities[i*3+2] *= damping;

    // Update position
    pos[i*3] += velocities[i*3];
    pos[i*3+1] += velocities[i*3+1];
    pos[i*3+2] += velocities[i*3+2];

    // Subtle shimmer effect (independent of motion mode)
    const shimmer = Math.sin(time * 1.5 + i * 0.0003) * 0.008;
    pos[i*3] += jitterOffsets[i*3] * shimmer;
    pos[i*3+1] += jitterOffsets[i*3+1] * shimmer;
    pos[i*3+2] += jitterOffsets[i*3+2] * shimmer;

    // Motion modes with enhanced smoothness
    if (motionMode === "orbit") {
      // Slow rotation around center
      const rotSpeed = 0.004 + (i % 50) * 0.00008;
      const dx2 = pos[i*3] - centerOffset.x;
      const dz2 = pos[i*3+2] - centerOffset.z;
      const cos_a = Math.cos(rotSpeed);
      const sin_a = Math.sin(rotSpeed);
      pos[i*3] = centerOffset.x + (dx2 * cos_a - dz2 * sin_a);
      pos[i*3+2] = centerOffset.z + (dx2 * sin_a + dz2 * cos_a);
    } else if (motionMode === "swirl") {
      // Smooth vertical swirl independent of hand position
      const swirl = Math.sin(time * 0.8 + i * 0.002) * 0.015;
      pos[i*3+1] += swirl * 0.5; // apply to velocity instead of position
    } else if (motionMode === "pulse") {
      // Gentle breathing pulse
      const pulseMagnitude = 1 + Math.sin(time * 1.2) * 0.035;
      const distFromCenter = Math.sqrt(
        (pos[i*3] - centerOffset.x)**2 + 
        (pos[i*3+1] - centerOffset.y)**2 + 
        (pos[i*3+2] - centerOffset.z)**2
      );
      if (distFromCenter > 0.01) {
        const scale = pulseMagnitude / (distFromCenter + 0.1);
        pos[i*3] = centerOffset.x + (pos[i*3] - centerOffset.x) * scale;
        pos[i*3+1] = centerOffset.y + (pos[i*3+1] - centerOffset.y) * scale;
        pos[i*3+2] = centerOffset.z + (pos[i*3+2] - centerOffset.z) * scale;
      }
    }
  }

  geometry.attributes.position.needsUpdate = true;
}
