import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Database,
  Tag,
  Clock,
  Sparkles,
  Crown,
} from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryBankModalProps {
  isOpen: boolean;
  memories: MemoryItem[];
  ownerName: string;
  onClose: () => void;
  onAddMemory: (title: string, fact: string, category: string) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
}

export const MemoryBankModal: React.FC<MemoryBankModalProps> = ({
  isOpen,
  memories,
  ownerName,
  onClose,
  onAddMemory,
  onDeleteMemory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['all', 'personal', 'preference', 'work', 'secret'];

  const filteredMemories =
    selectedCategory === 'all'
      ? memories
      : memories.filter(
          (m) => m.category.toLowerCase() === selectedCategory.toLowerCase()
        );

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newFact.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddMemory(newTitle.trim(), newFact.trim(), newCategory);
      setNewTitle('');
      setNewFact('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add memory:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-3xl border border-purple-500/40 bg-zinc-950/95 shadow-[0_0_50px_rgba(168,85,247,0.25)] overflow-hidden"
          >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-purple-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Zoya’s Memory Bank
                  </h2>
                  <span className="flex items-center gap-1 rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-semibold text-pink-300 border border-pink-500/30">
                    <Crown className="h-3 w-3 text-amber-400" />
                    {ownerName}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Facts, preferences, and notes Zoya recalls during live voice conversations.
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

          {/* Category Filter Pills & Add Button */}
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-3 bg-black/40">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 rounded-xl border border-pink-500/40 bg-pink-950/40 px-3 py-1.5 text-xs font-semibold text-pink-300 hover:bg-pink-900/60 transition active:scale-95 shadow-[0_0_15px_rgba(236,72,153,0.2)]"
            >
              <Plus className="h-4 w-4" />
              <span>{isAdding ? 'Cancel' : 'Add Memory'}</span>
            </button>
          </div>

          {/* Add Memory Drawer */}
          {isAdding && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleSubmitNew}
              className="border-b border-purple-500/20 bg-purple-950/30 px-6 py-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-pink-300">
                  Teach Zoya a new fact about {ownerName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Memory Title (e.g. Favorite Drink)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                  required
                />

                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-pink-500 focus:outline-none"
                >
                  <option value="personal">Personal</option>
                  <option value="preference">Preference</option>
                  <option value="work">Work & Projects</option>
                  <option value="secret">Secret / Fun</option>
                  <option value="general">General</option>
                </select>
              </div>

              <textarea
                placeholder="Fact or note (e.g. Prince prefers double espresso with a dash of cinnamon)"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-xl px-4 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-pink-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-pink-500 transition shadow-[0_0_15px_rgba(236,72,153,0.5)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save to Memory'}
                </button>
              </div>
            </motion.form>
          )}

          {/* Memories List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
            {filteredMemories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Database className="h-10 w-10 text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-400 font-medium">
                  No memories in this category yet.
                </p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  You can tell Zoya verbally: &ldquo;Remember that I love coding at 2 AM&rdquo;
                  or click &ldquo;Add Memory&rdquo; above!
                </p>
              </div>
            ) : (
              filteredMemories.map((m) => (
                <div
                  key={m.id}
                  className="group relative flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 transition hover:border-purple-500/40 hover:bg-zinc-900/90"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {m.title}
                      </h3>
                      <span className="flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300 border border-purple-500/20 capitalize">
                        <Tag className="h-2.5 w-2.5" />
                        {m.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {m.fact}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 pt-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteMemory(m.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 opacity-60 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-400 transition"
                    title="Delete Memory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-6 py-3 bg-black/50 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-3">
              <span>
                Total Memories: <strong className="text-white">{memories.length}</strong>
              </span>
              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memories, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", `zoya_memory_backup_${new Date().toISOString().split('T')[0]}.json`);
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
                className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                title="Download JSON Backup"
              >
                <Database className="h-3 w-3" />
                Backup
              </button>
            </div>
            <span className="text-pink-400/90 hidden sm:inline">
              Synced with Gemini Live voice memory bank
            </span>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
};
