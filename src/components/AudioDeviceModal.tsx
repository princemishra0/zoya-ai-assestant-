import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Volume2, X, Settings } from 'lucide-react';
import { getAudioDevices } from '../lib/audio-streamer';

interface AudioDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMicId: string;
  selectedSpeakerId: string;
  onSelectMic: (id: string) => void;
  onSelectSpeaker: (id: string) => void;
  isConnected: boolean;
}

export const AudioDeviceModal: React.FC<AudioDeviceModalProps> = ({
  isOpen,
  onClose,
  selectedMicId,
  selectedSpeakerId,
  onSelectMic,
  onSelectSpeaker,
  isConnected,
}) => {
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAudioDevices()
        .then((res) => {
          setMicrophones(res.microphones);
          setSpeakers(res.speakers);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-pink-400" />
                <h2 className="text-base font-semibold text-white">Audio Device Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-400 text-sm animate-pulse">
                Scanning audio hardware...
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Microphone Selector */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <Mic className="h-4 w-4 text-cyan-400" />
                    Preferred Microphone (Input)
                  </label>
                  <select
                    value={selectedMicId}
                    onChange={(e) => onSelectMic(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Default System Microphone</option>
                    {microphones.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone (${mic.deviceId.slice(0, 6)}...)`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speaker Selector */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <Volume2 className="h-4 w-4 text-emerald-400" />
                    Preferred Speaker (Output)
                  </label>
                  <select
                    value={selectedSpeakerId}
                    onChange={(e) => onSelectSpeaker(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Default System Speaker</option>
                    {speakers.map((spk) => (
                      <option key={spk.deviceId} value={spk.deviceId}>
                        {spk.label || `Speaker (${spk.deviceId.slice(0, 6)}...)`}
                      </option>
                    ))}
                  </select>
                  {speakers.length === 0 && (
                    <span className="text-[10px] text-zinc-500">
                      Note: Speaker device labels require browser permissions or may use default output.
                    </span>
                  )}
                </div>

                {isConnected && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-[11px] text-amber-300">
                    ⚠️ Disconnect Zoya and reconnect for microphone changes to take effect immediately.
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:brightness-115 transition"
              >
                Save & Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
