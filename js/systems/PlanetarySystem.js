// 🪐 Planetary System - Planets with moons and orbital mechanics
// Creates realistic solar systems with multiple planets

class PlanetarySystem {
  constructor(scene, orbitalEngine) {
    this.scene = scene;
    this.orbitalEngine = orbitalEngine;
    this.planets = [];
    this.centralStar = null;
    
    this.selectedPlanet = null;
    this.highlightedPlanet = null;
  }
  
  // Create central star
  createCentralStar(config = {}) {
    const radius = config.radius || 3;
    const color = config.color || 0xffaa00;
    
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1
    });
    
    this.centralStar = new THREE.Mesh(geometry, material);
    this.centralStar.position.set(0, 0, 0);
    this.scene.add(this.centralStar);
    
    // Add glow
    const glowGeometry = new THREE.SphereGeometry(radius * 1.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.centralStar.add(glow);
    
    return this.centralStar;
  }
  
  // Add planet to system
  addPlanet(config) {
    const planet = {
      name: config.name || `Planet ${this.planets.length + 1}`,
      radius: config.radius || 0.5,
      orbitRadius: config.orbitRadius || 10,
      color: config.color || 0x4488ff,
      moons: [],
      mesh: null,
      position: new THREE.Vector3(),
      selected: false,
      highlighted: false
    };
    
    // Create planet mesh
    const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: planet.color,
      emissive: planet.color,
      emissiveIntensity: 0.1,
      shininess: 30
    });
    
    planet.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(planet.mesh);
    
    // Create orbit path (optional visualization)
    if (config.showOrbit !== false) {
      const orbitGeometry = new THREE.RingGeometry(
        planet.orbitRadius - 0.05,
        planet.orbitRadius + 0.05,
        64
      );
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
      });
      const orbitRing = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbitRing.rotation.x = Math.PI / 2;
      this.scene.add(orbitRing);
      planet.orbitRing = orbitRing;
    }
    
    // Initialize orbital data
    Object.assign(planet, this.orbitalEngine.createOrbitData(
      planet.orbitRadius,
      100, // Central mass
      config.inclination || 0,
      0
    ));
    
    // Add moons if specified
    if (config.moons) {
      config.moons.forEach(moonConfig => {
        this.addMoon(planet, moonConfig);
      });
    }
    
    this.planets.push(planet);
    return planet;
  }
  
  // Add moon to planet
  addMoon(planet, config) {
    const moon = {
      name: config.name || `Moon ${planet.moons.length + 1}`,
      radius: config.radius || 0.15,
      orbitRadius: config.orbitRadius || 2,
      color: config.color || 0xcccccc,
      mesh: null,
      position: new THREE.Vector3()
    };
    
    // Create moon mesh
    const geometry = new THREE.SphereGeometry(moon.radius, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: moon.color,
      emissive: moon.color,
      emissiveIntensity: 0.05
    });
    
    moon.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(moon.mesh);
    
    // Initialize orbital data (around planet)
    Object.assign(moon, this.orbitalEngine.createOrbitData(
      moon.orbitRadius,
      planet.radius * 100, // Planet mass
      0,
      0
    ));
    
    planet.moons.push(moon);
    return moon;
  }
  
  // Update all orbital positions
  update(deltaTime) {
    // Update planets
    this.planets.forEach(planet => {
      // Update planet orbit around star
      this.orbitalEngine.updateOrbit(planet, this.centralStar, deltaTime);
      
      // Update moons around planet
      planet.moons.forEach(moon => {
        this.orbitalEngine.updateOrbit(moon, planet, deltaTime);
      });
    });
  }
  
  // Select planet (for focus)
  selectPlanet(planet) {
    if (this.selectedPlanet) {
      this.deselectPlanet(this.selectedPlanet);
    }
    
    this.selectedPlanet = planet;
    planet.selected = true;
    
    // Add selection indicator
    if (!planet.selectionRing) {
      const ringGeometry = new THREE.RingGeometry(
        planet.radius * 1.5,
        planet.radius * 1.6,
        32
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      planet.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
      planet.selectionRing.rotation.x = Math.PI / 2;
      planet.mesh.add(planet.selectionRing);
    }
    
    planet.selectionRing.visible = true;
  }
  
  // Deselect planet
  deselectPlanet(planet) {
    planet.selected = false;
    if (planet.selectionRing) {
      planet.selectionRing.visible = false;
    }
    this.selectedPlanet = null;
  }
  
  // Highlight planet (hover effect)
  highlightObject(object) {
    // Remove previous highlight
    if (this.highlightedPlanet && this.highlightedPlanet !== object) {
      this.highlightedPlanet.mesh.material.emissiveIntensity = 0.1;
    }
    
    if (object && object.mesh) {
      object.mesh.material.emissiveIntensity = 0.3;
      this.highlightedPlanet = object;
    }
  }
  
  // Raycast to find planet under cursor
  raycastPlanets(screenPosition) {
    // This would use Three.js Raycaster
    // Simplified for now - actual implementation in integration
    return null;
  }
  
  // Get all planets
  getPlanets() {
    return this.planets;
  }
  
  // Get planet by index
  getPlanetIndex(planet) {
    return this.planets.indexOf(planet);
  }
  
  // Create default solar system
  createDefaultSystem() {
    // Central star
    this.createCentralStar({ radius: 3, color: 0xffdd44 });
    
    // Planet 1: Rocky (Mercury-like)
    this.addPlanet({
      name: 'Mercuria',
      radius: 0.4,
      orbitRadius: 8,
      color: 0xaa8866,
      inclination: 0.1
    });
    
    // Planet 2: Earth-like with moon
    this.addPlanet({
      name: 'Terra',
      radius: 0.8,
      orbitRadius: 12,
      color: 0x4488ff,
      moons: [
        { name: 'Luna', radius: 0.2, orbitRadius: 1.5, color: 0xcccccc }
      ]
    });
    
    // Planet 3: Gas giant with 2 moons
    this.addPlanet({
      name: 'Gigantus',
      radius: 1.5,
      orbitRadius: 18,
      color: 0xffaa44,
      inclination: 0.2,
      moons: [
        { name: 'Titan', radius: 0.3, orbitRadius: 2.5, color: 0xffcc88 },
        { name: 'Io', radius: 0.25, orbitRadius: 3.5, color: 0xff8844 }
      ]
    });
    
    // Planet 4: Ice planet
    this.addPlanet({
      name: 'Glacius',
      radius: 1.0,
      orbitRadius: 24,
      color: 0x88ccff,
      inclination: 0.3,
      moons: [
        { name: 'Frost', radius: 0.2, orbitRadius: 2, color: 0xccffff }
      ]
    });
    
    // Planet 5: Outer rocky
    this.addPlanet({
      name: 'Outerra',
      radius: 0.6,
      orbitRadius: 30,
      color: 0xcc4444,
      inclination: 0.15
    });
  }
  
  dispose() {
    this.planets.forEach(planet => {
      if (planet.mesh) {
        planet.mesh.geometry.dispose();
        planet.mesh.material.dispose();
        this.scene.remove(planet.mesh);
      }
      if (planet.orbitRing) {
        planet.orbitRing.geometry.dispose();
        planet.orbitRing.material.dispose();
        this.scene.remove(planet.orbitRing);
      }
      planet.moons.forEach(moon => {
        if (moon.mesh) {
          moon.mesh.geometry.dispose();
          moon.mesh.material.dispose();
          this.scene.remove(moon.mesh);
        }
      });
    });
    
    if (this.centralStar) {
      this.centralStar.geometry.dispose();
      this.centralStar.material.dispose();
      this.scene.remove(this.centralStar);
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlanetarySystem;
}
