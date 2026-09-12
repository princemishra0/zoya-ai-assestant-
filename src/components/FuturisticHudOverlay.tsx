import React from 'react';
import { Shield, Cpu, Activity, Zap, Radio } from 'lucide-react';
import { SessionState } from '../types';
import { ThemeColor } from '../types/theme';

interface FuturisticHudOverlayProps {
  state: SessionState;
  theme: ThemeColor;
}

export const FuturisticHudOverlay: React.FC<FuturisticHudOverlayProps> = ({ state, theme }) => {
  const getThemeAccentColor = () => {
    if (theme === 'neon') return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
    if (theme === 'electric') return 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20';
    if (theme === 'crimson') return 'text-rose-400 border-rose-500/30 bg-rose-950/20';
    return 'text-pink-400 border-pink-500/30 bg-pink-950/20';
  };

  const accentClass = getThemeAccentColor();

  return (
    <>
      {/* Scanline Effect Overlay */}
      <div className="pointer-events-none fixed inset-0 z-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40" />

      {/* Holographic Corner Brackets */}
      <div className="pointer-events-none fixed inset-4 z-20 hidden md:block">
        {/* Top-Left */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/20" />
        <div className="absolute top-2 left-2 text-[9px] font-mono tracking-widest text-zinc-500">
          SYS.ZOYA.v4 // 01
        </div>

        {/* Top-Right */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/20" />
        <div className="absolute top-2 right-2 text-[9px] font-mono tracking-widest text-zinc-500">
          QUANTUM.NET
        </div>

        {/* Bottom-Left */}
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/20" />
        <div className="absolute bottom-2 left-2 text-[9px] font-mono tracking-widest text-zinc-500">
          SECURE_STREAM
        </div>

        {/* Bottom-Right */}
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/20" />
        <div className="absolute bottom-2 right-2 text-[9px] font-mono tracking-widest text-zinc-500">
          AI_CORE_ACTIVE
        </div>
      </div>

      {/* Floating Sci-Fi Telemetry Readouts (Hidden on mobile) */}
      <div className="pointer-events-none fixed left-6 top-24 z-20 hidden lg:flex flex-col gap-2 font-mono text-[10px]">
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 backdrop-blur-md shadow-lg ${accentClass}`}>
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          <span>STATUS: {state.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-1.5 backdrop-blur-md text-zinc-400 shadow-lg">
          <Cpu className="h-3.5 w-3.5 text-purple-400" />
          <span>NEURAL LATENCY: 12ms</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-1.5 backdrop-blur-md text-zinc-400 shadow-lg">
          <Radio className="h-3.5 w-3.5 text-cyan-400" />
          <span>PCM STREAM: 16k/24kHz</span>
        </div>
      </div>

      <div className="pointer-events-none fixed right-6 top-24 z-20 hidden lg:flex flex-col gap-2 font-mono text-[10px] items-end">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-1.5 backdrop-blur-md text-zinc-400 shadow-lg">
          <span>ENCRYPTION: QUANTUM</span>
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-1.5 backdrop-blur-md text-zinc-400 shadow-lg">
          <span>WAKEWORD: ENABLED</span>
          <Zap className="h-3.5 w-3.5 text-amber-400" />
        </div>
      </div>
    </>
  );
};
