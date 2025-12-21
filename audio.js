// 🔊 Audio Feedback System - Creates gesture-reactive sounds
export class AudioFeedback {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.3; // Prevent ear damage
    
    this.lastGestureTime = 0;
    this.lastGesture = null;
  }

  // Play gesture change sound
  playGestureSound(gesture) {
    const now = Date.now();
    if (now - this.lastGestureTime < 150) return; // Debounce
    this.lastGestureTime = now;
    
    if (gesture === 'OPEN') this.playOpenSound();
    else if (gesture === 'PINCH') this.playpinchSound();
    else if (gesture === 'FIST') this.playFistSound();
  }

  // High-pitched beep for opening hand
  playOpenSound() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
    gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  // Mid-tone for pinch
  playpinchSound() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  // Low rumble for fist
  playFistSound() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.2);
    gain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  // Swipe sound
  playSwipeSound(direction) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    const startFreq = direction === 'LEFT' ? 1000 : 400;
    const endFreq = direction === 'LEFT' ? 400 : 1000;
    
    osc.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  // Continuous tone based on expansion (0-1)
  setToneFrequency(expansion) {
    // Map expansion (0.5-3.0) to frequency (200-2000 Hz)
    const freq = 200 + (expansion - 0.5) / 2.5 * 1800;
    return freq;
  }

  setVolume(level) {
    this.masterGain.gain.value = Math.max(0, Math.min(0.5, level));
  }
}
