import { heartShape, saturnShape, fireworksShape, flowerShape } from "./shapes.js";

let points, geometry;
let targetPositions = [];
let currentExpansion = 1;
let targetExpansion = 1;
const COUNT = 2000;
let material;
let jitterOffsets;
let time = 0;

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
  if (type === "heart") targetPositions = heartShape(COUNT);
  if (type === "saturn") targetPositions = saturnShape(COUNT);
  if (type === "fireworks") targetPositions = fireworksShape(COUNT);
  if (type === "flower") targetPositions = flowerShape(COUNT);
  targetExpansion = expansion;
}

export function setColor(hex) {
  if (!material) return;
  material.color.setHex(hex);
}

export function updateParticles() {
  const pos = geometry.attributes.position.array;

  // Smooth expansion transition
  currentExpansion += (targetExpansion - currentExpansion) * 0.08;
  time += 0.02;

  for (let i = 0; i < COUNT; i++) {
    const targetX = targetPositions[i].x * currentExpansion;
    const targetY = targetPositions[i].y * currentExpansion;
    const targetZ = targetPositions[i].z * currentExpansion;

    // Base morphing
    pos[i*3] += (targetX - pos[i*3]) * 0.05;
    pos[i*3+1] += (targetY - pos[i*3+1]) * 0.05;
    pos[i*3+2] += (targetZ - pos[i*3+2]) * 0.05;

    // Sparkle jitter (subtle) using per-particle offsets animated over time
    const jx = jitterOffsets[i*3] * 0.02 * Math.sin(time + i * 0.001);
    const jy = jitterOffsets[i*3+1] * 0.02 * Math.cos(time + i * 0.001);
    const jz = jitterOffsets[i*3+2] * 0.02 * Math.sin(time * 0.8 + i * 0.001);
    pos[i*3] += jx;
    pos[i*3+1] += jy;
    pos[i*3+2] += jz;
  }

  geometry.attributes.position.needsUpdate = true;
}
