// 🎯 Action Router - Maps Gestures to Galaxy Actions
// Translates detected gestures into specific actions for the galaxy system

class ActionRouter {
  constructor(galaxy, camera) {
    this.galaxy = galaxy;
    this.camera = camera;
    
    this.actionHandlers = {
      // Single-hand actions
      'OPEN_PALM': this.handleOpenPalm.bind(this),
      'FIST': this.handleFist.bind(this),
      'PINCH': this.handlePinch.bind(this),
      'POINTING': this.handlePointing.bind(this),
      'THUMBS_UP': this.handleThumbsUp.bind(this),
      'THUMBS_DOWN': this.handleThumbsDown.bind(this),
      'SWIPE': this.handleSwipe.bind(this),
      'PEACE': this.handlePeace.bind(this),
      
      // Two-hand actions
      'PINCH_OUT': this.handlePinchOut.bind(this),
      'PINCH_IN': this.handlePinchIn.bind(this),
      'CLAP': this.handleClap.bind(this),
      'PARALLEL_ROTATE': this.handleParallelRotate.bind(this),
      'TWO_OPEN_PALMS': this.handleTwoOpenPalms.bind(this),
      'TWO_FISTS': this.handleTwoFists.bind(this)
    };
    
    this.state = {
      selectedPlanet: null,
      cameraMode: 'free', // 'free', 'focused', 'orbit', 'immersive'
      galaxyExpansion: 1.0,
      rotationSpeed: 1.0,
      isDragging: false,
      dragTarget: null
    };
    
    this.transitionDuration = 1.5; // seconds
  }
  
  // Route gesture to appropriate handler
  route(gestureInfo) {
    const { gesture, confidence, data } = gestureInfo;
    
    if (!gesture || confidence < 0.5) return;
    
    const handler = this.actionHandlers[gesture];
    if (handler) {
      handler(data, confidence);
    }
  }
  
  // ===== SINGLE-HAND HANDLERS =====
  
  handleOpenPalm(data, confidence) {
    // Stable galaxy, slow rotation
    this.galaxy.setExpansion(1.5, 0.5); // Expanded, smooth transition
    this.galaxy.setRotationSpeed(0.002); // Slow
    
    // Allow hand position to move galaxy center
    if (data && data.hand) {
      // Galaxy follows hand gently
      this.galaxy.setHandInfluence(data.hand, 0.3);
    }
  }
  
  handleFist(data, confidence) {
    // Contracted galaxy, fast rotation
    this.galaxy.setExpansion(0.3, 0.3); // Tight, faster transition
    this.galaxy.setRotationSpeed(0.008); // Fast spinning
    
    // Check if fist is held on a planet (drag mode)
    if (this.state.selectedPlanet && !this.state.isDragging) {
      this.state.isDragging = true;
      this.state.dragTarget = this.state.selectedPlanet;
      this.galaxy.enableDragMode(this.state.dragTarget);
    }
  }
  
  handlePinch(data, confidence) {
    // Select object under pinch point
    const { position, strength } = data;
    
    // Raycast to find planet
    const intersectedPlanet = this.galaxy.raycastPlanets(position);
    
    if (intersectedPlanet) {
      if (!this.state.selectedPlanet || this.state.selectedPlanet !== intersectedPlanet) {
        // New selection
        this.selectPlanet(intersectedPlanet);
      }
      
      // Hold pinch for 2 seconds to show details
      if (strength > 0.9) {
        this.showPlanetDetails(intersectedPlanet);
      }
    } else {
      // No planet selected, use pinch for fine rotation control
      this.galaxy.setRotationSpeed(0.005);
    }
  }
  
  handlePointing(data, confidence) {
    // Laser pointer mode - highlight whatever is being pointed at
    const { direction } = data;
    
    const target = this.galaxy.raycastAll(direction);
    if (target) {
      this.galaxy.highlightObject(target);
    }
  }
  
  handleThumbsUp(data, confidence) {
    // Immersive mode - maximize galaxy view
    this.state.cameraMode = 'immersive';
    this.camera.enterImmersiveMode(this.transitionDuration);
    this.galaxy.setExpansion(2.5, 1.0); // Max expansion
    
    console.log('🌌 Immersive mode activated');
  }
  
  handleThumbsDown(data, confidence) {
    // Overview mode - pull back for full galaxy view
    this.state.cameraMode = 'overview';
    this.camera.enterOverviewMode(this.transitionDuration);
    this.galaxy.setExpansion(1.0, 1.0); // Normal expansion
    
    console.log('🔭 Overview mode activated');
  }
  
  handleSwipe(data, confidence) {
    // Navigate between planets
    const { direction, velocity } = data;
    
    if (this.state.selectedPlanet) {
      const currentIndex = this.galaxy.getPlanetIndex(this.state.selectedPlanet);
      
      if (direction === 'LEFT') {
        this.selectNextPlanet(currentIndex + 1);
      } else if (direction === 'RIGHT') {
        this.selectPreviousPlanet(currentIndex - 1);
      }
    }
  }
  
  handlePeace(data, confidence) {
    // Reset galaxy to default state
    this.resetGalaxy();
  }
  
  // ===== TWO-HAND HANDLERS =====
  
  handlePinchOut(data, confidence) {
    // Zoom out / expand galaxy
    const { zoomFactor, delta } = data;
    
    this.camera.zoom(zoomFactor);
    this.galaxy.setExpansion(this.state.galaxyExpansion * zoomFactor, 0.1);
    this.state.galaxyExpansion *= zoomFactor;
    
    // Clamp expansion
    this.state.galaxyExpansion = Math.max(0.5, Math.min(3.0, this.state.galaxyExpansion));
  }
  
  handlePinchIn(data, confidence) {
    // Zoom in / contract galaxy
    const { zoomFactor, delta } = data;
    
    this.camera.zoom(zoomFactor);
    this.galaxy.setExpansion(this.state.galaxyExpansion * zoomFactor, 0.1);
    this.state.galaxyExpansion *= zoomFactor;
    
    // Clamp expansion
    this.state.galaxyExpansion = Math.max(0.5, Math.min(3.0, this.state.galaxyExpansion));
  }
  
  handleClap(data, confidence) {
    // Trigger supernova animation!
    const { intensity, position } = data;
    
    console.log('💥 SUPERNOVA!', intensity);
    this.galaxy.triggerSupernova(position, intensity);
    
    // Camera shake effect
    this.camera.shake(intensity * 0.5, 0.5);
  }
  
  handleParallelRotate(data, confidence) {
    // Rotate galaxy on Y-axis based on hand distance
    const { distance, direction } = data;
    
    const rotationAmount = (distance - 0.3) * 2; // Map distance to rotation
    this.galaxy.addRotationOffset(rotationAmount);
  }
  
  handleTwoOpenPalms(data, confidence) {
    // Spread gesture - expand everything
    const { distance } = data;
    
    const expansionFactor = Math.max(1.5, Math.min(3.0, distance * 5));
    this.galaxy.setExpansion(expansionFactor, 0.3);
    this.state.galaxyExpansion = expansionFactor;
  }
  
  handleTwoFists(data, confidence) {
    // Power gesture - contract everything
    const { distance } = data;
    
    const contractionFactor = Math.max(0.3, Math.min(1.0, distance * 2));
    this.galaxy.setExpansion(contractionFactor, 0.3);
    this.state.galaxyExpansion = contractionFactor;
    
    // Increase rotation speed
    this.galaxy.setRotationSpeed(0.01);
  }
  
  // ===== HELPER METHODS =====
  
  selectPlanet(planet) {
    if (this.state.selectedPlanet) {
      this.galaxy.deselectPlanet(this.state.selectedPlanet);
    }
    
    this.state.selectedPlanet = planet;
    this.galaxy.selectPlanet(planet);
    this.camera.focusOnPlanet(planet, this.transitionDuration);
    this.state.cameraMode = 'focused';
    
    console.log('🪐 Selected:', planet.name);
  }
  
  selectNextPlanet(index) {
    const planets = this.galaxy.getPlanets();
    const nextIndex = index % planets.length;
    this.selectPlanet(planets[nextIndex]);
  }
  
  selectPreviousPlanet(index) {
    const planets = this.galaxy.getPlanets();
    const prevIndex = (index + planets.length - 1) % planets.length;
    this.selectPlanet(planets[prevIndex]);
  }
  
  showPlanetDetails(planet) {
    // Show UI overlay with planet info
    if (this.galaxy.ui) {
      this.galaxy.ui.showPlanetDetails(planet);
    }
  }
  
  resetGalaxy() {
    console.log('🔄 Resetting galaxy to default state');
    
    // Clear selection
    if (this.state.selectedPlanet) {
      this.galaxy.deselectPlanet(this.state.selectedPlanet);
      this.state.selectedPlanet = null;
    }
    
    // Reset camera
    this.camera.resetToDefault(this.transitionDuration);
    this.state.cameraMode = 'free';
    
    // Reset galaxy properties
    this.galaxy.setExpansion(1.0, 1.0);
    this.galaxy.setRotationSpeed(0.002);
    this.galaxy.resetRotationOffset();
    this.state.galaxyExpansion = 1.0;
    
    // Disable drag mode
    if (this.state.isDragging) {
      this.galaxy.disableDragMode();
      this.state.isDragging = false;
      this.state.dragTarget = null;
    }
  }
  
  // Get current state
  getState() {
    return {
      ...this.state,
      cameraPosition: this.camera.getPosition(),
      galaxyExpansion: this.state.galaxyExpansion
    };
  }
  
  // Update state
  update(deltaTime) {
    // Handle continuous drag if active
    if (this.state.isDragging && this.state.dragTarget) {
      // Update drag physics
      this.galaxy.updateDrag(deltaTime);
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ActionRouter;
}
