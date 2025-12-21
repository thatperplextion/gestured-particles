// ⚙️ Settings Panel - Real-time customization
export class SettingsPanel {
  constructor() {
    this.isOpen = false;
    this.settings = {
      particleCount: 2000,
      gestureSensitivity: 1.0,
      trailEnabled: true,
      trailLength: 8,
      audioEnabled: true,
      audioVolume: 0.3,
      smoothing: 0.15,
      motionMode: 'pulse',
      particleSize: 0.05,
      theme: 'dark'
    };
    
    // Load from localStorage
    const saved = localStorage.getItem('gestureParticlesSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
    
    this.createUI();
  }

  createUI() {
    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.style.cssText = `
      position: fixed;
      top: 12px;
      right: 12px;
      width: 320px;
      background: rgba(20,20,30,0.95);
      border: 2px solid rgba(100,200,255,0.4);
      border-radius: 10px;
      padding: 20px;
      z-index: 1000;
      color: #fff;
      font-family: monospace;
      display: none;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,150,255,0.2);
    `;

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(100,200,255,0.2); padding-bottom: 10px;">
        <h3 style="margin: 0; font-size: 16px;">⚙️ Settings</h3>
        <button id="close-settings" style="background: none; border: none; color: #fff; font-size: 18px; cursor: pointer;">✕</button>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 11px; color: #0ff;">Particle Count</label>
        <input id="particle-count" type="range" min="500" max="5000" step="500" style="width: 100%; cursor: pointer;">
        <span id="particle-count-value" style="font-size: 10px; color: #0f0;">2000</span>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 11px; color: #0ff;">Gesture Sensitivity</label>
        <input id="gesture-sensitivity" type="range" min="0.5" max="1.5" step="0.1" style="width: 100%; cursor: pointer;">
        <span id="gesture-sensitivity-value" style="font-size: 10px; color: #0f0;">1.0x</span>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 11px; color: #0ff;">Particle Trail</label>
        <input id="trail-enabled" type="checkbox" ${this.settings.trailEnabled ? 'checked' : ''} style="margin-right: 8px;">
        <span style="font-size: 10px; color: #0f0;">Enabled</span>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 11px; color: #0ff;">Trail Length</label>
        <input id="trail-length" type="range" min="2" max="20" step="1" style="width: 100%; cursor: pointer;">
        <span id="trail-length-value" style="font-size: 10px; color: #0f0;">8</span>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 11px; color: #0ff;">Audio Feedback</label>
        <input id="audio-enabled" type="checkbox" ${this.settings.audioEnabled ? 'checked' : ''} style="margin-right: 8px;">
        <span style="font-size: 10px; color: #0f0;">Enabled</span>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 11px; color: #0ff;">Audio Volume</label>
        <input id="audio-volume" type="range" min="0" max="0.5" step="0.05" style="width: 100%; cursor: pointer;">
        <span id="audio-volume-value" style="font-size: 10px; color: #0f0;">0.3</span>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 11px; color: #0ff;">Motion Mode</label>
        <select id="motion-mode" style="width: 100%; padding: 5px; background: #1a1a2e; color: #0ff; border: 1px solid rgba(0,255,255,0.3); border-radius: 4px; cursor: pointer;">
          <option value="pulse">Pulse (Breathing)</option>
          <option value="orbit">Orbit (Spinning)</option>
          <option value="swirl">Swirl (Spiraling)</option>
        </select>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 11px; color: #0ff;">Smoothing Factor</label>
        <input id="smoothing" type="range" min="0.05" max="0.4" step="0.05" style="width: 100%; cursor: pointer;">
        <span id="smoothing-value" style="font-size: 10px; color: #0f0;">0.15</span>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 11px; color: #0ff;">Particle Size</label>
        <input id="particle-size" type="range" min="0.02" max="0.1" step="0.01" style="width: 100%; cursor: pointer;">
        <span id="particle-size-value" style="font-size: 10px; color: #0f0;">0.05</span>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 11px; color: #0ff;">Theme</label>
        <select id="theme" style="width: 100%; padding: 5px; background: #1a1a2e; color: #0ff; border: 1px solid rgba(0,255,255,0.3); border-radius: 4px; cursor: pointer;">
          <option value="dark">Dark (Default)</option>
          <option value="light">Light</option>
        </select>
      </div>

      <button id="reset-settings" style="width: 100%; padding: 8px; background: rgba(255,100,100,0.2); border: 1px solid rgba(255,100,100,0.5); color: #f0f; border-radius: 4px; cursor: pointer; font-size: 11px; margin-top: 10px;">Reset to Defaults</button>
    `;

    document.body.appendChild(panel);

    // Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'settings-toggle';
    toggleBtn.innerHTML = '⚙️';
    toggleBtn.style.cssText = `
      position: fixed;
      top: 12px;
      right: 12px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(100,200,255,0.2);
      border: 2px solid rgba(100,200,255,0.5);
      color: #0ff;
      font-size: 18px;
      cursor: pointer;
      z-index: 999;
      transition: all 0.3s;
    `;

    toggleBtn.addEventListener('mouseenter', () => {
      toggleBtn.style.background = 'rgba(100,200,255,0.4)';
    });

    toggleBtn.addEventListener('mouseleave', () => {
      if (!this.isOpen) {
        toggleBtn.style.background = 'rgba(100,200,255,0.2)';
      }
    });

    toggleBtn.addEventListener('click', () => this.toggle());
    document.body.appendChild(toggleBtn);

    // Event listeners
    document.getElementById('close-settings').addEventListener('click', () => this.toggle());
    document.getElementById('particle-count').addEventListener('change', (e) => {
      this.settings.particleCount = parseInt(e.target.value);
      document.getElementById('particle-count-value').textContent = e.target.value;
      this.save();
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
    });

    document.getElementById('gesture-sensitivity').addEventListener('change', (e) => {
      this.settings.gestureSensitivity = parseFloat(e.target.value);
      document.getElementById('gesture-sensitivity-value').textContent = e.target.value + 'x';
      this.save();
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
    });

    document.getElementById('trail-enabled').addEventListener('change', (e) => {
      this.settings.trailEnabled = e.target.checked;
      this.save();
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
    });

    document.getElementById('trail-length').addEventListener('change', (e) => {
      this.settings.trailLength = parseInt(e.target.value);
      document.getElementById('trail-length-value').textContent = e.target.value;
      this.save();
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
    });

    document.getElementById('audio-enabled').addEventListener('change', (e) => {
      this.settings.audioEnabled = e.target.checked;
      this.save();
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
    });

    document.getElementById('audio-volume').addEventListener('change', (e) => {
      this.settings.audioVolume = parseFloat(e.target.value);
      document.getElementById('audio-volume-value').textContent = e.target.value;
      this.save();
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
    });

    document.getElementById('motion-mode').addEventListener('change', (e) => {
      this.settings.motionMode = e.target.value;
      this.save();
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
    });

    document.getElementById('smoothing').addEventListener('change', (e) => {
      this.settings.smoothing = parseFloat(e.target.value);
      document.getElementById('smoothing-value').textContent = e.target.value;
      this.save();
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
    });

    document.getElementById('particle-size').addEventListener('change', (e) => {
      this.settings.particleSize = parseFloat(e.target.value);
      document.getElementById('particle-size-value').textContent = e.target.value;
      this.save();
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
    });

    document.getElementById('theme').addEventListener('change', (e) => {
      this.settings.theme = e.target.value;
      this.applyTheme();
      this.save();
    });

    document.getElementById('reset-settings').addEventListener('click', () => this.reset());
  }

  toggle() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById('settings-panel');
    const toggle = document.getElementById('settings-toggle');
    
    if (this.isOpen) {
      panel.style.display = 'block';
      toggle.style.background = 'rgba(100,200,255,0.4)';
    } else {
      panel.style.display = 'none';
      toggle.style.background = 'rgba(100,200,255,0.2)';
    }
  }

  applyTheme() {
    if (this.settings.theme === 'light') {
      document.body.style.background = '#fff';
      document.body.style.color = '#000';
    } else {
      document.body.style.background = '#000';
      document.body.style.color = '#fff';
    }
  }

  save() {
    localStorage.setItem('gestureParticlesSettings', JSON.stringify(this.settings));
  }

  reset() {
    this.settings = {
      particleCount: 2000,
      gestureSensitivity: 1.0,
      trailEnabled: true,
      trailLength: 8,
      audioEnabled: true,
      audioVolume: 0.3,
      smoothing: 0.15,
      motionMode: 'pulse',
      particleSize: 0.05,
      theme: 'dark'
    };
    this.save();
    location.reload();
  }
}
