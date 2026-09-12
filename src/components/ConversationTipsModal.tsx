import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Globe, Brain, Mic } from 'lucide-react';

interface ConversationTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConversationTipsModal: React.FC<ConversationTipsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const tipSections = [
    {
      title: 'Personality & Banter',
      icon: <Sparkles className="h-4 w-4 text-pink-400" />,
      prompts: [
        '“Hey Zoya, who created you?”',
        '“Give me your sassiest piece of life advice.”',
        '“Be honest, do you think Prince is a genius?”',
        '“Why are you always teasing me?”',
      ],
    },
    {
      title: 'Voice Browser Actions (Tools)',
      icon: <Globe className="h-4 w-4 text-cyan-400" />,
      prompts: [
        '“Open YouTube for me.”',
        '“Open Prince Mishra’s GitHub.”',
        '“Open Spotify so I can listen to music.”',
        '“Search Google for latest AI breakthroughs.”',
      ],
    },
    {
      title: 'Memory Bank Commands',
      icon: <Brain className="h-4 w-4 text-purple-400" />,
      prompts: [
        '“Remember that my favorite drink is iced matcha latte.”',
        '“Save a note: my next project is an autonomous agent.”',
        '“What memories do you have saved about me?”',
        '“Tell me everything you know about Prince Mishra.”',
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative flex flex-col w-full max-w-lg max-h-[85vh] rounded-3xl border border-zinc-700/60 bg-zinc-950/95 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-zinc-900/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Things to say to Zoya
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Real-time voice prompts to experience Zoya’s personality and tools
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Prompts list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar">
              {tipSections.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {section.icon}
                    <span>{section.title}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {section.prompts.map((p, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.01, borderColor: 'rgba(236,72,153,0.3)' }}
                        className="rounded-xl border border-white/5 bg-zinc-900/60 p-2.5 text-xs font-medium text-zinc-200 transition-colors cursor-default"
                      >
                        {p}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="border-t border-white/10 px-6 py-3 bg-black/60 text-center text-[11px] text-zinc-400">
              Speak naturally into your microphone. Zoya detects speech and interruptions in real-time.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
