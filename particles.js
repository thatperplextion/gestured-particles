import { heartShape, saturnShape, fireworksShape } from "./shapes.js";

let points, geometry;
let targetPositions = [];
let currentExpansion = 1;
let targetExpansion = 1;
const COUNT = 2000;

export function initParticles(scene) {
  geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const material = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xff66cc
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);

  setShape("heart", 1);
}

export function setShape(type, expansion = 1) {
  if (type === "heart") targetPositions = heartShape(COUNT);
  if (type === "saturn") targetPositions = saturnShape(COUNT);
  if (type === "fireworks") targetPositions = fireworksShape(COUNT);
  targetExpansion = expansion;
}

export function updateParticles() {
  const pos = geometry.attributes.position.array;

  // Smooth expansion transition
  currentExpansion += (targetExpansion - currentExpansion) * 0.08;

  for (let i = 0; i < COUNT; i++) {
    const targetX = targetPositions[i].x * currentExpansion;
    const targetY = targetPositions[i].y * currentExpansion;
    const targetZ = targetPositions[i].z * currentExpansion;

    pos[i*3] += (targetX - pos[i*3]) * 0.05;
    pos[i*3+1] += (targetY - pos[i*3+1]) * 0.05;
    pos[i*3+2] += (targetZ - pos[i*3+2]) * 0.05;
  }

  geometry.attributes.position.needsUpdate = true;
}
