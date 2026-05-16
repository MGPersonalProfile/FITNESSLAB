"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Extend the Window interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  if (Date.now() - ts < DISMISS_DURATION_MS) return true;
  // Expired
  localStorage.removeItem(DISMISS_KEY);
  return false;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Already installed or user dismissed recently
    if (isStandalone() || isDismissed()) return;

    // iOS Safari — no beforeinstallprompt, show manual hint
    if (isIOS()) {
      // Only show if NOT in standalone
      const timer = setTimeout(() => setShowIOSHint(true), 2000);
      return () => clearTimeout(timer);
    }

    // Chrome / Edge / Samsung / etc.
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Also listen for successful install
    const installed = () => {
      setDeferredPrompt(null);
      setVisible(false);
    };
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  // Show banner after a small delay once prompt is captured
  useEffect(() => {
    if (!deferredPrompt) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [deferredPrompt]);

  // Show iOS hint with delay
  useEffect(() => {
    if (showIOSHint) setVisible(true);
  }, [showIOSHint]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
    setDeferredPrompt(null);
    setShowIOSHint(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      } else {
        // User declined — dismiss for a week
        dismiss();
      }
    } catch {
      // Prompt already used or error
    } finally {
      setDeferredPrompt(null);
      setInstalling(false);
    }
  }, [deferredPrompt, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="install-prompt"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-16 left-3 right-3 z-50 rounded-xl overflow-hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Glow effect behind */}
          <div className="absolute -inset-1 bg-red-600/20 rounded-xl blur-xl pointer-events-none" />

          <div className="relative bg-[var(--bg-elev)] border border-[var(--rule)] rounded-xl p-4">
            {/* Top accent line */}
            <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />

            {/* Dismiss X */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-[var(--fg-faint)] hover:text-[var(--fg)] transition-colors"
              aria-label="Cerrar"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="1" y1="1" x2="11" y2="11" />
                <line x1="11" y1="1" x2="1" y2="11" />
              </svg>
            </button>

            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="shrink-0 w-10 h-10 rounded-lg bg-[var(--accent-low)] border border-[var(--accent-dim)]/30 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                  <rect x="3" y="19" width="18" height="2" rx="1" fill="var(--accent)" stroke="none" opacity="0.3" />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-mono text-[10px] tracking-[0.3em] text-[var(--accent)] uppercase mb-1">
                  APP DISPONIBLE
                </p>

                {showIOSHint ? (
                  /* iOS manual instructions */
                  <p className="font-mono text-[11px] text-[var(--fg-dim)] leading-relaxed">
                    Pulsa{" "}
                    <span className="inline-flex items-center align-text-bottom">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14" />
                        <path d="m19 12-7-7-7 7" />
                        <rect x="4" y="19" width="16" height="0" rx="0" />
                      </svg>
                    </span>{" "}
                    y luego <span className="text-[var(--fg)] font-bold">&quot;Añadir a pantalla de inicio&quot;</span>
                  </p>
                ) : (
                  /* Standard install */
                  <>
                    <p className="font-mono text-[11px] text-[var(--fg-dim)] leading-relaxed mb-3">
                      Instala FitnessLAB en tu móvil para acceso rápido sin navegador.
                    </p>
                    <button
                      onClick={handleInstall}
                      disabled={installing}
                      className="w-full bg-[var(--accent)] hover:bg-red-500 disabled:bg-red-900 text-white font-mono text-[11px] font-bold tracking-[0.2em] uppercase py-2.5 rounded-lg transition-all duration-150 active:scale-[0.97]"
                    >
                      {installing ? "INSTALANDO..." : "INSTALAR APP"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bottom decorative ticks */}
            <div className="ticks-h mt-3 opacity-30" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
