import React, { useEffect, useState } from 'react';
import { SessionState } from '../types';
import { AudioStreamer } from '../lib/audio-streamer';

interface SoundSpectrumBarProps {
  state: SessionState;
  audioStreamer: AudioStreamer | null;
}

export const SoundSpectrumBar: React.FC<SoundSpectrumBarProps> = ({
  state,
  audioStreamer,
}) => {
  const [bars, setBars] = useState<number[]>(() => new Array(24).fill(8));

  useEffect(() => {
    let animId: number;

    const updateBars = () => {
      if (state === 'speaking' || state === 'listening') {
        const isSpeaking = state === 'speaking';
        const metrics = audioStreamer
          ? audioStreamer.getVisualizerMetrics(isSpeaking)
          : { volume: 0, frequencies: new Uint8Array(64) };

        const freq = metrics.frequencies;
        const newBars: number[] = [];
        const barCount = 24;

        for (let i = 0; i < barCount; i++) {
          const idx = Math.floor((i / barCount) * (freq.length / 2));
          const val = freq[idx] || 0;
          // Scale from 0-255 to 6-54px
          const height = Math.max(6, Math.min(54, (val / 255) * 52 + metrics.volume * 16));
          newBars.push(height);
        }
        setBars(newBars);
      } else if (state === 'connecting') {
        const time = Date.now() * 0.005;
        const newBars = new Array(24).fill(0).map((_, i) => {
          return 10 + Math.sin(time + i * 0.3) * 8;
        });
        setBars(newBars);
      } else {
        setBars(new Array(24).fill(6));
      }

      animId = requestAnimationFrame(updateBars);
    };

    animId = requestAnimationFrame(updateBars);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, audioStreamer]);

  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isConnecting = state === 'connecting';

  return (
    <div className="flex h-16 items-center justify-center gap-1.5 px-4">
      {bars.map((height, i) => (
        <div
          key={i}
          id={`eq-bar-${i}`}
          style={{ height: `${height}px` }}
          className={`w-1 rounded-full transition-all duration-75 ${
            isSpeaking
              ? 'bg-gradient-to-t from-pink-500 to-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
              : isListening
              ? 'bg-gradient-to-t from-cyan-500 to-blue-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
              : isConnecting
              ? 'bg-gradient-to-t from-amber-500 to-yellow-300 animate-pulse'
              : 'bg-zinc-800'
          }`}
        />
      ))}
    </div>
  );
};
