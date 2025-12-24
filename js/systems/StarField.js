// ⭐ Star Field System - GPU-Optimized Particle System
// Renders 10,000+ stars with glow, twinkle, and distance fog

class StarFieldSystem {
  constructor(scene, count = 10000) {
    this.scene = scene;
    this.count = count;
    this.stars = null;
    this.geometry = null;
    this.material = null;
    
    this.initialize();
  }
  
  initialize() {
    // Create BufferGeometry for GPU efficiency
    this.geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);
    const twinkleOffsets = new Float32Array(this.count);
    
    // Generate star data
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      
      // Distribute in sphere (galaxy volume)
      const radius = Math.random() * 100 + 50; // 50-150 units from center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Star type determines color
      const starType = Math.random();
      if (starType < 0.6) {
        // White/blue (main sequence)
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 1.0;
      } else if (starType < 0.9) {
        // Yellow/orange (sun-like)
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i3 + 2] = 0.5 + Math.random() * 0.3;
      } else {
        // Red (giants)
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.3 + Math.random() * 0.2;
        colors[i3 + 2] = 0.2;
      }
      
      // Size variation (0.5 - 3.0)
      sizes[i] = 0.5 + Math.random() * 2.5;
      
      // Random twinkle offset for variation
      twinkleOffsets[i] = Math.random() * Math.PI * 2;
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1));
    
    // Custom shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        attribute float twinkleOffset;
        
        varying vec3 vColor;
        varying float vTwinkle;
        
        uniform float time;
        
        void main() {
          vColor = customColor;
          
          // Twinkle animation
          vTwinkle = 0.7 + 0.3 * sin(time * 2.0 + twinkleOffset * 10.0);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * vTwinkle;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        
        void main() {
          // Distance from center of point sprite
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Smooth circular glow
          float alpha = smoothstep(0.5, 0.0, dist);
          
          // Brighter core
          float core = smoothstep(0.25, 0.0, dist) * 0.5;
          
          // Apply twinkle
          float brightness = vTwinkle + core;
          
          gl_FragColor = vec4(vColor * brightness, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create points mesh
    this.stars = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.stars);
  }
  
  update(time) {
    if (this.material && this.material.uniforms) {
      this.material.uniforms.time.value = time;
    }
  }
  
  setQuality(level) {
    // Adjust star count based on performance
    const counts = {
      high: 10000,
      medium: 5000,
      low: 2000
    };
    
    const newCount = counts[level] || 5000;
    
    if (newCount !== this.count) {
      this.dispose();
      this.count = newCount;
      this.initialize();
    }
  }
  
  dispose() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.stars) this.scene.remove(this.stars);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StarFieldSystem;
}
