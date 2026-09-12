import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { SessionState, MemoryItem, BrowserAction } from './types';
import { LiveSession } from './lib/live-session';
import { VideoStreamer } from './lib/video-streamer';
import { StatusHeader } from './components/StatusHeader';
import { VisualizerOrb } from './components/VisualizerOrb';
import { SoundSpectrumBar } from './components/SoundSpectrumBar';
import { SassyStatusTicker } from './components/SassyStatusTicker';
import { ActionBanner } from './components/ActionBanner';
import { MemoryBankModal } from './components/MemoryBankModal';
import { ConversationTipsModal } from './components/ConversationTipsModal';
import { PerformanceWidget } from './components/PerformanceWidget';
import { ThemePicker } from './components/ThemePicker';
import { PersonalitySelector } from './components/PersonalitySelector';
import { AudioDeviceModal } from './components/AudioDeviceModal';
import { FuturisticHudOverlay } from './components/FuturisticHudOverlay';
import { DesktopLauncherModal } from './components/DesktopLauncherModal';
import { ThemeColor, PersonalityMode } from './types/theme';
import { Sparkles, AlertCircle, Mic, Video, MonitorUp } from 'lucide-react';
import { useWakeWord } from './hooks/useWakeWord';

export default function App() {
  const [sessionState, setSessionState] = useState<SessionState>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isScreenActive, setIsScreenActive] = useState(false);
  const [theme, setTheme] = useState<ThemeColor>('zoya');
  const [personality, setPersonality] = useState<PersonalityMode>('zoya');
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [ownerName, setOwnerName] = useState('Prince Mishra');
  const [currentAction, setCurrentAction] = useState<BrowserAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isLauncherModalOpen, setIsLauncherModalOpen] = useState(false);
  const [selectedMicId, setSelectedMicId] = useState('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState('');
  const [isPowerSaver, setIsPowerSaver] = useState(false);
  const [batteryInfo, setBatteryInfo] = useState<{ level: number; charging: boolean } | null>(null);

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryInfo({
            level: Math.round(battery.level * 100),
            charging: battery.charging,
          });
          if (battery.level <= 0.2 && !battery.charging) {
            setIsPowerSaver(true);
          }
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
  }, []);

  const sessionRef = useRef<LiveSession | null>(null);
  const videoStreamerRef = useRef<VideoStreamer | null>(null);

  // Fetch initial memories from REST API
  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch('/api/memories');
      if (res.ok) {
        const data = await res.json();
        if (data.memories) {
          setMemories(data.memories);
        }
        if (data.owner) {
          setOwnerName(data.owner);
        }
      }
    } catch (err) {
      console.warn('Could not fetch initial memories:', err);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  // Handle action auto-dismiss
  useEffect(() => {
    if (currentAction) {
      const timer = setTimeout(() => {
        setCurrentAction(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [currentAction]);

  // Clear error after 6 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Initialize LiveSession instance
  useEffect(() => {
    const session = new LiveSession({
      onStateChange: (newState) => {
        setSessionState(newState);
      },
      onAction: (action) => {
        setCurrentAction(action);
      },
      onMemoryAdded: (newMem) => {
        setMemories((prev) => {
          const exists = prev.some((m) => m.id === newMem.id);
          if (exists) return prev;
          return [newMem, ...prev];
        });
      },
      onMemoryDeleted: (identifier) => {
        setMemories((prev) =>
          prev.filter(
            (m) =>
              m.id !== identifier &&
              m.title.toLowerCase() !== identifier.toLowerCase()
          )
        );
      },
      onInitMemories: (initMems, owner) => {
        setMemories(initMems);
        if (owner) setOwnerName(owner);
      },
      onError: (msg) => {
        setErrorMessage(msg);
      },
    });

    sessionRef.current = session;

    return () => {
      session.disconnect();
    };
  }, []);

  // Connect or disconnect toggle
  const handleToggleSession = useCallback(async () => {
    setErrorMessage(null);
    const session = sessionRef.current;
    if (!session) return;

    if (
      sessionState === 'listening' ||
      sessionState === 'speaking' ||
      sessionState === 'connecting'
    ) {
      session.disconnect();
      if (videoStreamerRef.current) {
        videoStreamerRef.current.stop();
        videoStreamerRef.current = null;
      }
      setIsVideoActive(false);
      setIsScreenActive(false);
    } else {
      await session.connect(personality, selectedMicId, selectedSpeakerId);
    }
  }, [sessionState, personality, selectedMicId, selectedSpeakerId]);

  const toggleCamera = async () => {
    if (sessionState === 'disconnected') return;
    
    if (isVideoActive) {
      if (videoStreamerRef.current && !isScreenActive) {
        videoStreamerRef.current.stop();
        videoStreamerRef.current = null;
      }
      setIsVideoActive(false);
    } else {
      if (videoStreamerRef.current) {
        videoStreamerRef.current.stop();
        setIsScreenActive(false);
      }
      const streamer = new VideoStreamer(sessionRef.current!.getSessionId(), false);
      const success = await streamer.start();
      if (success) {
        videoStreamerRef.current = streamer;
        setIsVideoActive(true);
      } else {
        setErrorMessage("Could not access camera.");
      }
    }
  };

  const toggleScreen = async () => {
    if (sessionState === 'disconnected') return;
    
    if (isScreenActive) {
      if (videoStreamerRef.current && !isVideoActive) {
        videoStreamerRef.current.stop();
        videoStreamerRef.current = null;
      }
      setIsScreenActive(false);
    } else {
      if (videoStreamerRef.current) {
        videoStreamerRef.current.stop();
        setIsVideoActive(false);
      }
      const streamer = new VideoStreamer(sessionRef.current!.getSessionId(), true);
      const success = await streamer.start();
      if (success) {
        videoStreamerRef.current = streamer;
        setIsScreenActive(true);
      } else {
        setErrorMessage("Could not access screen sharing.");
      }
    }
  };

  // Wake word activation
  const { isListening: isWakeWordListening } = useWakeWord('hey zoya', () => {
    // Only connect if disconnected
    if (sessionState === 'disconnected') {
      console.log('Wake word detected! Connecting...');
      handleToggleSession();
    }
  }, sessionState === 'disconnected');

  const handleToggleMute = () => {
    const session = sessionRef.current;
    if (!session) return;
    const muted = session.toggleMute();
    setIsMuted(muted);
  };

  const handleAddMemory = async (
    title: string,
    fact: string,
    category: string
  ) => {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, fact, category }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.memory) {
        setMemories((prev) => [data.memory, ...prev]);
        setCurrentAction({
          id: 'manual-mem-' + Date.now(),
          type: 'memorySaved',
          title: `Added memory: ${title}`,
          timestamp: Date.now(),
        });
      }
    }
  };

  const handleDeleteMemory = async (id: string) => {
    const res = await fetch(`/api/memories/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setMemories((prev) => prev.filter((m) => m.id !== id));
      setCurrentAction({
        id: 'manual-del-' + Date.now(),
        type: 'memoryDeleted',
        title: 'Memory removed from bank',
        timestamp: Date.now(),
      });
    }
  };

  const audioStreamer = sessionRef.current?.getAudioStreamer() || null;

  const getAmbientLight = () => {
    if (theme === 'neon') return { top: 'bg-emerald-900/20', bottomR: 'bg-green-900/15', bottomL: 'bg-lime-950/20' };
    if (theme === 'electric') return { top: 'bg-blue-900/20', bottomR: 'bg-indigo-900/15', bottomL: 'bg-cyan-950/20' };
    if (theme === 'crimson') return { top: 'bg-rose-900/20', bottomR: 'bg-red-900/15', bottomL: 'bg-orange-950/20' };
    return { top: 'bg-purple-900/20', bottomR: 'bg-pink-900/15', bottomL: 'bg-cyan-950/20' };
  };
  const ambient = getAmbientLight();

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#06070c] text-white">
      {/* Ambient Background Lights */}
      <div className={`pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full blur-[130px] transition-colors duration-1000 ${ambient.top}`} />
      <div className={`pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full blur-[120px] transition-colors duration-1000 ${ambient.bottomR}`} />
      <div className={`pointer-events-none absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full blur-[110px] transition-colors duration-1000 ${ambient.bottomL}`} />

      {/* Cyber Grid Texture Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Futuristic Sci-Fi HUD Overlay */}
      <FuturisticHudOverlay state={sessionState} theme={theme} />
      
      {/* Theme Picker */}
      <ThemePicker currentTheme={theme} onSelectTheme={setTheme} />

      {/* Header */}
      <StatusHeader
        state={sessionState}
        isMuted={isMuted}
        memoryCount={memories.length}
        isPowerSaver={isPowerSaver}
        batteryInfo={batteryInfo}
        onToggleMute={handleToggleMute}
        onOpenMemory={() => setIsMemoryModalOpen(true)}
        onOpenTips={() => setIsTipsModalOpen(true)}
        onOpenAudioSettings={() => setIsAudioModalOpen(true)}
        onOpenDesktopLauncher={() => setIsLauncherModalOpen(true)}
        onTogglePowerSaver={() => setIsPowerSaver((prev) => !prev)}
      />

      {/* Action Banner Notification */}
      <ActionBanner
        action={currentAction}
        onDismiss={() => setCurrentAction(null)}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-2xl border border-rose-500/50 bg-rose-950/90 px-4 py-2.5 text-xs text-rose-200 shadow-xl backdrop-blur-xl">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-2 font-bold hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Voice Interactive Stage */}
      <motion.main
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-1 flex-col items-center justify-between px-4 py-6 sm:py-10 max-w-4xl mx-auto w-full"
      >
        {/* Luxury Glass Cockpit Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="relative flex flex-col items-center justify-between w-full flex-1 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Subtle Inner Glow Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-3/4 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 blur-3xl pointer-events-none" />

          {/* Top Hint Pill */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/80 px-4 py-2 backdrop-blur-xl shadow-lg text-xs text-zinc-300"
          >
            {sessionState === 'disconnected' && isWakeWordListening ? (
              <Mic className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-pink-400 animate-pulse" />
            )}
            <span className="font-medium tracking-wide">
              {sessionState === 'disconnected'
                ? isWakeWordListening 
                   ? 'Listening for "Hey Zoya" to wake up...'
                   : 'Tap orb to start real-time voice conversation'
                : sessionState === 'connecting'
                ? 'Connecting to Gemini Live Neural Core...'
                : sessionState === 'speaking'
                ? 'Zoya is responding with 24kHz audio'
                : 'Streaming 16kHz PCM • Speak freely'}
            </span>
          </motion.div>

          {/* Center: Reactive Visualizer Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25, type: 'spring', damping: 22, stiffness: 200 }}
            className="relative z-10 my-auto py-8"
          >
            <VisualizerOrb
              state={sessionState}
              audioStreamer={audioStreamer}
              isMuted={isMuted}
              theme={theme}
              isPowerSaver={isPowerSaver}
              onToggleSession={handleToggleSession}
            />
          </motion.div>

          {/* Bottom Section: Equalizer Bars + Sassy Live Ticker */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full flex flex-col items-center gap-3"
          >
            <SoundSpectrumBar
              state={sessionState}
              audioStreamer={audioStreamer}
            />

            <SassyStatusTicker
              state={sessionState}
              isMuted={isMuted}
            />

            {/* Vision Controls */}
            {sessionState !== 'disconnected' && (
              <div className="flex gap-3 mt-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={toggleCamera}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold tracking-wider transition-all duration-300 ${
                    isVideoActive
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                      : 'bg-zinc-900/80 text-zinc-300 border border-white/10 hover:border-white/30 hover:bg-zinc-800'
                  }`}
                >
                  <Video className="h-4 w-4" />
                  {isVideoActive ? 'Stop Camera' : 'Share Camera'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={toggleScreen}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold tracking-wider transition-all duration-300 ${
                    isScreenActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-zinc-900/80 text-zinc-300 border border-white/10 hover:border-white/30 hover:bg-zinc-800'
                  }`}
                >
                  <MonitorUp className="h-4 w-4" />
                  {isScreenActive ? 'Stop Screen' : 'Share Screen'}
                </motion.button>
              </div>
            )}

            {/* Quick Prompts Bar */}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsTipsModalOpen(true)}
                className="rounded-full border border-white/10 bg-zinc-900/80 px-3.5 py-1.5 text-xs text-zinc-300 hover:border-pink-500/40 hover:text-pink-300 hover:bg-zinc-800/80 transition shadow-sm"
              >
                💬 &ldquo;Who created you?&rdquo;
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsTipsModalOpen(true)}
                className="rounded-full border border-white/10 bg-zinc-900/80 px-3.5 py-1.5 text-xs text-zinc-300 hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-zinc-800/80 transition shadow-sm"
              >
                🌐 &ldquo;Open YouTube for me&rdquo;
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsMemoryModalOpen(true)}
                className="rounded-full border border-white/10 bg-zinc-900/80 px-3.5 py-1.5 text-xs text-zinc-300 hover:border-purple-500/40 hover:text-purple-300 hover:bg-zinc-800/80 transition shadow-sm"
              >
                🧠 &ldquo;Remember my favorite coffee&rdquo;
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLauncherModalOpen(true)}
                className="rounded-full border border-cyan-400/60 bg-gradient-to-r from-cyan-600/30 to-purple-600/30 px-4 py-1.5 text-xs font-bold text-cyan-200 hover:border-cyan-300 hover:text-white hover:brightness-125 transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.35)]"
              >
                📦 Download Setup File (Installer)
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                href="/api/setup/linux"
                download="setup_zoya.sh"
                className="rounded-full border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-1.5 text-xs text-cyan-300 hover:border-cyan-400 hover:text-white transition flex items-center gap-1.5 shadow-sm"
              >
                🐧 setup_zoya.sh
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                href="/api/setup/windows"
                download="Setup_Zoya.bat"
                className="rounded-full border border-purple-500/40 bg-purple-950/40 px-3.5 py-1.5 text-xs text-purple-300 hover:border-purple-400 hover:text-white transition flex items-center gap-1.5 shadow-sm"
              >
                🪟 Setup_Zoya.bat
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                href="/api/launcher/windows-url"
                download="Zoya.url"
                className="rounded-full border border-blue-500/40 bg-blue-950/40 px-3.5 py-1.5 text-xs text-blue-300 hover:border-blue-400 hover:text-white transition flex items-center gap-1.5 shadow-sm"
              >
                🪟 Zoya.url (Desktop Shortcut)
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                href="/api/launcher/desktop"
                download="Zoya.desktop"
                className="rounded-full border border-white/10 bg-zinc-900/80 px-3.5 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition flex items-center gap-1.5 shadow-sm"
              >
                🖥️ Zoya.desktop
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                href="/zoya_companion.py"
                download
                className="rounded-full border border-white/10 bg-zinc-900/80 px-3.5 py-1.5 text-xs text-emerald-400 hover:border-emerald-500/40 hover:text-emerald-300 hover:bg-zinc-800/80 transition flex items-center gap-1.5 shadow-sm"
              >
                💻 zoya_companion.py
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </motion.main>

      {/* Modals */}
      <DesktopLauncherModal
        isOpen={isLauncherModalOpen}
        onClose={() => setIsLauncherModalOpen(false)}
      />

      <MemoryBankModal
        isOpen={isMemoryModalOpen}
        memories={memories}
        ownerName={ownerName}
        onClose={() => setIsMemoryModalOpen(false)}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
      />

      <ConversationTipsModal
        isOpen={isTipsModalOpen}
        onClose={() => setIsTipsModalOpen(false)}
      />

      <AudioDeviceModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        selectedMicId={selectedMicId}
        selectedSpeakerId={selectedSpeakerId}
        onSelectMic={setSelectedMicId}
        onSelectSpeaker={setSelectedSpeakerId}
        isConnected={sessionState !== 'disconnected'}
      />
      
      {/* Non-intrusive Performance Widget */}
      <PerformanceWidget />

      {/* Personality Selector */}
      <PersonalitySelector
        currentPersonality={personality}
        onSelectPersonality={setPersonality}
        isConnected={sessionState !== 'disconnected'}
      />
    </div>
  );
}
