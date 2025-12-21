// 📊 Performance Dashboard - Real-time metrics
export class PerformanceDashboard {
  constructor() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      handLatency: 0,
      gestureConfidence: 0,
      particleCount: 2000,
      detectionRate: 0,
      avgHandSpeed: 0
    };
    
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    
    this.createUI();
  }

  createUI() {
    const dashboard = document.createElement('div');
    dashboard.id = 'performance-dashboard';
    dashboard.style.cssText = `
      position: fixed;
      top: 12px;
      right: 60px;
      background: rgba(0,0,0,0.8);
      border: 1px solid rgba(0,255,100,0.3);
      border-radius: 6px;
      padding: 12px 16px;
      font-family: monospace;
      font-size: 11px;
      color: #0f0;
      z-index: 100;
      line-height: 1.6;
      white-space: nowrap;
      box-shadow: 0 0 20px rgba(0,255,100,0.1);
    `;

    dashboard.innerHTML = `
      <div style="color: #0ff; margin-bottom: 5px; font-weight: bold;">⚡ Performance</div>
      <div id="fps-display">FPS: <span style="color: #0f0;">60</span></div>
      <div id="frame-time-display">Frame: <span style="color: #0f0;">16.7ms</span></div>
      <div id="hand-latency-display">Latency: <span style="color: #0f0;">0ms</span></div>
      <div id="detection-rate-display">Detection: <span style="color: #0f0;">100%</span></div>
      <div id="hand-speed-display">Hand Speed: <span style="color: #0f0;">0.0</span></div>
      <div id="particle-count-display">Particles: <span style="color: #0f0;">2000</span></div>
    `;

    document.body.appendChild(dashboard);
  }

  update() {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    
    this.frameCount++;
    
    if (deltaTime >= 1000) {
      this.metrics.fps = this.frameCount;
      this.fpsHistory.push(this.metrics.fps);
      if (this.fpsHistory.length > 60) this.fpsHistory.shift();
      
      this.frameCount = 0;
      this.lastTime = now;
      
      // Update UI
      const fpsColor = this.metrics.fps >= 55 ? '#0f0' : this.metrics.fps >= 30 ? '#ff0' : '#f00';
      document.getElementById('fps-display').innerHTML = `FPS: <span style="color: ${fpsColor};">${this.metrics.fps}</span>`;
      document.getElementById('frame-time-display').innerHTML = `Frame: <span style="color: #0f0;">${(1000 / Math.max(1, this.metrics.fps)).toFixed(1)}ms</span>`;
    }
    
    this.metrics.frameTime = deltaTime;
  }

  setHandLatency(ms) {
    this.metrics.handLatency = ms;
    const latencyColor = ms < 50 ? '#0f0' : ms < 100 ? '#ff0' : '#f00';
    document.getElementById('hand-latency-display').innerHTML = `Latency: <span style="color: ${latencyColor};">${ms.toFixed(0)}ms</span>`;
  }

  setDetectionRate(rate) {
    this.metrics.detectionRate = rate;
    const rateColor = rate >= 90 ? '#0f0' : rate >= 70 ? '#ff0' : '#f00';
    document.getElementById('detection-rate-display').innerHTML = `Detection: <span style="color: ${rateColor};">${(rate * 100).toFixed(0)}%</span>`;
  }

  setHandSpeed(speed) {
    this.metrics.avgHandSpeed = speed;
    document.getElementById('hand-speed-display').innerHTML = `Hand Speed: <span style="color: #0f0;">${(speed * 100).toFixed(1)}</span>`;
  }

  setParticleCount(count) {
    this.metrics.particleCount = count;
    document.getElementById('particle-count-display').innerHTML = `Particles: <span style="color: #0f0;">${count}</span>`;
  }

  getAverageFps() {
    if (this.fpsHistory.length === 0) return 0;
    return Math.round(this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length);
  }
}
