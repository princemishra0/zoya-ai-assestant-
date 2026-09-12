import React from 'react';
import { usePerformanceMetrics } from '../hooks/usePerformanceMetrics';
import { Cpu, HardDrive } from 'lucide-react';

export const PerformanceWidget: React.FC = () => {
  const { fps, ram } = usePerformanceMetrics();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-full border border-white/5 bg-zinc-950/40 px-3 py-1.5 text-[10px] font-mono text-zinc-400 shadow-lg backdrop-blur-md pointer-events-none transition-all hover:bg-zinc-950/60">
      <div className="flex items-center gap-1.5">
        <Cpu className="h-3 w-3 text-emerald-400 opacity-70" />
        <span className={fps < 30 ? 'text-rose-400' : 'text-zinc-300'}>{fps} FPS</span>
      </div>
      <div className="h-3 w-[1px] bg-white/10" />
      <div className="flex items-center gap-1.5">
        <HardDrive className="h-3 w-3 text-cyan-400 opacity-70" />
        <span className="text-zinc-300">{ram > 0 ? `${ram} MB` : '--'}</span>
      </div>
    </div>
  );
};
