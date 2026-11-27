import React, { useState } from 'react';
import { Download, Smartphone, X, Copy, Check, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (isInstalled) {
    return null;
  }

  const isInIframe =
    typeof window !== 'undefined' &&
    (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

  const handleCopyUrl = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        title="Install NursLog onto your device for full offline ward access"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-emerald-800" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        title="Install NursLog onto your phone or tablet for offline ward access"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-800" />
        <span>{isIOS ? 'Install Offline App' : 'Phone Offline Setup'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-sans">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {isIOS
                  ? 'Install NursLog on iPhone / iPad'
                  : 'Install & Offline Setup in Chrome'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="text-xs text-slate-800 space-y-1.5 list-decimal pl-4 leading-relaxed">
                <li>
                  Tap the <strong>Share</strong> button in Safari&rsquo;s toolbar.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> — then open NursLog anytime from your Home Screen.
                </li>
              </ol>
            ) : (
              <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                {isInIframe && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p>
                      Chrome cannot install an app while it is inside a preview frame. Copy the app link below and open it directly in its own Chrome tab first.
                    </p>
                  </div>
                )}

                <ol className="space-y-1.5 list-decimal pl-4 text-slate-800">
                  <li>
                    Open the app directly in Chrome (not inside an embedded preview).
                  </li>
                  <li>
                    Tap Chrome&rsquo;s menu (<strong>⋮</strong>) and choose{' '}
                    <strong>Install app</strong> or{' '}
                    <strong>Add to Home screen</strong>.
                  </li>
                  <li>
                    If Android Chrome is running on an AI Studio private preview link that blocks full app-package minting, tap{' '}
                    <strong>Create shortcut</strong> under <em>Add to Home screen</em> — offline ward storage still works seamlessly.
                  </li>
                </ol>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    className="flex-1 px-2.5 py-1.5 text-[11px] font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-700 truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-lg shrink-0 cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
