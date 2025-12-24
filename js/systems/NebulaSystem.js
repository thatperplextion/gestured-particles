// ☁️ Nebula System - Volumetric Cloud Effects
// Creates beautiful space clouds with layered sprites and shaders

class NebulaSystem {
  constructor(scene) {
    this.scene = scene;
    this.nebulae = [];
  }
  
  // Create nebula cloud
  createNebula(config = {}) {
    const nebula = {
      position: config.position || new THREE.Vector3(20, 5, -30),
      size: config.size || 15,
      colorStart: config.colorStart || new THREE.Color(0x4400ff),
      colorEnd: config.colorEnd || new THREE.Color(0xff0066),
      opacity: config.opacity || 0.4,
      layers: config.layers || 3,
      meshes: []
    };
    
    // Create multiple layered sprites for depth
    for (let i = 0; i < nebula.layers; i++) {
      const layerSize = nebula.size * (1 + i * 0.3);
      const layerOpacity = nebula.opacity / (i + 1);
      
      const geometry = new THREE.PlaneGeometry(layerSize, layerSize, 32, 32);
      
      // Custom shader material
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          colorStart: { value: nebula.colorStart },
          colorEnd: { value: nebula.colorEnd },
          opacity: { value: layerOpacity },
          layerOffset: { value: i * 0.5 }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 colorStart;
          uniform vec3 colorEnd;
          uniform float opacity;
          uniform float layerOffset;
          
          varying vec2 vUv;
          varying vec3 vPosition;
          
          // Simple 3D noise function
          float hash(vec3 p) {
            p = fract(p * 0.3183099 + vec3(0.1));
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }
          
          float noise(vec3 x) {
            vec3 p = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            
            return mix(
              mix(mix(hash(p + vec3(0,0,0)), hash(p + vec3(1,0,0)), f.x),
                  mix(hash(p + vec3(0,1,0)), hash(p + vec3(1,1,0)), f.x), f.y),
              mix(mix(hash(p + vec3(0,0,1)), hash(p + vec3(1,0,1)), f.x),
                  mix(hash(p + vec3(0,1,1)), hash(p + vec3(1,1,1)), f.x), f.y),
              f.z
            );
          }
          
          // Fractal Brownian Motion
          float fbm(vec3 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            
            for(int i = 0; i < 4; i++) {
              value += amplitude * noise(p * frequency);
              frequency *= 2.0;
              amplitude *= 0.5;
            }
            return value;
          }
          
          void main() {
            // Animated noise coordinates
            vec3 coord = vPosition * 0.3 + vec3(time * 0.02 + layerOffset);
            
            // Multi-layer noise for organic cloud look
            float n1 = fbm(coord);
            float n2 = fbm(coord * 2.0 + vec3(time * 0.015));
            
            float noise = n1 * 0.7 + n2 * 0.3;
            
            // Color gradient
            vec3 color = mix(colorStart, colorEnd, noise);
            
            // Soft alpha falloff from center
            float dist = length(vUv - vec2(0.5));
            float alpha = noise * opacity * smoothstep(0.7, 0.0, dist);
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(nebula.position);
      mesh.position.z += i * 2; // Layer depth
      mesh.rotation.x = Math.random() * 0.5 - 0.25;
      mesh.rotation.y = Math.random() * 0.5 - 0.25;
      
      this.scene.add(mesh);
      nebula.meshes.push(mesh);
    }
    
    this.nebulae.push(nebula);
    return nebula;
  }
  
  // Update animation
  update(time) {
    this.nebulae.forEach(nebula => {
      nebula.meshes.forEach((mesh, index) => {
        // Update shader time
        mesh.material.uniforms.time.value = time;
        
        // Slow rotation and drift
        mesh.rotation.z += 0.0001 * (index + 1);
        mesh.position.x += Math.sin(time * 0.1 + index) * 0.001;
        mesh.position.y += Math.cos(time * 0.15 + index) * 0.001;
      });
    });
  }
  
  // Create default nebula set
  createDefaultNebulae() {
    // Purple nebula
    this.createNebula({
      position: new THREE.Vector3(25, 8, -35),
      size: 18,
      colorStart: new THREE.Color(0x4400ff),
      colorEnd: new THREE.Color(0xff0066),
      opacity: 0.35,
      layers: 3
    });
    
    // Blue-cyan nebula
    this.createNebula({
      position: new THREE.Vector3(-30, -5, -40),
      size: 20,
      colorStart: new THREE.Color(0x0044ff),
      colorEnd: new THREE.Color(0x00ffff),
      opacity: 0.3,
      layers: 4
    });
    
    // Green nebula
    this.createNebula({
      position: new THREE.Vector3(15, -10, 25),
      size: 15,
      colorStart: new THREE.Color(0x00ff44),
      colorEnd: new THREE.Color(0x88ff00),
      opacity: 0.25,
      layers: 3
    });
  }
  
  setQuality(level) {
    // Adjust nebula count based on performance
    const targetCounts = {
      high: 5,
      medium: 3,
      low: 1
    };
    
    const targetCount = targetCounts[level] || 3;
    
    while (this.nebulae.length > targetCount) {
      const nebula = this.nebulae.pop();
      nebula.meshes.forEach(mesh => {
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.scene.remove(mesh);
      });
    }
  }
  
  dispose() {
    this.nebulae.forEach(nebula => {
      nebula.meshes.forEach(mesh => {
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.scene.remove(mesh);
      });
    });
    this.nebulae = [];
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NebulaSystem;
}
