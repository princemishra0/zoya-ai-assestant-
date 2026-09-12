import React from 'react';
import { motion } from 'motion/react';
import {
  Mic,
  MicOff,
  Database,
  HelpCircle,
  Maximize2,
  Minimize2,
  Crown,
  ExternalLink,
  Sliders,
  Zap,
  MonitorDown,
} from 'lucide-react';
import { SessionState } from '../types';

interface StatusHeaderProps {
  state: SessionState;
  isMuted: boolean;
  memoryCount: number;
  isPowerSaver: boolean;
  batteryInfo: { level: number; charging: boolean } | null;
  onToggleMute: () => void;
  onOpenMemory: () => void;
  onOpenTips: () => void;
  onOpenAudioSettings: () => void;
  onTogglePowerSaver: () => void;
  onOpenDesktopLauncher?: () => void;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  state,
  isMuted,
  memoryCount,
  isPowerSaver,
  batteryInfo,
  onToggleMute,
  onOpenMemory,
  onOpenTips,
  onOpenAudioSettings,
  onTogglePowerSaver,
  onOpenDesktopLauncher,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getStatusBadge = () => {
    switch (state) {
      case 'speaking':
        return {
          label: 'Zoya is speaking',
          badgeClass:
            'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-[0_0_12px_rgba(236,72,153,0.3)]',
          dotClass: 'bg-pink-400 animate-ping',
        };
      case 'listening':
        return {
          label: isMuted ? 'Mic Muted' : 'Listening to you',
          badgeClass: isMuted
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
          dotClass: isMuted ? 'bg-rose-400' : 'bg-cyan-400 animate-pulse',
        };
      case 'connecting':
        return {
          label: 'Connecting to Neural Core...',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotClass: 'bg-amber-400 animate-bounce',
        };
      default:
        return {
          label: 'Standby • Ready for Prince',
          badgeClass: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
          dotClass: 'bg-zinc-500',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 flex w-full items-center justify-between px-4 py-3 sm:px-6 backdrop-blur-md bg-black/40 border-b border-white/5"
    >
      {/* Brand & Owner */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 p-[1px] shadow-[0_0_15px_rgba(217,70,239,0.35)]">
          <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-black/80 backdrop-blur-sm">
            <span className="font-extrabold text-sm tracking-wider text-pink-400">
              ZOYA
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
              Zoya
            </h1>
            <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-semibold text-pink-400 border border-pink-500/20">
              Live AI
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <Crown className="h-3 w-3 text-amber-400" />
            <span>Master: <strong className="text-zinc-200 font-medium">Prince Mishra</strong></span>
          </div>
        </div>
      </div>

      {/* Center Live Badge (Hidden on mobile small screens) */}
      <div className="hidden sm:flex items-center">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm transition-all duration-300 ${badge.badgeClass}`}
        >
          <span className={`h-2 w-2 rounded-full ${badge.dotClass}`} />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Memory Bank Button */}
        <button
          id="btn-memory-bank"
          onClick={onOpenMemory}
          className="relative flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/40 px-2.5 py-1.5 text-xs font-medium text-purple-200 transition hover:bg-purple-900/60 hover:border-purple-400/50 active:scale-95"
          title="Zoya's Memory Bank"
        >
          <Database className="h-4 w-4 text-purple-400" />
          <span className="hidden md:inline">Memory</span>
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">
            {memoryCount}
          </span>
        </button>

        {/* Mute Button (Enabled when connected) */}
        <button
          id="btn-mute-mic"
          onClick={onToggleMute}
          disabled={state === 'disconnected' || state === 'connecting'}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
            isMuted
              ? 'border-rose-500/50 bg-rose-950/60 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
              : 'border-zinc-700/60 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        {/* Tips Button */}
        <button
          id="btn-tips"
          onClick={onOpenTips}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-900/80 text-zinc-300 transition hover:bg-zinc-800 active:scale-95"
          title="Voice Tips & Prompts"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* Audio Device Settings Button */}
        <button
          id="btn-audio-settings"
          onClick={onOpenAudioSettings}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-900/80 text-zinc-300 transition hover:bg-zinc-800 active:scale-95"
          title="Audio Device Settings (Mic & Speaker)"
        >
          <Sliders className="h-4 w-4" />
        </button>

        {/* Desktop App Launcher (.desktop / .bat) */}
        {onOpenDesktopLauncher && (
          <button
            id="btn-desktop-launcher"
            onClick={onOpenDesktopLauncher}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 transition hover:bg-cyan-900/60 hover:border-cyan-400 active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            title="Download Zoya Desktop Launcher (.desktop / .bat)"
          >
            <MonitorDown className="h-4 w-4" />
          </button>
        )}

        {/* Power Saver Toggle */}
        <button
          id="btn-power-saver"
          onClick={onTogglePowerSaver}
          className={`flex items-center gap-1.5 px-2.5 h-8 rounded-lg border text-xs transition active:scale-95 ${
            isPowerSaver
              ? 'border-amber-500/50 bg-amber-950/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              : 'border-zinc-700/60 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800'
          }`}
          title={isPowerSaver ? 'Power Saver ON (Reduced FPS & Visualizer)' : 'Power Saver OFF'}
        >
          <Zap className={`h-3.5 w-3.5 ${isPowerSaver ? 'text-amber-400 animate-pulse' : 'text-zinc-400'}`} />
          <span className="hidden md:inline font-mono text-[11px]">
            {isPowerSaver ? 'ECO' : batteryInfo ? `${batteryInfo.level}%` : 'PWR'}
          </span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          id="btn-fullscreen"
          onClick={toggleFullscreen}
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-900/80 text-zinc-300 transition hover:bg-zinc-800 active:scale-95"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>

        {/* Pop out to New Tab */}
        <a
          id="btn-open-tab"
          href={window.location.href}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-900/80 text-zinc-300 transition hover:bg-zinc-800 active:scale-95"
          title="Open Zoya in New Window"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </motion.header>
  );
};
