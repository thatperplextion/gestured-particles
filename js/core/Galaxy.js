// 🌌 Galaxy Core Manager - Orchestrates all systems
// Main controller that brings everything together

class Galaxy {
  constructor() {
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    
    // Systems
    this.starField = null;
    this.planetarySystem = null;
    this.nebulaSystem = null;
    this.orbitalEngine = null;
    this.performanceManager = null;
    this.gestureDetector = null;
    this.actionRouter = null;
    
    // State
    this.expansion = 1.0;
    this.targetExpansion = 1.0;
    this.rotationSpeed = 0.002;
    this.rotationOffset = 0;
    this.handInfluence = { x: 0, y: 0, z: 0 };
    
    this.time = 0;
    this.paused = false;
    
    // Raycaster for selection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }
  
  // Initialize all systems
  async initialize(canvas) {
    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000008);
    this.scene.fog = new THREE.FogExp2(0x000008, 0.002);
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Setup camera (will be replaced by CinematicCamera)
    this.camera = new CinematicCamera(
      this.scene,
      window.innerWidth / window.innerHeight
    );
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
    
    // Initialize systems
    this.performanceManager = new PerformanceManager();
    this.orbitalEngine = new OrbitalEngine();
    
    // Star field
    this.starField = new StarFieldSystem(this.scene, 10000);
    
    // Planetary system
    this.planetarySystem = new PlanetarySystem(this.scene, this.orbitalEngine);
    this.planetarySystem.createDefaultSystem();
    
    // Nebula system
    this.nebulaSystem = new NebulaSystem(this.scene);
    this.nebulaSystem.createDefaultNebulae();
    
    // Gesture detection
    this.gestureDetector = new GestureDetector();
    this.actionRouter = new ActionRouter(this, this.camera);
    
    // Setup performance monitoring
    this.performanceManager.onQualityChange((level, settings) => {
      this.applyQualitySettings(level, settings);
    });
    
    console.log('🌌 Galaxy initialized');
    
    return this;
  }
  
  // Main update loop
  update(deltaTime) {
    if (this.paused) return;
    
    this.time += deltaTime;
    
    // Update performance tracking
    this.performanceManager.update(deltaTime);
    
    // Update camera
    this.camera.update(deltaTime);
    
    // Update star field
    this.starField.update(this.time);
    
    // Update planetary system
    this.planetarySystem.update(deltaTime);
    
    // Update nebulae
    this.nebulaSystem.update(this.time);
    
    // Update action router
    if (this.actionRouter) {
      this.actionRouter.update(deltaTime);
    }
    
    // Smooth expansion
    this.expansion += (this.targetExpansion - this.expansion) * 0.02;
  }
  
  // Render scene
  render() {
    this.renderer.render(this.scene, this.camera.getCamera());
  }
  
  // Handle gesture updates
  onGestureUpdate(results) {
    if (!this.gestureDetector) return;
    
    const gestures = this.gestureDetector.update(results, 0.016);
    const gestureInfo = this.gestureDetector.getGestureInfo();
    
    if (this.actionRouter && gestureInfo.gesture) {
      this.actionRouter.route(gestureInfo);
    }
    
    return gestureInfo;
  }
  
  // ===== CONTROL METHODS =====
  
  setExpansion(value, smoothing = 0.5) {
    this.targetExpansion = Math.max(0.3, Math.min(3.0, value));
  }
  
  setRotationSpeed(speed) {
    this.rotationSpeed = speed;
  }
  
  addRotationOffset(offset) {
    this.rotationOffset += offset;
  }
  
  resetRotationOffset() {
    this.rotationOffset = 0;
  }
  
  setHandInfluence(hand, strength) {
    // Update hand influence on galaxy center
    this.handInfluence.x += (hand.x - this.handInfluence.x) * strength;
    this.handInfluence.y += (hand.y - this.handInfluence.y) * strength;
  }
  
  // ===== PLANET INTERACTION =====
  
  selectPlanet(planet) {
    this.planetarySystem.selectPlanet(planet);
  }
  
  deselectPlanet(planet) {
    this.planetarySystem.deselectPlanet(planet);
  }
  
  highlightObject(object) {
    this.planetarySystem.highlightObject(object);
  }
  
  getPlanets() {
    return this.planetarySystem.getPlanets();
  }
  
  getPlanetIndex(planet) {
    return this.planetarySystem.getPlanetIndex(planet);
  }
  
  // Raycast to find planets
  raycastPlanets(screenPosition) {
    this.mouse.x = screenPosition.x * 2 - 1;
    this.mouse.y = -(screenPosition.y * 2 - 1);
    
    this.raycaster.setFromCamera(this.mouse, this.camera.getCamera());
    
    const planets = this.planetarySystem.getPlanets();
    const meshes = planets.map(p => p.mesh).filter(Boolean);
    
    const intersects = this.raycaster.intersectObjects(meshes);
    
    if (intersects.length > 0) {
      // Find which planet was hit
      return planets.find(p => p.mesh === intersects[0].object);
    }
    
    return null;
  }
  
  raycastAll(direction) {
    // Raycast for all objects (stars, planets, etc.)
    this.raycaster.setFromCamera(direction, this.camera.getCamera());
    
    const allObjects = [
      ...this.planetarySystem.getPlanets().map(p => p.mesh).filter(Boolean)
    ];
    
    const intersects = this.raycaster.intersectObjects(allObjects);
    return intersects.length > 0 ? intersects[0].object : null;
  }
  
  // ===== SPECIAL EFFECTS =====
  
  triggerSupernova(position, intensity) {
    console.log('💥 Supernova triggered at', position, 'intensity:', intensity);
    
    // Create explosion particles (simplified)
    const particleCount = Math.floor(intensity * 500);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;
      
      // Random outward velocities
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 5 + Math.random() * 10;
      
      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i3 + 2] = Math.cos(phi) * speed;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.5,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    
    // Animate and remove after 3 seconds
    setTimeout(() => {
      this.scene.remove(particles);
      geometry.dispose();
      material.dispose();
    }, 3000);
  }
  
  // Drag mode (simplified - full implementation would be more complex)
  enableDragMode(target) {
    console.log('🖐️ Drag mode enabled for', target.name);
  }
  
  disableDragMode() {
    console.log('🖐️ Drag mode disabled');
  }
  
  updateDrag(deltaTime) {
    // Update drag physics (spring-based)
  }
  
  // ===== QUALITY SETTINGS =====
  
  applyQualitySettings(level, settings) {
    console.log(`📊 Quality: ${level}`, settings);
    
    if (this.starField) {
      this.starField.setQuality(level);
    }
    
    if (this.nebulaSystem) {
      this.nebulaSystem.setQuality(level);
    }
  }
  
  // ===== UTILITY =====
  
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.handleResize(width, height);
    this.renderer.setSize(width, height);
  }
  
  pause() {
    this.paused = true;
  }
  
  resume() {
    this.paused = false;
  }
  
  getStats() {
    return {
      ...this.performanceManager.getStats(),
      expansion: this.expansion.toFixed(2),
      planets: this.planetarySystem.getPlanets().length,
      time: this.time.toFixed(2)
    };
  }
  
  dispose() {
    if (this.starField) this.starField.dispose();
    if (this.planetarySystem) this.planetarySystem.dispose();
    if (this.nebulaSystem) this.nebulaSystem.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Galaxy;
}
