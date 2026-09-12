import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Power, Radio, Sparkles } from 'lucide-react';
import { SessionState } from '../types';
import { AudioStreamer } from '../lib/audio-streamer';
import { ThemeColor } from '../types/theme';

interface VisualizerOrbProps {
  state: SessionState;
  audioStreamer: AudioStreamer | null;
  isMuted: boolean;
  theme: ThemeColor;
  isPowerSaver?: boolean;
  onToggleSession: () => void;
}

export const VisualizerOrb: React.FC<VisualizerOrbProps> = ({
  state,
  audioStreamer,
  isMuted,
  theme,
  isPowerSaver = false,
  onToggleSession,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const orbRef = useRef<HTMLButtonElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const smoothedVolRef = useRef(0);

  // 60FPS dynamic canvas rendering driven by live audio frequencies
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    let lastRenderTime = 0;

    const render = (timestamp: number = performance.now()) => {
      if (isPowerSaver) {
        if (timestamp - lastRenderTime < 66) { // ~15 FPS throttle
          animFrameIdRef.current = requestAnimationFrame(render);
          return;
        }
        lastRenderTime = timestamp;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 95, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      const isSpeaking = state === 'speaking';
      const isListening = state === 'listening';
      const isConnecting = state === 'connecting';
      const isDisconnected = state === 'disconnected';

      // Sample volume from streamer
      let rawVolume = 0;
      let freqArray: Uint8Array | null = null;

      if (audioStreamer && (isSpeaking || isListening)) {
        const metrics = audioStreamer.getVisualizerMetrics(isSpeaking);
        rawVolume = metrics.volume;
        freqArray = metrics.frequencies;
      }

      // Smooth volume transitions
      smoothedVolRef.current += (rawVolume - smoothedVolRef.current) * 0.25;
      const vol = smoothedVolRef.current;

      phase += 0.04 + vol * 0.06;

      // Dynamically intensify the glow of the background and orb based on Zoya's volume
      if (glowRef.current && orbRef.current) {
        if (isSpeaking) {
          const glowScale = 1.25 + vol * 0.7;
          const opacity = 0.3 + vol * 0.6;
          glowRef.current.style.transform = `scale(${glowScale})`;
          glowRef.current.style.opacity = `${opacity}`;

          const shadowBlur = 50 + vol * 120;
          const shadowSpread = vol * 30;
          
          let shadowColor = `rgba(236,72,153,${0.55 + vol * 0.45})`; // default pink
          if (theme === 'neon') shadowColor = `rgba(16,185,129,${0.55 + vol * 0.45})`;
          if (theme === 'electric') shadowColor = `rgba(6,182,212,${0.55 + vol * 0.45})`;
          if (theme === 'crimson') shadowColor = `rgba(225,29,72,${0.55 + vol * 0.45})`;
          
          orbRef.current.style.boxShadow = `0 0 ${shadowBlur}px ${shadowSpread}px ${shadowColor}`;
        } else if (isListening) {
          const glowScale = 1.1 + vol * 0.3;
          glowRef.current.style.transform = `scale(${glowScale})`;
          glowRef.current.style.opacity = `1`;

          const shadowBlur = 45 + vol * 60;
          const shadowSpread = vol * 10;
          
          let shadowColor = `rgba(6,182,212,${0.45 + vol * 0.3})`; // default cyan
          if (theme === 'neon') shadowColor = `rgba(132,204,22,${0.45 + vol * 0.3})`;
          if (theme === 'electric') shadowColor = `rgba(59,130,246,${0.45 + vol * 0.3})`;
          if (theme === 'crimson') shadowColor = `rgba(244,63,94,${0.45 + vol * 0.3})`;
          
          orbRef.current.style.boxShadow = `0 0 ${shadowBlur}px ${shadowSpread}px ${shadowColor}`;
        } else {
          // Reset inline styles to let Tailwind handle the baseline states
          glowRef.current.style.transform = '';
          glowRef.current.style.opacity = '1';
          orbRef.current.style.boxShadow = '';
        }
      }

      if (isDisconnected) {
        // Subtle ambient neon rings
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 115 + Math.sin(phase * 0.5) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.restore();
      } else if (isConnecting) {
        // Fast revolving laser arcs
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 120, phase * 2, phase * 2 + Math.PI * 0.9);
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 15;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, 132, -phase * 2.5, -phase * 2.5 + Math.PI * 0.7);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();
      } else {
        // Active Audio Visualization: Fluid Organic Frequency Ribbons
        const baseRadius = 110;
        const maxAmplitude = isSpeaking ? 42 : 28;
        const waveCount = 5;

        // Multi-layer glowing frequency rings
        for (let layer = 0; layer < 3; layer++) {
          ctx.save();
          ctx.beginPath();

          const layerRadius = baseRadius + layer * 14 + vol * 25;
          const points = 72;
          const layerOffset = (layer * Math.PI) / 3;

          for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            let freqInfluence = 0;
            if (freqArray && freqArray.length > 0) {
              const freqIdx = Math.floor((i / points) * (freqArray.length / 2));
              freqInfluence = (freqArray[freqIdx] / 255) * maxAmplitude;
            }

            const wave =
              Math.sin(angle * waveCount + phase + layerOffset) * (vol * 18 + 3) +
              Math.cos(angle * 3 - phase * 0.8) * (vol * 12 + 2);

            const r = layerRadius + wave + freqInfluence;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.closePath();

          if (isSpeaking) {
            let grad = ctx.createLinearGradient(0, centerY - 150, 0, centerY + 150);
            if (theme === 'neon') {
              grad.addColorStop(0, `rgba(16, 185, 129, ${0.45 - layer * 0.12})`);
              grad.addColorStop(0.5, `rgba(34, 197, 94, ${0.4 - layer * 0.1})`);
              grad.addColorStop(1, `rgba(132, 204, 22, ${0.45 - layer * 0.12})`);
              ctx.shadowColor = '#10b981';
            } else if (theme === 'electric') {
              grad.addColorStop(0, `rgba(6, 182, 212, ${0.45 - layer * 0.12})`);
              grad.addColorStop(0.5, `rgba(59, 130, 246, ${0.4 - layer * 0.1})`);
              grad.addColorStop(1, `rgba(99, 102, 241, ${0.45 - layer * 0.12})`);
              ctx.shadowColor = '#06b6d4';
            } else if (theme === 'crimson') {
              grad.addColorStop(0, `rgba(225, 29, 72, ${0.45 - layer * 0.12})`);
              grad.addColorStop(0.5, `rgba(244, 63, 94, ${0.4 - layer * 0.1})`);
              grad.addColorStop(1, `rgba(239, 68, 68, ${0.45 - layer * 0.12})`);
              ctx.shadowColor = '#e11d48';
            } else { // zoya
              grad.addColorStop(0, `rgba(236, 72, 153, ${0.45 - layer * 0.12})`);
              grad.addColorStop(0.5, `rgba(168, 85, 247, ${0.4 - layer * 0.1})`);
              grad.addColorStop(1, `rgba(244, 63, 94, ${0.45 - layer * 0.12})`);
              ctx.shadowColor = '#ec4899';
            }
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.5 - layer * 0.5;
            ctx.shadowBlur = 18 - layer * 4;
          } else {
            // User Listening
            let grad = ctx.createLinearGradient(0, centerY - 150, 0, centerY + 150);
            if (theme === 'neon') {
              grad.addColorStop(0, `rgba(132, 204, 22, ${0.45 - layer * 0.12})`);
              grad.addColorStop(0.5, `rgba(16, 185, 129, ${0.35 - layer * 0.1})`);
              grad.addColorStop(1, `rgba(6, 95, 70, ${0.4 - layer * 0.12})`);
              ctx.shadowColor = '#84cc16';
            } else if (theme === 'electric') {
              grad.addColorStop(0, `rgba(99, 102, 241, ${0.45 - layer * 0.12})`);
              grad.addColorStop(0.5, `rgba(6, 182, 212, ${0.35 - layer * 0.1})`);
              grad.addColorStop(1, `rgba(30, 58, 138, ${0.4 - layer * 0.12})`);
              ctx.shadowColor = '#6366f1';
            } else if (theme === 'crimson') {
              grad.addColorStop(0, `rgba(244, 63, 94, ${0.45 - layer * 0.12})`);
              grad.addColorStop(0.5, `rgba(225, 29, 72, ${0.35 - layer * 0.1})`);
              grad.addColorStop(1, `rgba(159, 18, 57, ${0.4 - layer * 0.12})`);
              ctx.shadowColor = '#f43f5e';
            } else { // zoya
              grad.addColorStop(0, `rgba(6, 182, 212, ${0.45 - layer * 0.12})`);
              grad.addColorStop(0.5, `rgba(59, 130, 246, ${0.35 - layer * 0.1})`);
              grad.addColorStop(1, `rgba(168, 85, 247, ${0.4 - layer * 0.12})`);
              ctx.shadowColor = '#06b6d4';
            }
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2 - layer * 0.4;
            ctx.shadowBlur = 14 - layer * 3;
          }

          ctx.stroke();
          ctx.restore();
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [state, audioStreamer]);

  // Center button icon & state color mapping
  const isConnected = state === 'listening' || state === 'speaking';
  const isConnecting = state === 'connecting';
  const isSpeaking = state === 'speaking';

  // Helper for dynamic tailwind classes based on theme
  const getBackgroundGlow = () => {
    if (isSpeaking) {
      if (theme === 'neon') return 'bg-gradient-to-tr from-emerald-500/30 via-green-600/35 to-lime-400/25 scale-125';
      if (theme === 'electric') return 'bg-gradient-to-tr from-cyan-500/30 via-blue-600/35 to-indigo-400/25 scale-125';
      if (theme === 'crimson') return 'bg-gradient-to-tr from-rose-500/30 via-red-600/35 to-orange-400/25 scale-125';
      return 'bg-gradient-to-tr from-pink-500/30 via-purple-600/35 to-rose-400/25 scale-125';
    }
    if (isConnected) {
      if (theme === 'neon') return 'bg-gradient-to-tr from-lime-500/25 via-emerald-600/25 to-green-500/20 scale-110';
      if (theme === 'electric') return 'bg-gradient-to-tr from-indigo-500/25 via-cyan-600/25 to-blue-500/20 scale-110';
      if (theme === 'crimson') return 'bg-gradient-to-tr from-red-500/25 via-rose-600/25 to-pink-500/20 scale-110';
      return 'bg-gradient-to-tr from-cyan-500/25 via-blue-600/25 to-purple-500/20 scale-110';
    }
    if (isConnecting) return 'bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-600/20 animate-pulse';
    
    if (theme === 'neon') return 'bg-emerald-900/10 scale-90';
    if (theme === 'electric') return 'bg-cyan-900/10 scale-90';
    if (theme === 'crimson') return 'bg-rose-900/10 scale-90';
    return 'bg-purple-900/10 scale-90';
  };

  const getOrbStyle = () => {
    if (isSpeaking) {
      if (theme === 'neon') return 'border-emerald-400/80 bg-gradient-to-br from-emerald-950/80 via-green-950/90 to-black shadow-[0_0_50px_rgba(16,185,129,0.55)]';
      if (theme === 'electric') return 'border-cyan-400/80 bg-gradient-to-br from-cyan-950/80 via-blue-950/90 to-black shadow-[0_0_50px_rgba(6,182,212,0.55)]';
      if (theme === 'crimson') return 'border-rose-400/80 bg-gradient-to-br from-rose-950/80 via-red-950/90 to-black shadow-[0_0_50px_rgba(225,29,72,0.55)]';
      return 'border-pink-400/80 bg-gradient-to-br from-pink-950/80 via-purple-950/90 to-black shadow-[0_0_50px_rgba(236,72,153,0.55)]';
    }
    if (isConnected) {
      if (theme === 'neon') return 'border-lime-400/70 bg-gradient-to-br from-lime-950/80 via-emerald-950/90 to-black shadow-[0_0_45px_rgba(132,204,22,0.45)]';
      if (theme === 'electric') return 'border-indigo-400/70 bg-gradient-to-br from-indigo-950/80 via-cyan-950/90 to-black shadow-[0_0_45px_rgba(99,102,241,0.45)]';
      if (theme === 'crimson') return 'border-red-400/70 bg-gradient-to-br from-red-950/80 via-rose-950/90 to-black shadow-[0_0_45px_rgba(244,63,94,0.45)]';
      return 'border-cyan-400/70 bg-gradient-to-br from-cyan-950/80 via-indigo-950/90 to-black shadow-[0_0_45px_rgba(6,182,212,0.45)]';
    }
    if (isConnecting) return 'border-amber-400/60 bg-gradient-to-br from-amber-950/60 via-purple-950/70 to-black shadow-[0_0_35px_rgba(245,158,11,0.35)]';
    
    if (theme === 'neon') return 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-950/90 to-black hover:border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]';
    if (theme === 'electric') return 'border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-zinc-950/90 to-black hover:border-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]';
    if (theme === 'crimson') return 'border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-zinc-950/90 to-black hover:border-rose-400/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]';
    return 'border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-zinc-950/90 to-black hover:border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]';
  };

  const getIconThemeClass = () => {
    if (theme === 'neon') return 'text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]';
    if (theme === 'electric') return 'text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]';
    if (theme === 'crimson') return 'text-rose-300 drop-shadow-[0_0_10px_rgba(225,29,72,0.6)]';
    return 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]';
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Dynamic 350x350 Canvas for fluid particle waveform rings */}
      <canvas
        ref={canvasRef}
        width={360}
        height={360}
        className="pointer-events-none absolute z-0"
      />

      {/* Atmospheric Background Glow Radial */}
      <div
        ref={glowRef}
        className={`pointer-events-none absolute h-72 w-72 rounded-full transition-all duration-700 blur-3xl ${getBackgroundGlow()}`}
      />

      {/* Main Touch Orb Button */}
      <motion.button
        ref={orbRef}
        id="zoya-main-orb-button"
        onClick={onToggleSession}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        disabled={isConnecting}
        aria-label={isConnected ? 'Disconnect Zoya session' : 'Connect to Zoya'}
        className={`relative z-10 flex h-48 w-48 cursor-pointer items-center justify-center rounded-full border transition-all duration-500 shadow-2xl backdrop-blur-md focus:outline-none ${getOrbStyle()}`}
      >
        {/* Inner Glass Ring */}
        <div className="absolute inset-2 rounded-full border border-white/10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        {/* Central Core Element */}
        <div className="flex flex-col items-center justify-center">
          {isConnecting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="flex items-center justify-center"
            >
              <Radio className="h-12 w-12 text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
            </motion.div>
          ) : isSpeaking ? (
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="flex items-center justify-center"
            >
              <Sparkles className={`h-14 w-14 ${getIconThemeClass()}`} />
            </motion.div>
          ) : isConnected ? (
            isMuted ? (
              <MicOff className="h-12 w-12 text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]" />
            ) : (
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <Mic className={`h-14 w-14 ${getIconThemeClass()}`} />
              </motion.div>
            )
          ) : (
            <div className="flex flex-col items-center">
              <Power className={`h-12 w-12 transition-transform group-hover:scale-110 ${getIconThemeClass()}`} />
              <span className="mt-2 text-xs font-medium tracking-wider text-purple-200/80 uppercase">
                Wake Zoya
              </span>
            </div>
          )}
        </div>
      </motion.button>
    </div>
  );
};
