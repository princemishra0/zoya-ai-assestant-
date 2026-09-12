import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Download, Terminal, X, Check, Sparkles, Laptop, PackageCheck, Copy } from 'lucide-react';

interface DesktopLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopLauncherModal: React.FC<DesktopLauncherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedLinuxCmd, setCopiedLinuxCmd] = useState(false);
  const [copiedOneLiner, setCopiedOneLiner] = useState(false);
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleDownload = (type: 'setup-linux' | 'setup-windows' | 'desktop' | 'windows' | 'windows-url') => {
    let filename = 'setup_zoya.sh';
    let downloadUrl = '/api/setup/linux';

    if (type === 'setup-linux') {
      filename = 'setup_zoya.sh';
      downloadUrl = '/api/setup/linux';
    } else if (type === 'setup-windows') {
      filename = 'Setup_Zoya.bat';
      downloadUrl = '/api/setup/windows';
    } else if (type === 'desktop') {
      filename = 'Zoya.desktop';
      downloadUrl = '/api/launcher/desktop';
    } else if (type === 'windows') {
      filename = 'Launch_Zoya.bat';
      downloadUrl = '/api/launcher/windows';
    } else if (type === 'windows-url') {
      filename = 'Zoya.url';
      downloadUrl = '/api/launcher/windows-url';
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedFormat(type);
    setTimeout(() => setDownloadedFormat(null), 3500);
  };

  const copyLinuxCommand = () => {
    navigator.clipboard.writeText('chmod +x ~/Desktop/Zoya.desktop');
    setCopiedLinuxCmd(true);
    setTimeout(() => setCopiedLinuxCmd(false), 2000);
  };

  const copyOneLiner = () => {
    navigator.clipboard.writeText(`curl -sSL ${currentOrigin}/api/setup/linux | bash`);
    setCopiedOneLiner(true);
    setTimeout(() => setCopiedOneLiner(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative flex flex-col w-full max-w-xl max-h-[90vh] rounded-3xl border border-cyan-500/30 bg-zinc-950/95 shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-gradient-to-r from-cyan-950/40 via-purple-950/20 to-black">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Zoya Desktop Setup & Installer</h2>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Automated
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    One-click setup files to install Zoya & Companion on your PC
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
              
              {/* Highlighted Section: 1-Click Automated Setup Files */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Recommended: Complete Setup Installers
                  </span>
                  <span className="text-[11px] text-zinc-400">Installs Launcher + Shutdown Agent</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Linux Complete Setup */}
                  <div className="flex flex-col justify-between rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-cyan-950/40 to-zinc-900/60 p-4 shadow-lg hover:border-cyan-400 transition">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-cyan-400" />
                        <h3 className="text-sm font-semibold text-white">Linux Setup Installer</h3>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Automatic installer for Ubuntu, Debian, Mint & Arch. Creates Desktop icon, App Menu entry & sets up Python companion.
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload('setup-linux')}
                      className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.35)] transition active:scale-95"
                    >
                      {downloadedFormat === 'setup-linux' ? (
                        <>
                          <Check className="h-4 w-4 text-white" />
                          Downloaded setup_zoya.sh!
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download setup_zoya.sh
                        </>
                      )}
                    </button>
                  </div>

                  {/* Windows Complete Setup */}
                  <div className="flex flex-col justify-between rounded-2xl border border-purple-500/40 bg-gradient-to-b from-purple-950/40 to-zinc-900/60 p-4 shadow-lg hover:border-purple-400 transition">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-purple-400" />
                        <h3 className="text-sm font-semibold text-white">Windows Setup Installer</h3>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Batch installer for Windows 10 & 11. Generates Desktop shortcut, tests Python & pip requests, and launches Zoya.
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload('setup-windows')}
                      className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-purple-600 hover:bg-purple-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.35)] transition active:scale-95"
                    >
                      {downloadedFormat === 'setup-windows' ? (
                        <>
                          <Check className="h-4 w-4 text-white" />
                          Downloaded Setup_Zoya.bat!
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download Setup_Zoya.bat
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Linux Terminal One-Liner */}
              <div className="rounded-2xl border border-white/10 bg-black/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                    Linux Instant One-Liner Install (Terminal):
                  </span>
                  <button
                    onClick={copyOneLiner}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition font-medium"
                  >
                    {copiedOneLiner ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedOneLiner ? 'Copied command!' : 'Copy'}
                  </button>
                </div>
                <div className="rounded-xl bg-zinc-950 p-2.5 font-mono text-[11px] text-cyan-200 border border-white/5 break-all select-all">
                  curl -sSL {currentOrigin}/api/setup/linux | bash
                </div>
              </div>

              {/* Individual Launcher Files */}
              <div className="space-y-2 pt-1 border-t border-white/10">
                <span className="text-xs font-semibold text-zinc-400">
                  Or Download Individual Files:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownload('desktop')}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-cyan-400" />
                    Zoya.desktop (Linux)
                  </button>
                  <button
                    onClick={() => handleDownload('windows-url')}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-400" />
                    Zoya.url (Win Shortcut)
                  </button>
                  <button
                    onClick={() => handleDownload('windows')}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-purple-400" />
                    Launch_Zoya.bat
                  </button>
                  <a
                    href="/zoya_companion.py"
                    download="zoya_companion.py"
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-emerald-300 hover:bg-zinc-800 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    zoya_companion.py
                  </a>
                </div>
              </div>

              {/* Quick Instructions */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  How to run after downloading:
                </h4>
                <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
                  <div className="border-l-2 border-cyan-500 pl-3 py-0.5">
                    <span className="font-semibold text-zinc-200">Linux:</span> Run{' '}
                    <code className="rounded bg-black/40 px-1 py-0.5 text-cyan-300">bash setup_zoya.sh</code> in terminal. It automatically places the icon on your Desktop and Application Menu!
                  </div>
                  <div className="border-l-2 border-purple-500 pl-3 py-0.5">
                    <span className="font-semibold text-zinc-200">Windows:</span> Simply double-click{' '}
                    <code className="rounded bg-black/40 px-1 py-0.5 text-purple-300">Setup_Zoya.bat</code>. It will create your Desktop shortcuts and configure everything automatically.
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-6 py-3 bg-black/60 flex items-center justify-between text-xs text-zinc-400">
              <span>Automatically configured for your live server URL</span>
              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
