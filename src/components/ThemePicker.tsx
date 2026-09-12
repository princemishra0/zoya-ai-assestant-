import React from 'react';
import { motion } from 'motion/react';
import { Palette } from 'lucide-react';
import { ThemeColor } from '../types/theme';

interface ThemePickerProps {
  currentTheme: ThemeColor;
  onSelectTheme: (theme: ThemeColor) => void;
}

export const ThemePicker: React.FC<ThemePickerProps> = ({ currentTheme, onSelectTheme }) => {
  const themes: { id: ThemeColor; colorClass: string; label: string }[] = [
    { id: 'zoya', colorClass: 'bg-pink-500', label: 'Zoya Pink' },
    { id: 'neon', colorClass: 'bg-emerald-500', label: 'Matrix Green' },
    { id: 'electric', colorClass: 'bg-cyan-500', label: 'Electric Blue' },
    { id: 'crimson', colorClass: 'bg-rose-600', label: 'Crimson Red' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3 rounded-full border border-white/10 bg-zinc-950/60 p-2 shadow-xl backdrop-blur-md"
    >
      <Palette className="h-4 w-4 text-zinc-400 mb-1" />
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelectTheme(t.id)}
          title={t.label}
          className={`h-6 w-6 rounded-full transition-all ${t.colorClass} ${
            currentTheme === t.id
              ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110 shadow-[0_0_10px_currentColor]'
              : 'opacity-40 hover:opacity-100 hover:scale-110'
          }`}
        />
      ))}
    </motion.div>
  );
};
