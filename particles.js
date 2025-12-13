import { heartShape, saturnShape, fireworksShape } from "./shapes.js";

let points, geometry;
let targetPositions = [];
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

  setShape("heart");
}

export function setShape(type) {
  if (type === "heart") targetPositions = heartShape(COUNT);
  if (type === "saturn") targetPositions = saturnShape(COUNT);
  if (type === "fireworks") targetPositions = fireworksShape(COUNT);
}

export function updateParticles() {
  const pos = geometry.attributes.position.array;

  for (let i = 0; i < COUNT; i++) {
    pos[i*3] += (targetPositions[i].x - pos[i*3]) * 0.05;
    pos[i*3+1] += (targetPositions[i].y - pos[i*3+1]) * 0.05;
    pos[i*3+2] += (targetPositions[i].z - pos[i*3+2]) * 0.05;
  }

  geometry.attributes.position.needsUpdate = true;
}
