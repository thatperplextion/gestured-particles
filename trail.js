// ✨ Particle Trail Effects - Motion visualization
export class ParticleTrail {
  constructor(particleCount) {
    this.particleCount = particleCount;
    this.trailLength = 8;
    this.enabled = true;
    
    // Store history of particle positions
    this.trails = new Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      this.trails[i] = [];
    }
    
    this.trailGeometry = null;
    this.trailMaterial = null;
    this.trailPoints = null;
  }

  initTrailSystem(scene) {
    // Create line segments for trails
    this.trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * this.trailLength * 3);
    
    this.trailGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    this.trailMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.4,
      linewidth: 1,
      sizeAttenuation: true
    });

    this.trailPoints = new THREE.LineSegments(this.trailGeometry, this.trailMaterial);
    scene.add(this.trailPoints);
  }

  recordPosition(particleIndex, x, y, z) {
    if (!this.enabled || !this.trails[particleIndex]) return;

    this.trails[particleIndex].push({ x, y, z });
    
    if (this.trails[particleIndex].length > this.trailLength) {
      this.trails[particleIndex].shift();
    }
  }

  recordAllPositions(positions, count) {
    if (!this.enabled) return;

    for (let i = 0; i < count; i++) {
      this.recordPosition(i, positions[i*3], positions[i*3+1], positions[i*3+2]);
    }
  }

  updateTrailMesh() {
    if (!this.enabled || !this.trailGeometry) return;

    const positions = this.trailGeometry.attributes.position.array;
    let index = 0;

    for (let i = 0; i < this.particleCount; i++) {
      const trail = this.trails[i];
      
      for (let j = 0; j < trail.length - 1; j++) {
        const p1 = trail[j];
        const p2 = trail[j + 1];

        // Line start
        positions[index++] = p1.x;
        positions[index++] = p1.y;
        positions[index++] = p1.z;

        // Line end
        positions[index++] = p2.x;
        positions[index++] = p2.y;
        positions[index++] = p2.z;
      }

      // Pad remaining positions if trail is shorter than max length
      for (let j = trail.length - 1; j < this.trailLength - 1; j++) {
        positions[index++] = 0;
        positions[index++] = 0;
        positions[index++] = 0;
        positions[index++] = 0;
        positions[index++] = 0;
        positions[index++] = 0;
      }
    }

    this.trailGeometry.attributes.position.needsUpdate = true;
  }

  setTrailLength(length) {
    this.trailLength = length;
    // Clear old trails
    for (let i = 0; i < this.particleCount; i++) {
      this.trails[i] = [];
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.trailPoints) {
      this.trailPoints.visible = enabled;
    }
  }

  setOpacity(opacity) {
    if (this.trailMaterial) {
      this.trailMaterial.opacity = opacity;
    }
  }

  setColor(hex) {
    if (this.trailMaterial) {
      this.trailMaterial.color.setHex(hex);
    }
  }

  clear() {
    for (let i = 0; i < this.particleCount; i++) {
      this.trails[i] = [];
    }
  }
}
