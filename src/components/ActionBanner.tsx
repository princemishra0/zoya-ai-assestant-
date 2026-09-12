import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, BookmarkCheck, Trash2, X } from 'lucide-react';
import { BrowserAction } from '../types';

interface ActionBannerProps {
  action: BrowserAction | null;
  onDismiss: () => void;
}

export const ActionBanner: React.FC<ActionBannerProps> = ({
  action,
  onDismiss,
}) => {
  if (!action) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="flex items-center justify-between gap-3 rounded-2xl border border-pink-500/40 bg-zinc-950/90 p-3.5 shadow-[0_0_30px_rgba(236,72,153,0.3)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              {action.type === 'openWebsite' ? (
                <ExternalLink className="h-5 w-5" />
              ) : action.type === 'memorySaved' ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-pink-400">
                {action.type === 'openWebsite'
                  ? 'Browser Action Executed'
                  : action.type === 'memorySaved'
                  ? 'Zoya Memory Bank Updated'
                  : 'Memory Removed'}
              </span>
              <p className="truncate text-sm font-medium text-white">
                {action.title}
              </p>
              {action.url && (
                <a
                  href={action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline mt-0.5"
                >
                  <span>Open {action.url}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
