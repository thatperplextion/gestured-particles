// 🪐 Orbital Physics Engine - Simplified Kepler orbits
// Calculates realistic orbital motion for planets and moons

class OrbitalEngine {
  constructor() {
    this.G = 0.1; // Gravitational constant (scaled for visual appeal)
    this.timeScale = 1.0; // Speed up/slow down time
  }
  
  // Calculate orbital velocity for circular orbit
  calculateOrbitalVelocity(centralMass, orbitRadius) {
    return Math.sqrt((this.G * centralMass) / orbitRadius);
  }
  
  // Calculate orbital period (time for one complete orbit)
  calculateOrbitalPeriod(orbitRadius, orbitalVelocity) {
    const circumference = 2 * Math.PI * orbitRadius;
    return circumference / orbitalVelocity;
  }
  
  // Update orbital position
  updateOrbit(body, centralBody, deltaTime) {
    const scaledDelta = deltaTime * this.timeScale;
    
    // Simple circular orbit (Kepler simplified)
    body.orbitAngle += body.orbitalVelocity * scaledDelta;
    
    if (body.orbitAngle > Math.PI * 2) {
      body.orbitAngle -= Math.PI * 2;
    }
    
    // Calculate new position
    const x = centralBody.position.x + Math.cos(body.orbitAngle) * body.orbitRadius;
    const z = centralBody.position.z + Math.sin(body.orbitAngle) * body.orbitRadius;
    const y = centralBody.position.y + body.orbitInclination * Math.sin(body.orbitAngle * 2);
    
    body.position.set(x, y, z);
    
    // Rotate the body on its axis
    if (body.mesh) {
      body.mesh.rotation.y += body.rotationSpeed * scaledDelta;
    }
    
    return body.position;
  }
  
  // Create orbital data for a body
  createOrbitData(orbitRadius, centralMass, inclination = 0, eccentricity = 0) {
    const velocity = this.calculateOrbitalVelocity(centralMass, orbitRadius);
    const period = this.calculateOrbitalPeriod(orbitRadius, velocity);
    
    return {
      orbitRadius,
      orbitInclination: inclination,
      orbitEccentricity: eccentricity,
      orbitalVelocity: velocity,
      orbitalPeriod: period,
      orbitAngle: Math.random() * Math.PI * 2, // Random starting position
      rotationSpeed: Math.random() * 0.02 + 0.01 // Random rotation
    };
  }
  
  // Set time scale (1.0 = normal, 2.0 = 2x faster, 0.5 = half speed)
  setTimeScale(scale) {
    this.timeScale = Math.max(0, Math.min(10, scale));
  }
  
  getTimeScale() {
    return this.timeScale;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrbitalEngine;
}
