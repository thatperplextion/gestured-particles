// 🎨 Custom GLSL Shaders for Galaxy Effects

const Shaders = {
  // ===== STAR GLOW SHADER =====
  starGlow: {
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
    `
  },
  
  // ===== NEBULA CLOUD SHADER =====
  nebula: {
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
        vec3 coord = vPosition * 0.5 + vec3(time * 0.05);
        
        // Multi-layer noise for organic cloud look
        float n1 = fbm(coord);
        float n2 = fbm(coord * 2.0 + vec3(time * 0.03));
        
        float noise = n1 * 0.7 + n2 * 0.3;
        
        // Color gradient
        vec3 color = mix(colorStart, colorEnd, noise);
        
        // Soft alpha falloff
        float alpha = noise * opacity * smoothstep(1.0, 0.0, length(vUv - vec2(0.5)) * 2.0);
        
        gl_FragColor = vec4(color, alpha);
      }
    `
  },
  
  // ===== PLANET ATMOSPHERE SHADER =====
  atmosphere: {
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    
    fragmentShader: `
      uniform vec3 atmosphereColor;
      uniform float atmosphereStrength;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vec3 viewDirection = normalize(-vPosition);
        
        // Fresnel effect (glow at edges)
        float fresnel = 1.0 - dot(viewDirection, vNormal);
        fresnel = pow(fresnel, 3.0);
        
        float alpha = fresnel * atmosphereStrength;
        vec3 color = atmosphereColor * fresnel * 2.0;
        
        gl_FragColor = vec4(color, alpha);
      }
    `
  },
  
  // ===== SUN/STAR CORONA SHADER =====
  corona: {
    vertexShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    
    fragmentShader: `
      uniform float time;
      uniform vec3 coronaColor;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        // Pulsing effect
        float pulse = 0.8 + 0.2 * sin(time * 2.0);
        
        // Surface turbulence
        vec2 coord = vUv * 10.0 + vec2(time * 0.2);
        float n = noise(coord) * 0.5 + noise(coord * 2.0) * 0.25;
        
        vec3 color = coronaColor * (1.0 + n * 0.3) * pulse;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  
  // ===== WORMHOLE/BLACK HOLE SHADER =====
  blackHole: {
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
      uniform vec3 centerColor;
      uniform vec3 edgeColor;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vec2 center = vUv - vec2(0.5);
        float dist = length(center);
        
        // Spiral distortion
        float angle = atan(center.y, center.x) + dist * 5.0 + time;
        float spiral = sin(angle * 8.0) * 0.5 + 0.5;
        
        // Radial gradient with spiral
        vec3 color = mix(centerColor, edgeColor, dist + spiral * 0.2);
        
        // Event horizon (pure black center)
        if (dist < 0.15) {
          color = vec3(0.0);
        }
        
        // Accretion disk glow
        float diskGlow = smoothstep(0.4, 0.2, abs(dist - 0.3)) * spiral;
        color += vec3(1.0, 0.6, 0.2) * diskGlow;
        
        float alpha = smoothstep(0.5, 0.0, dist);
        
        gl_FragColor = vec4(color, alpha);
      }
    `
  },
  
  // ===== SUPERNOVA EXPLOSION SHADER =====
  supernova: {
    vertexShader: `
      attribute float delay;
      attribute vec3 velocity;
      
      uniform float time;
      uniform float explosionStart;
      
      varying float vIntensity;
      varying vec3 vColor;
      
      void main() {
        float t = max(0.0, time - explosionStart - delay);
        
        vec3 newPosition = position + velocity * t;
        
        // Fade out over time
        vIntensity = 1.0 - smoothstep(0.0, 3.0, t);
        
        // Color evolution: white -> yellow -> red -> black
        if (t < 0.5) {
          vColor = mix(vec3(1.0), vec3(1.0, 1.0, 0.5), t * 2.0);
        } else if (t < 1.5) {
          vColor = mix(vec3(1.0, 1.0, 0.5), vec3(1.0, 0.3, 0.1), (t - 0.5));
        } else {
          vColor = mix(vec3(1.0, 0.3, 0.1), vec3(0.1, 0.0, 0.0), (t - 1.5) / 1.5);
        }
        
        vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
        gl_PointSize = 50.0 * vIntensity / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    
    fragmentShader: `
      varying float vIntensity;
      varying vec3 vColor;
      
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        float alpha = smoothstep(0.5, 0.0, dist) * vIntensity;
        
        gl_FragColor = vec4(vColor, alpha);
      }
    `
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Shaders;
}
