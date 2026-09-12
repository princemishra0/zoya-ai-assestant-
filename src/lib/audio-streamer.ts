export async function getAudioDevices(): Promise<{ microphones: MediaDeviceInfo[]; speakers: MediaDeviceInfo[] }> {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    // Ignore
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  const microphones = devices.filter((d) => d.kind === 'audioinput');
  const speakers = devices.filter((d) => d.kind === 'audiooutput');
  return { microphones, speakers };
}

import {
  float32ToPcm16Base64,
  pcm16Base64ToFloat32,
  computeRmsVolume,
} from './pcm-audio';

export interface AudioStreamerCallbacks {
  onMicData: (base64Pcm16: string) => void;
  onPlaybackStart: () => void;
  onPlaybackEnd: () => void;
  onError: (error: Error) => void;
}

export class AudioStreamer {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micMediaStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;

  private outputGainNode: GainNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;

  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private nextScheduledTime = 0;
  private isMuted = false;
  private isPlaying = false;
  private playbackCheckTimer: number | null = null;

  private callbacks: AudioStreamerCallbacks;
  private tempFreqData: Uint8Array = new Uint8Array(64);

  constructor(callbacks: AudioStreamerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Initializes both input (16kHz) and output (24kHz) audio contexts and requests mic permission.
   */
  async start(): Promise<void> {
    try {
      // 1. Output Audio Context (24kHz - Gemini Live output)
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });

      this.outputGainNode = this.outputAudioCtx.createGain();
      this.outputGainNode.gain.value = 1.0;

      this.outputAnalyser = this.outputAudioCtx.createAnalyser();
      this.outputAnalyser.fftSize = 128;
      this.outputAnalyser.smoothingTimeConstant = 0.75;

      this.outputGainNode.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputAudioCtx.destination);

      // Resume context if suspended by browser autoplay policy
      if (this.outputAudioCtx.state === 'suspended') {
        await this.outputAudioCtx.resume();
      }

      // 2. Input Audio Context (16kHz - Gemini Live input)
      this.inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
      if (this.inputAudioCtx.state === 'suspended') {
        await this.inputAudioCtx.resume();
      }

      this.inputAnalyser = this.inputAudioCtx.createAnalyser();
      this.inputAnalyser.fftSize = 128;
      this.inputAnalyser.smoothingTimeConstant = 0.75;

      // 3. Request Microphone Access
      this.micMediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.micSourceNode = this.inputAudioCtx.createMediaStreamSource(
        this.micMediaStream
      );
      this.micSourceNode.connect(this.inputAnalyser);

      // 4. ScriptProcessorNode for streaming PCM 16kHz
      this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);
      this.micSourceNode.connect(this.scriptProcessor);

      // Route processor to destination through silent gain to prevent feedback
      const silentGain = this.inputAudioCtx.createGain();
      silentGain.gain.value = 0;
      this.scriptProcessor.connect(silentGain);
      silentGain.connect(this.inputAudioCtx.destination);

      this.scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (this.isMuted) return;

        const inputBuffer = e.inputBuffer.getChannelData(0);
        const base64 = float32ToPcm16Base64(inputBuffer);
        this.callbacks.onMicData(base64);
      };

      this.nextScheduledTime = this.outputAudioCtx.currentTime;
    } catch (err: any) {
      console.error('[AudioStreamer] Initialization failed:', err);
      this.callbacks.onError(err);
      throw err;
    }
  }

  /**
   * Enqueues and plays a 24kHz PCM audio chunk received from Gemini Live.
   */
  queueAudioChunk(base64Pcm: string): void {
    if (!this.outputAudioCtx || !this.outputGainNode) return;

    try {
      const float32Samples = pcm16Base64ToFloat32(base64Pcm);
      if (float32Samples.length === 0) return;

      const audioBuffer = this.outputAudioCtx.createBuffer(
        1,
        float32Samples.length,
        24000
      );
      audioBuffer.getChannelData(0).set(float32Samples);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputGainNode);

      const currentTime = this.outputAudioCtx.currentTime;
      const startTime = Math.max(currentTime, this.nextScheduledTime);

      source.start(startTime);
      this.nextScheduledTime = startTime + audioBuffer.duration;

      this.activeSources.add(source);

      if (!this.isPlaying) {
        this.isPlaying = true;
        this.callbacks.onPlaybackStart();
      }

      source.onended = () => {
        this.activeSources.delete(source);
        this.checkPlaybackStatus();
      };

      this.schedulePlaybackCheck();
    } catch (err: any) {
      console.error('[AudioStreamer] Error playing audio chunk:', err);
    }
  }

  private schedulePlaybackCheck(): void {
    if (this.playbackCheckTimer) {
      window.clearTimeout(this.playbackCheckTimer);
    }

    if (!this.outputAudioCtx) return;
    const remainingMs = Math.max(
      50,
      (this.nextScheduledTime - this.outputAudioCtx.currentTime) * 1000 + 80
    );

    this.playbackCheckTimer = window.setTimeout(() => {
      this.checkPlaybackStatus();
    }, remainingMs);
  }

  private checkPlaybackStatus(): void {
    if (!this.outputAudioCtx) return;

    if (
      this.activeSources.size === 0 &&
      this.outputAudioCtx.currentTime >= this.nextScheduledTime
    ) {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.callbacks.onPlaybackEnd();
      }
    }
  }

  /**
   * Instantly stops all playing and scheduled audio sources when an interruption occurs.
   */
  handleInterruption(): void {
    console.log('[AudioStreamer] Handling interruption - clearing playback queue');

    this.activeSources.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // Ignored if already stopped
      }
    });
    this.activeSources.clear();

    if (this.outputAudioCtx) {
      this.nextScheduledTime = this.outputAudioCtx.currentTime;
    }

    if (this.playbackCheckTimer) {
      window.clearTimeout(this.playbackCheckTimer);
      this.playbackCheckTimer = null;
    }

    if (this.isPlaying) {
      this.isPlaying = false;
      this.callbacks.onPlaybackEnd();
    }
  }

  /**
   * Mute or unmute microphone.
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Returns current audio amplitude and frequency metrics for the live visualizer.
   */
  getVisualizerMetrics(isSpeaking: boolean): {
    volume: number;
    frequencies: Uint8Array;
  } {
    const analyser = isSpeaking ? this.outputAnalyser : this.inputAnalyser;
    if (!analyser) {
      return { volume: 0, frequencies: this.tempFreqData };
    }

    analyser.getByteFrequencyData(this.tempFreqData);

    let sum = 0;
    for (let i = 0; i < this.tempFreqData.length; i++) {
      sum += this.tempFreqData[i];
    }
    const volume = Math.min(1, sum / (this.tempFreqData.length * 180));

    return { volume, frequencies: this.tempFreqData };
  }

  /**
   * Tears down contexts and media tracks.
   */
  stop(): void {
    this.handleInterruption();

    if (this.micMediaStream) {
      this.micMediaStream.getTracks().forEach((track) => track.stop());
      this.micMediaStream = null;
    }

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }

    if (this.inputAudioCtx) {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }
  }
}
