// 🔢 Math Utilities - Vector helpers and easing functions

const MathUtils = {
  // Linear interpolation
  lerp(start, end, t) {
    return start + (end - start) * t;
  },
  
  // Smooth damping (exponential decay)
  damp(current, target, smoothing, deltaTime) {
    return this.lerp(current, target, 1 - Math.pow(smoothing, deltaTime));
  },
  
  // Vector3 lerp
  lerpVector3(v1, v2, t) {
    return {
      x: this.lerp(v1.x, v2.x, t),
      y: this.lerp(v1.y, v2.y, t),
      z: this.lerp(v1.z, v2.z, t)
    };
  },
  
  // Distance between two 2D points
  distance2D(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  },
  
  // Distance between two 3D points
  distance3D(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },
  
  // Clamp value between min and max
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },
  
  // Map value from one range to another
  map(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
  },
  
  // Easing functions
  easing: {
    easeInOutCubic(t) {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    
    easeOutQuad(t) {
      return 1 - (1 - t) * (1 - t);
    },
    
    easeInOutQuad(t) {
      return t < 0.5 
        ? 2 * t * t 
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },
    
    easeOutElastic(t) {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    
    easeInOutBack(t) {
      const c1 = 1.70158;
      const c2 = c1 * 1.525;
      return t < 0.5
        ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    }
  },
  
  // Simple noise function (for procedural generation)
  noise(x, y = 0, z = 0) {
    // Simple pseudo-random noise
    const p = x * 12.9898 + y * 78.233 + z * 37.719;
    return Math.abs(Math.sin(p) * 43758.5453) % 1;
  },
  
  // Smooth noise with interpolation
  smoothNoise(x, y, z, scale = 1) {
    x *= scale;
    y *= scale;
    z *= scale;
    
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    
    const xf = x - xi;
    const yf = y - yi;
    const zf = z - zi;
    
    // Sample corners
    const n000 = this.noise(xi, yi, zi);
    const n100 = this.noise(xi + 1, yi, zi);
    const n010 = this.noise(xi, yi + 1, zi);
    const n110 = this.noise(xi + 1, yi + 1, zi);
    const n001 = this.noise(xi, yi, zi + 1);
    const n101 = this.noise(xi + 1, yi, zi + 1);
    const n011 = this.noise(xi, yi + 1, zi + 1);
    const n111 = this.noise(xi + 1, yi + 1, zi + 1);
    
    // Trilinear interpolation
    const nx00 = this.lerp(n000, n100, xf);
    const nx10 = this.lerp(n010, n110, xf);
    const nx01 = this.lerp(n001, n101, xf);
    const nx11 = this.lerp(n011, n111, xf);
    
    const nxy0 = this.lerp(nx00, nx10, yf);
    const nxy1 = this.lerp(nx01, nx11, yf);
    
    return this.lerp(nxy0, nxy1, zf);
  },
  
  // Random point in sphere
  randomInSphere(radius) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = Math.cbrt(Math.random()) * radius;
    
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi)
    };
  },
  
  // Random point on sphere surface
  randomOnSphere(radius) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi)
    };
  },
  
  // Angle between two vectors
  angleBetween(v1, v2) {
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    return Math.acos(dot / (len1 * len2));
  },
  
  // Normalize vector
  normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len === 0) return { x: 0, y: 0, z: 0 };
    return {
      x: v.x / len,
      y: v.y / len,
      z: v.z / len
    };
  },
  
  // Cross product
  cross(v1, v2) {
    return {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x
    };
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathUtils;
}
