import React from 'react';
import { motion } from 'motion/react';
import { Bot, Sparkles, Briefcase, Zap, Smile } from 'lucide-react';
import { PersonalityMode } from '../types/theme';

interface PersonalitySelectorProps {
  currentPersonality: PersonalityMode;
  onSelectPersonality: (mode: PersonalityMode) => void;
  isConnected: boolean;
}

export const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({
  currentPersonality,
  onSelectPersonality,
  isConnected,
}) => {
  const modes: { id: PersonalityMode; label: string; icon: any; desc: string }[] = [
    { id: 'zoya', label: 'Zoya (Default Sassy & Sweet)', icon: Sparkles, desc: 'Flirty, witty, romantic girlfriend' },
    { id: 'professional', label: 'Professional', icon: Briefcase, desc: 'Corporate chief of staff & polite' },
    { id: 'sarcastic', label: 'Sarcastic', icon: Smile, desc: 'Dry humor, roasts & witty snark' },
    { id: 'hyper-energetic', label: 'Hyper-Energetic', icon: Zap, desc: 'Extremely enthusiastic & bubbly' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-950/70 p-3 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-zinc-400 border-b border-white/10 mb-1">
        <Bot className="h-3.5 w-3.5 text-pink-400" />
        <span>Personality Mode</span>
      </div>
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = currentPersonality === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelectPersonality(m.id)}
            disabled={isConnected}
            title={m.desc + (isConnected ? ' (Disconnect session first to change personality)' : '')}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all ${
              isActive
                ? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 border border-pink-500/50 text-white shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent'
            } ${isConnected ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-pink-400' : 'text-zinc-500'}`} />
            <div className="flex flex-col">
              <span className="text-xs font-medium">{m.label}</span>
              <span className="text-[10px] text-zinc-500">{m.desc}</span>
            </div>
          </button>
        );
      })}
      {isConnected && (
        <span className="text-[10px] text-amber-400/95 text-center mt-1 px-1">
          Disconnect to switch personality
        </span>
      )}
    </motion.div>
  );
};
