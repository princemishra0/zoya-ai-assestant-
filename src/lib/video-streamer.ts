export class VideoStreamer {
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null;
  private stream: MediaStream | null = null;
  private intervalId: number | null = null;
  private sessionId: string;
  private isScreenSharing: boolean;

  constructor(sessionId: string, isScreenSharing: boolean = false) {
    this.sessionId = sessionId;
    this.isScreenSharing = isScreenSharing;
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    this.canvasElement = document.createElement('canvas');
    this.context = this.canvasElement.getContext('2d');
  }

  async start() {
    try {
      if (this.isScreenSharing) {
        this.stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 5, max: 10 } },
          audio: false,
        });
      } else {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 5, max: 10 } },
          audio: false,
        });
      }

      this.videoElement.srcObject = this.stream;
      
      await new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.canvasElement.width = this.videoElement.videoWidth;
          this.canvasElement.height = this.videoElement.videoHeight;
          resolve(null);
        };
      });

      this.videoElement.play();

      // Send a frame every 1 second (1 fps is optimal for Gemini Live)
      this.intervalId = window.setInterval(() => this.captureAndSendFrame(), 1000);
      
      // Handle stop from browser UI (like screen share stop)
      this.stream.getVideoTracks()[0].onended = () => {
        this.stop();
      };
      
      return true;
    } catch (err) {
      console.error('[VideoStreamer] Failed to start:', err);
      return false;
    }
  }

  private async captureAndSendFrame() {
    if (!this.context || !this.videoElement || !this.stream) return;
    
    // Draw current frame to canvas
    this.context.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // Convert to base64 JPEG
    // Max size compression
    const dataUrl = this.canvasElement.toDataURL('image/jpeg', 0.6);
    // Remove "data:image/jpeg;base64," prefix
    const base64Data = dataUrl.split(',')[1];
    
    if (base64Data) {
      try {
        await fetch('/api/live/input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            type: 'video',
            data: base64Data,
          }),
        });
      } catch (err) {
        console.warn('[VideoStreamer] Failed to send frame:', err);
      }
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.videoElement.srcObject = null;
  }
}
