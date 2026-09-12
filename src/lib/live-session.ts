import { SessionState, MemoryItem, BrowserAction } from '../types';
import { AudioStreamer } from './audio-streamer';

export interface LiveSessionCallbacks {
  onStateChange: (state: SessionState) => void;
  onAction: (action: BrowserAction) => void;
  onMemoryAdded: (memory: MemoryItem) => void;
  onMemoryDeleted: (identifier: string) => void;
  onInitMemories: (memories: MemoryItem[], owner: string) => void;
  onError: (errorMessage: string) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private audioStreamer: AudioStreamer | null = null;
  private state: SessionState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private isMuted = false;
  private sessionId: string | null = null;
  private isUsingSse = false;
  private sseAbortController: AbortController | null = null;

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;
  }

  getState(): SessionState {
    return this.state;
  }

  getAudioStreamer(): AudioStreamer | null {
    return this.audioStreamer;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.audioStreamer) {
      this.audioStreamer.setMuted(this.isMuted);
    }
    return this.isMuted;
  }

  private setState(newState: SessionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange(newState);
    }
  }

  private handleServerMessage(msg: any): void {
    switch (msg.type) {
      case 'init':
        if (msg.memories) {
          this.callbacks.onInitMemories(
            msg.memories,
            msg.owner || 'Prince Mishra'
          );
        }
        break;

      case 'session_ready':
        console.log('[LiveSession] Gemini Live session is ready');
        this.setState('listening');
        break;

      case 'audio':
        if (msg.data && this.audioStreamer) {
          this.audioStreamer.queueAudioChunk(msg.data);
        }
        break;

      case 'interrupted':
        console.log('[LiveSession] Interruption triggered');
        if (this.audioStreamer) {
          this.audioStreamer.handleInterruption();
        }
        this.setState('listening');
        break;

      case 'action':
        if (msg.action === 'openWebsite' && msg.url) {
          const action: BrowserAction = {
            id: msg.callId || 'action-' + Date.now(),
            type: 'openWebsite',
            title: msg.title || msg.url,
            url: msg.url,
            timestamp: Date.now(),
          };
          this.callbacks.onAction(action);

          // Attempt to open in a new window or tab directly via simulated click
          try {
            const a = document.createElement('a');
            a.href = msg.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } catch (e) {
            console.warn('[LiveSession] Popup blocked or restricted:', e);
          }
        }
        break;

      case 'memory_added':
        if (msg.memory) {
          this.callbacks.onMemoryAdded(msg.memory);
          this.callbacks.onAction({
            id: 'mem-' + Date.now(),
            type: 'memorySaved',
            title: `Saved: ${msg.memory.title}`,
            timestamp: Date.now(),
          });
        }
        break;

      case 'memory_deleted':
        if (msg.identifier) {
          this.callbacks.onMemoryDeleted(msg.identifier);
          this.callbacks.onAction({
            id: 'mem-del-' + Date.now(),
            type: 'memoryDeleted',
            title: `Forgot: ${msg.identifier}`,
            timestamp: Date.now(),
          });
        }
        break;

      case 'error':
        console.error('[LiveSession] Server reported error:', msg.message);
        this.callbacks.onError(msg.message || 'Live session encountered an error');
        break;

      case 'session_closed':
        console.log('[LiveSession] Server closed session');
        this.disconnect();
        break;
    }
  }

  private async sendHttpAudio(base64: string): Promise<void> {
    if (!this.sessionId || this.state === 'disconnected') return;
    try {
      await fetch('/api/live/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: this.sessionId,
          type: 'audio',
          data: base64,
        }),
      });
    } catch (err) {
      console.warn('[LiveSession] Error sending audio chunk via HTTP:', err);
    }
  }

  private async startSseStream(sessionId: string): Promise<void> {
    if (this.isUsingSse) return;
    this.isUsingSse = true;

    if (this.sseAbortController) {
      this.sseAbortController.abort();
    }
    this.sseAbortController = new AbortController();

    try {
      console.log('[LiveSession] Initializing SSE transport stream...');
      const response = await fetch(`/api/live/stream?sessionId=${sessionId}`, {
        headers: { Accept: 'text/event-stream' },
        credentials: 'include',
        signal: this.sseAbortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`SSE stream failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            if (!jsonStr) continue;
            try {
              const parsed = JSON.parse(jsonStr);
              this.handleServerMessage(parsed);
            } catch (err) {
              console.error('[LiveSession] Error parsing SSE payload:', err, jsonStr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[LiveSession] SSE stream aborted');
        return;
      }
      console.error('[LiveSession] SSE stream error:', err);
      this.callbacks.onError(err.message || 'Stream connection lost');
      this.disconnect();
    }
  }

  async connect(
    personality: string = 'zoya',
    selectedMicId?: string,
    selectedSpeakerId?: string
  ): Promise<void> {
    if (
      this.state === 'connecting' ||
      this.state === 'listening' ||
      this.state === 'speaking'
    ) {
      return;
    }

    this.setState('connecting');
    this.isUsingSse = false;

    try {
      // 1. Initialize Audio Streamer first to check microphone permissions
      this.audioStreamer = new AudioStreamer({
        onMicData: (base64) => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'audio', data: base64 }));
          } else if (this.isUsingSse && this.sessionId) {
            this.sendHttpAudio(base64);
          }
        },
        onPlaybackStart: () => {
          this.setState('speaking');
        },
        onPlaybackEnd: () => {
          if (this.state === 'speaking') {
            this.setState('listening');
          }
        },
        onError: (err) => {
          console.error('[LiveSession] Audio streamer error:', err);
          this.callbacks.onError(err.message || 'Microphone audio error');
        },
      });

      await this.audioStreamer.start(selectedMicId, selectedSpeakerId);

      // 2. Initialize Session via REST to ensure cookie/proxy authentication
      const sessionRes = await fetch('/api/live/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ personality }),
      });

      if (!sessionRes.ok) {
        const errorData = await sessionRes.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server session init failed: ${sessionRes.status}`
        );
      }

      const sessionData = await sessionRes.json();
      this.sessionId = sessionData.sessionId;

      if (sessionData.memories) {
        this.callbacks.onInitMemories(
          sessionData.memories,
          sessionData.owner || 'Prince Mishra'
        );
      }

      // 3. Attempt WebSocket connection with fallback to SSE
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?sessionId=${this.sessionId}`;

      let wsResolved = false;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[LiveSession] WebSocket connected successfully');
          wsResolved = true;
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this.handleServerMessage(msg);
          } catch (err) {
            console.error('[LiveSession] Error parsing WS message:', err);
          }
        };

        this.ws.onerror = (e) => {
          console.warn(
            '[LiveSession] WebSocket transport restricted or redirected:',
            e
          );
          if (!wsResolved && this.sessionId) {
            wsResolved = true;
            try {
              this.ws?.close();
            } catch {}
            this.ws = null;
            // Fallback immediately to SSE stream
            console.log(
              '[LiveSession] Switching to seamless HTTP SSE stream transport...'
            );
            this.startSseStream(this.sessionId);
          }
        };

        this.ws.onclose = () => {
          console.log('[LiveSession] WebSocket closed');
          if (!this.isUsingSse) {
            this.disconnect();
          }
        };

        // Fallback timer: if WebSocket doesn't connect within 1.5 seconds, activate SSE
        setTimeout(() => {
          if (!wsResolved && this.sessionId && this.state === 'connecting') {
            console.log(
              '[LiveSession] WebSocket connection timeout, falling back to SSE transport...'
            );
            wsResolved = true;
            try {
              this.ws?.close();
            } catch {}
            this.ws = null;
            this.startSseStream(this.sessionId);
          }
        }, 1500);
      } catch (wsErr) {
        console.warn(
          '[LiveSession] Direct WebSocket creation failed, using SSE:',
          wsErr
        );
        if (this.sessionId) {
          this.startSseStream(this.sessionId);
        }
      }
    } catch (err: any) {
      console.error('[LiveSession] Connection sequence failed:', err);
      this.callbacks.onError(
        err.message || 'Could not start voice session. Check microphone access.'
      );
      this.disconnect();
    }
  }

  disconnect(): void {
    const currentSessionId = this.sessionId;
    this.sessionId = null;
    this.isUsingSse = false;

    if (this.sseAbortController) {
      try {
        this.sseAbortController.abort();
      } catch {}
      this.sseAbortController = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    if (this.audioStreamer) {
      try {
        this.audioStreamer.stop();
      } catch {}
      this.audioStreamer = null;
    }

    if (currentSessionId) {
      fetch('/api/live/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId: currentSessionId }),
      }).catch(() => {});
    }

    this.setState('disconnected');
  }
}
