// ⚡ Performance Manager - Adaptive Quality System
// Monitors FPS and adjusts visual quality automatically

class PerformanceManager {
  constructor() {
    this.targetFPS = 60;
    this.minFPS = 45;
    this.fpsHistory = [];
    this.frameTime = 0;
    this.qualityLevel = 'high'; // 'high', 'medium', 'low'
    this.lastUpdate = Date.now();
    this.updateInterval = 2000; // Check every 2 seconds
    
    this.qualitySettings = {
      high: {
        starCount: 10000,
        particleSize: 2.0,
        nebulaClouds: 5,
        postProcessing: true,
        shadowQuality: 'high',
        planetDetail: 64,
      },
      medium: {
        starCount: 5000,
        particleSize: 1.5,
        nebulaClouds: 3,
        postProcessing: true,
        shadowQuality: 'medium',
        planetDetail: 32,
      },
      low: {
        starCount: 2000,
        particleSize: 1.0,
        nebulaClouds: 1,
        postProcessing: false,
        shadowQuality: 'low',
        planetDetail: 16,
      }
    };
    
    this.listeners = [];
  }
  
  // Update FPS tracking
  update(deltaTime) {
    const fps = 1 / deltaTime;
    this.fpsHistory.push(fps);
    
    // Keep last 60 frames
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }
    
    this.frameTime = deltaTime * 1000; // ms
    
    // Check if we need to adjust quality
    const now = Date.now();
    if (now - this.lastUpdate > this.updateInterval) {
      this.checkPerformance();
      this.lastUpdate = now;
    }
  }
  
  // Analyze performance and adjust quality
  checkPerformance() {
    if (this.fpsHistory.length < 30) return;
    
    const avgFPS = this.getAverageFPS();
    
    // Downgrade if performance is poor
    if (avgFPS < this.minFPS) {
      if (this.qualityLevel === 'high') {
        this.setQuality('medium');
        console.log('📉 Performance: High → Medium');
      } else if (this.qualityLevel === 'medium') {
        this.setQuality('low');
        console.log('📉 Performance: Medium → Low');
      }
    }
    
    // Upgrade if performance is excellent
    else if (avgFPS > 55) {
      if (this.qualityLevel === 'low') {
        this.setQuality('medium');
        console.log('📈 Performance: Low → Medium');
      } else if (this.qualityLevel === 'medium' && avgFPS > 58) {
        this.setQuality('high');
        console.log('📈 Performance: Medium → High');
      }
    }
  }
  
  // Set quality level
  setQuality(level) {
    if (this.qualityLevel === level) return;
    
    this.qualityLevel = level;
    const settings = this.qualitySettings[level];
    
    // Notify listeners
    this.listeners.forEach(callback => callback(level, settings));
  }
  
  // Subscribe to quality changes
  onQualityChange(callback) {
    this.listeners.push(callback);
  }
  
  // Get current settings
  getSettings() {
    return this.qualitySettings[this.qualityLevel];
  }
  
  // Get average FPS
  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
  }
  
  // Get current FPS
  getCurrentFPS() {
    return this.fpsHistory[this.fpsHistory.length - 1] || 60;
  }
  
  // Get stats for display
  getStats() {
    return {
      fps: Math.round(this.getCurrentFPS()),
      avgFPS: Math.round(this.getAverageFPS()),
      frameTime: this.frameTime.toFixed(2),
      quality: this.qualityLevel
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceManager;
}
