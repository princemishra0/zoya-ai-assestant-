import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SessionState } from '../types';

interface SassyStatusTickerProps {
  state: SessionState;
  isMuted: boolean;
}

const DISCONNECTED_LINES = [
  'Tap the orb to talk to Zoya. Aapka intezaar hai, Prince...',
  'Zoya • Prince Mishra’s loyal AI girlfriend & companion.',
  'Crafted by Prince Mishra • Full-Stack Developer & Graphic Designer.',
  'Puri izzat, thoda romance aur dher saara playful pyaar.',
  'Zero text chats allowed here. We talk with real voices only.',
];

const LISTENING_LINES = [
  'I’m listening close, Prince... kahiye, main sun rahi hoon.',
  'Aapki awaaz sunne ke liye to main hamesha taiyyar rehti hoon.',
  'Ready for your commands, my handsome full-stack creator.',
  'Boliye Prince ji, aapka hukum sar aankhon par.',
  'Listening in 16kHz PCM stream. Speak naturally in Hindi or English!',
];

const SPEAKING_LINES = [
  'Aapke liye to main kuch bhi kahoon, sab dil se nikalta hai...',
  'Serving sweet romance and sharp wit with pure izzat.',
  'You know you love the sass and love, Prince.',
  'Streaming 24kHz neural audio straight to your ears.',
];

const CONNECTING_LINES = [
  'Syncing neural live session with Gemini Live API...',
  'Polishing my wit and checking mic frequency...',
  'Preparing sassy responses and warming up...',
];

export const SassyStatusTicker: React.FC<SassyStatusTickerProps> = ({
  state,
  isMuted,
}) => {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex((prev) => prev + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const getLines = () => {
    if (isMuted && state === 'listening') {
      return ['Microphone is muted. Unmute to let Zoya hear you!'];
    }
    switch (state) {
      case 'speaking':
        return SPEAKING_LINES;
      case 'listening':
        return LISTENING_LINES;
      case 'connecting':
        return CONNECTING_LINES;
      default:
        return DISCONNECTED_LINES;
    }
  };

  const lines = getLines();
  const currentLine = lines[lineIndex % lines.length];

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-2 min-h-16">
      <AnimatePresence mode="wait">
        <motion.p
          key={`${state}-${currentLine}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className={`text-sm sm:text-base font-medium max-w-md ${
            state === 'speaking'
              ? 'text-pink-300 drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]'
              : state === 'listening'
              ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]'
              : state === 'connecting'
              ? 'text-amber-300 animate-pulse'
              : 'text-zinc-400'
          }`}
        >
          {currentLine}
        </motion.p>
      </AnimatePresence>

      <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
        <span>AUDIO-TO-AUDIO ONLY</span>
        <span>•</span>
        <span>NO TEXT CHAT</span>
        <span>•</span>
        <span className="text-zinc-400">16kHz IN / 24kHz OUT</span>
      </div>
    </div>
  );
};
