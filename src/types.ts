export type SessionState = 'disconnected' | 'connecting' | 'listening' | 'speaking';

export interface MemoryItem {
  id: string;
  title: string;
  fact: string;
  category: string;
  createdAt: string;
}

export interface BrowserAction {
  id: string;
  type: 'openWebsite' | 'memorySaved' | 'memoryDeleted';
  title: string;
  url?: string;
  timestamp: number;
}

export interface AudioVisualizerMetrics {
  volume: number;
  frequencies: Uint8Array;
  isPeak: boolean;
}
