"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "etnyx_install_dismissed";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // re-show after 7 days

/**
 * In-app install prompt (Chrome/Edge/Android). Listens for the browser's
 * `beforeinstallprompt` event and shows a dismissible bottom-center pill.
 * Hidden when: already running standalone (installed), previously dismissed
 * (7-day cooldown), or the browser doesn't support the event (iOS Safari
 * uses the manual Share → Add to Home Screen flow instead).
 */
export default function InstallPWAButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_TTL_MS) return;
    // Already installed (running as standalone app) — never show
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferred) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setVisible(false);
    } finally {
      setDeferred(null); // the prompt can only be used once per event
    }
  };

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 mx-auto w-fit flex items-center gap-1.5 rounded-full border border-white/10 bg-surface/95 backdrop-blur pl-4 pr-2 py-2 shadow-lg">
      <button
        onClick={install}
        className="flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80 transition-colors"
      >
        <Download className="w-4 h-4" />
        Install App ETNYX
      </button>
      <button
        onClick={dismiss}
        aria-label="Tutup"
        className="w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:bg-white/5 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
