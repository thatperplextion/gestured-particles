// 🎥 Cinematic Camera Controller - Smooth transitions and multiple modes
// Handles camera movement, focus, zoom, and easing

class CinematicCamera {
  constructor(scene, aspectRatio) {
    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 2000);
    this.camera.position.set(0, 5, 15);
    
    this.currentPosition = new THREE.Vector3(0, 5, 15);
    this.targetPosition = new THREE.Vector3(0, 5, 15);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);
    this.targetLookAt = new THREE.Vector3(0, 0, 0);
    
    this.mode = 'free'; // 'free', 'focused', 'orbit', 'immersive', 'overview'
    this.transitions = [];
    this.shakeOffset = new THREE.Vector3();
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    
    // Orbit parameters
    this.orbitRadius = 15;
    this.orbitAngle = 0;
    this.orbitSpeed = 0.001;
    this.orbitHeight = 5;
    
    // Default positions for each mode
    this.defaultPositions = {
      free: new THREE.Vector3(0, 5, 15),
      immersive: new THREE.Vector3(0, 2, 8),
      overview: new THREE.Vector3(0, 20, 30)
    };
    
    this.zoomLevel = 1.0;
    this.minZoom = 0.5;
    this.maxZoom = 3.0;
  }
  
  // Update camera each frame
  update(deltaTime) {
    // Process active transitions
    this.updateTransitions(deltaTime);
    
    // Handle shake effect
    if (this.shakeTimer > 0) {
      this.updateShake(deltaTime);
    }
    
    // Mode-specific updates
    if (this.mode === 'orbit') {
      this.updateOrbit(deltaTime);
    }
    
    // Smooth interpolation to target
    const smoothing = 0.05;
    this.currentPosition.lerp(this.targetPosition, smoothing);
    this.currentLookAt.lerp(this.targetLookAt, smoothing);
    
    // Apply shake offset
    const finalPosition = this.currentPosition.clone().add(this.shakeOffset);
    this.camera.position.copy(finalPosition);
    this.camera.lookAt(this.currentLookAt);
  }
  
  // ===== MODE TRANSITIONS =====
  
  enterFreeMode(duration = 1.0) {
    this.mode = 'free';
    this.transitionTo(this.defaultPositions.free, new THREE.Vector3(0, 0, 0), duration);
  }
  
  enterImmersiveMode(duration = 1.5) {
    this.mode = 'immersive';
    this.transitionTo(this.defaultPositions.immersive, new THREE.Vector3(0, 0, 0), duration, 'easeInOutCubic');
  }
  
  enterOverviewMode(duration = 1.5) {
    this.mode = 'overview';
    this.transitionTo(this.defaultPositions.overview, new THREE.Vector3(0, 0, 0), duration, 'easeOutQuad');
  }
  
  enterOrbitMode(target, duration = 1.0) {
    this.mode = 'orbit';
    this.targetLookAt.copy(target);
    this.orbitAngle = 0;
    
    // Position camera on orbit circle
    const orbitPos = this.calculateOrbitPosition();
    this.transitionTo(orbitPos, target, duration);
  }
  
  // ===== FOCUS & TRACKING =====
  
  focusOnPlanet(planet, duration = 2.0) {
    this.mode = 'focused';
    
    // Calculate camera position relative to planet
    const planetPos = planet.position.clone();
    const offset = new THREE.Vector3(
      planet.radius * 3,
      planet.radius * 2,
      planet.radius * 4
    );
    
    const cameraPos = planetPos.clone().add(offset);
    
    this.transitionTo(cameraPos, planetPos, duration, 'easeInOutBack');
  }
  
  trackObject(object, distance = 10) {
    const objectPos = object.position.clone();
    const direction = this.camera.position.clone().sub(objectPos).normalize();
    const targetPos = objectPos.clone().add(direction.multiplyScalar(distance));
    
    this.targetPosition.copy(targetPos);
    this.targetLookAt.copy(objectPos);
  }
  
  // ===== ZOOM =====
  
  zoom(factor) {
    this.zoomLevel *= factor;
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel));
    
    // Move camera closer/farther from look-at point
    const direction = this.camera.position.clone().sub(this.currentLookAt);
    this.targetPosition = this.currentLookAt.clone().add(direction.multiplyScalar(1 / factor));
  }
  
  setZoom(level, smooth = true) {
    level = Math.max(this.minZoom, Math.min(this.maxZoom, level));
    
    if (smooth) {
      this.zoomLevel = level;
    } else {
      const direction = this.camera.position.clone().sub(this.currentLookAt);
      const baseDistance = direction.length();
      const newDistance = baseDistance / level;
      this.targetPosition = this.currentLookAt.clone().add(direction.normalize().multiplyScalar(newDistance));
    }
  }
  
  // ===== TRANSITIONS =====
  
  transitionTo(position, lookAt, duration, easingType = 'easeInOutCubic') {
    const transition = {
      startPosition: this.currentPosition.clone(),
      endPosition: position.clone(),
      startLookAt: this.currentLookAt.clone(),
      endLookAt: lookAt.clone(),
      duration,
      elapsed: 0,
      easingType,
      active: true
    };
    
    // Clear old transitions
    this.transitions = [transition];
  }
  
  updateTransitions(deltaTime) {
    this.transitions = this.transitions.filter(t => t.active);
    
    if (this.transitions.length === 0) return;
    
    const transition = this.transitions[0];
    transition.elapsed += deltaTime;
    
    const progress = Math.min(1, transition.elapsed / transition.duration);
    const easedProgress = this.applyEasing(progress, transition.easingType);
    
    // Interpolate position and look-at
    this.targetPosition.lerpVectors(transition.startPosition, transition.endPosition, easedProgress);
    this.targetLookAt.lerpVectors(transition.startLookAt, transition.endLookAt, easedProgress);
    
    // Complete transition
    if (progress >= 1) {
      transition.active = false;
      this.targetPosition.copy(transition.endPosition);
      this.targetLookAt.copy(transition.endLookAt);
    }
  }
  
  // ===== ORBIT MODE =====
  
  updateOrbit(deltaTime) {
    this.orbitAngle += this.orbitSpeed;
    
    const orbitPos = this.calculateOrbitPosition();
    this.targetPosition.copy(orbitPos);
  }
  
  calculateOrbitPosition() {
    return new THREE.Vector3(
      Math.cos(this.orbitAngle) * this.orbitRadius,
      this.orbitHeight,
      Math.sin(this.orbitAngle) * this.orbitRadius
    );
  }
  
  setOrbitSpeed(speed) {
    this.orbitSpeed = speed;
  }
  
  // ===== SHAKE EFFECT =====
  
  shake(intensity = 0.5, duration = 0.5) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }
  
  updateShake(deltaTime) {
    this.shakeTimer -= deltaTime;
    
    if (this.shakeTimer <= 0) {
      this.shakeOffset.set(0, 0, 0);
      this.shakeIntensity = 0;
      return;
    }
    
    // Decay intensity
    const progress = this.shakeTimer / this.shakeDuration;
    const currentIntensity = this.shakeIntensity * progress;
    
    // Random shake offset
    this.shakeOffset.set(
      (Math.random() - 0.5) * currentIntensity,
      (Math.random() - 0.5) * currentIntensity,
      (Math.random() - 0.5) * currentIntensity
    );
  }
  
  // ===== EASING FUNCTIONS =====
  
  applyEasing(t, type) {
    switch (type) {
      case 'easeInOutCubic':
        return t < 0.5 
          ? 4 * t * t * t 
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      case 'easeOutQuad':
        return 1 - (1 - t) * (1 - t);
      
      case 'easeInOutQuad':
        return t < 0.5 
          ? 2 * t * t 
          : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      case 'easeOutElastic':
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 
          : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      
      case 'easeInOutBack':
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
          ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
          : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
      
      default:
        return t; // Linear
    }
  }
  
  // ===== UTILITY =====
  
  resetToDefault(duration = 1.0) {
    this.enterFreeMode(duration);
  }
  
  getPosition() {
    return this.camera.position.clone();
  }
  
  getLookAt() {
    return this.currentLookAt.clone();
  }
  
  getMode() {
    return this.mode;
  }
  
  setPosition(x, y, z) {
    this.currentPosition.set(x, y, z);
    this.targetPosition.set(x, y, z);
    this.camera.position.set(x, y, z);
  }
  
  setLookAt(x, y, z) {
    this.currentLookAt.set(x, y, z);
    this.targetLookAt.set(x, y, z);
    this.camera.lookAt(x, y, z);
  }
  
  handleResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  
  getCamera() {
    return this.camera;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CinematicCamera;
}
