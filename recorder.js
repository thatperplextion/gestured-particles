// 🎬 Screen Recording & Export System
export class ScreenRecorder {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.chunks = [];
    this.stream = null;
    
    this.createUI();
  }

  createUI() {
    const container = document.createElement('div');
    container.id = 'recorder-controls';
    container.style.cssText = `
      position: fixed;
      bottom: 12px;
      right: 12px;
      background: rgba(0,0,0,0.8);
      border: 2px solid rgba(255,50,50,0.3);
      border-radius: 8px;
      padding: 12px;
      z-index: 999;
      display: flex;
      gap: 8px;
      align-items: center;
    `;

    container.innerHTML = `
      <button id="record-btn" style="
        background: rgba(255,50,50,0.3);
        border: 1px solid rgba(255,50,50,0.6);
        color: #ff6b6b;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-family: monospace;
        font-size: 11px;
        font-weight: bold;
      ">● Record</button>
      
      <button id="stop-record-btn" style="
        background: rgba(100,100,100,0.3);
        border: 1px solid rgba(100,100,100,0.6);
        color: #ccc;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-family: monospace;
        font-size: 11px;
        font-weight: bold;
        display: none;
      ">⏹ Stop</button>

      <span id="recording-indicator" style="
        font-family: monospace;
        font-size: 10px;
        color: #ff6b6b;
        display: none;
        animation: blink 1s infinite;
      ">REC</span>

      <style>
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.3; }
        }
      </style>
    `;

    document.body.appendChild(container);

    document.getElementById('record-btn').addEventListener('click', () => this.startRecording());
    document.getElementById('stop-record-btn').addEventListener('click', () => this.stopRecording());
  }

  startRecording() {
    if (this.isRecording) return;

    this.chunks = [];
    this.isRecording = true;

    // Get canvas stream
    const stream = this.canvas.captureStream(60);
    
    // Add audio if available
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioTrack = audioContext.createMediaStreamDestination().stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }
    } catch (e) {
      console.log('Audio not available for recording');
    }

    this.stream = stream;

    const mimeType = 'video/webm;codecs=vp9';
    const options = { mimeType };

    try {
      this.mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
      console.log('VP9 not supported, trying VP8...');
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (e) => {
      this.chunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      this.handleRecordingStop();
    };

    this.mediaRecorder.start();

    // Update UI
    document.getElementById('record-btn').style.display = 'none';
    document.getElementById('stop-record-btn').style.display = 'inline-block';
    document.getElementById('recording-indicator').style.display = 'inline-block';
  }

  stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;
    this.mediaRecorder.stop();

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    // Update UI
    document.getElementById('record-btn').style.display = 'inline-block';
    document.getElementById('stop-record-btn').style.display = 'none';
    document.getElementById('recording-indicator').style.display = 'none';
  }

  handleRecordingStop() {
    const blob = new Blob(this.chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `gesture-particles-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success message
    this.showMessage('✅ Recording saved!', 2000);
  }

  exportAsGif() {
    // This would require gif.js library
    this.showMessage('📌 GIF export coming soon!', 3000);
  }

  exportAsImage() {
    const link = document.createElement('a');
    link.download = `gesture-particles-${Date.now()}.png`;
    link.href = this.canvas.toDataURL();
    link.click();
    this.showMessage('💾 Screenshot saved!', 2000);
  }

  showMessage(text, duration) {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.9);
      color: #fff;
      padding: 20px 40px;
      border-radius: 8px;
      font-family: monospace;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), duration);
  }
}
