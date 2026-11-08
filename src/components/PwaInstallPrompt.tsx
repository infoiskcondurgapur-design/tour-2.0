import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallPromptProps {
  variant?: 'banner' | 'button' | 'sidebar';
  onInstalled?: () => void;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  variant = 'button',
  onInstalled,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('tour_pwa_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // 1. Check if already in standalone/PWA mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check for iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleIos = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(isAppleIos);

    // 3. Listen for Chrome/Edge/Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 4. Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (onInstalled) onInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error initiating PWA installation:', err);
      }
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      // Fallback hint for desktop or unsupported browsers
      alert('To install Tour 2.0 as an app:\n\n• In Chrome/Edge: Click the install icon (🖥️ or ⬇️) in the address bar at the top-right.\n• In Android Chrome: Tap the 3 dots (⋮) > "Install App" or "Add to Home Screen".');
    }
  };

  const handleDismissBanner = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('tour_pwa_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  // If already running inside installed standalone app, don't show
  if (isInstalled) {
    return null;
  }

  // Variant: COMPACT BUTTON (for Top Navbar)
  if (variant === 'button') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 text-orange-400 hover:text-orange-300 border border-orange-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-orange-500/10"
          title="Install Tour 2.0 as an App on your device"
        >
          <Download className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIosModal && (
          <IosInstructionsModal onClose={() => setShowIosModal(false)} />
        )}
      </>
    );
  }

  // Variant: SIDEBAR MENU ITEM
  if (variant === 'sidebar') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all cursor-pointer text-left"
          title="Install Tour 2.0 App"
        >
          <Download className="w-4 h-4 flex-shrink-0 text-orange-400 animate-bounce" />
          <div className="flex-1 truncate">
            <span className="font-bold block">Install App (PWA)</span>
            <span className="text-[10px] text-slate-400 block">Offline & Home Screen</span>
          </div>
        </button>

        {showIosModal && (
          <IosInstructionsModal onClose={() => setShowIosModal(false)} />
        )}
      </>
    );
  }

  // Variant: NOTIFICATION BANNER (Top floating or above content)
  if (isDismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-orange-500/30 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/20">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-white text-xs sm:text-sm font-bold">Install Tour 2.0 App</strong>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-1.5 py-0.2 rounded">Fast & Offline</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Add to your home screen for quick 1-tap access and offline support during Yatras.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismissBanner}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIosModal && (
        <IosInstructionsModal onClose={() => setShowIosModal(false)} />
      )}
    </>
  );
};

// Modal specifically for iOS users
const IosInstructionsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-white text-sm">Install on iPhone / iPad</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <p>Follow these quick steps in Safari to add Tour 2.0 to your Home Screen:</p>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <span className="font-semibold text-white block">Tap the Share Button</span>
              <span className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                Tap the <Share className="w-3.5 h-3.5 text-blue-400 inline" /> icon at the bottom of Safari.
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <span className="font-semibold text-white block">Select "Add to Home Screen"</span>
              <span className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-orange-400 inline" /> <strong>Add to Home Screen</strong>.
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <span className="font-semibold text-white block">Tap "Add" at Top Right</span>
              <span className="text-slate-400 text-[11px] mt-0.5 block">
                Tour 2.0 will appear on your home screen as a standalone app!
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold"
        >
          Got It!
        </button>
      </div>
    </div>
  );
};
