'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Get version from environment (matches package.json)
const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // Don't show again for 24 hours after dismiss

const STORAGE_KEY = 'nextpik_version_dismissed';
const LAST_SEEN_VERSION_KEY = 'nextpik_last_version';

export function VersionChecker() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [newVersion, setNewVersion] = useState<string | null>(null);

  useEffect(() => {
    // Skip in development
    if (process.env.NODE_ENV !== 'production') return;

    const checkVersion = async () => {
      try {
        // Check if user dismissed recently
        const dismissedUntil = localStorage.getItem(STORAGE_KEY);
        if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
          return; // Still in dismiss period
        }

        // Fetch version.json with cache-busting timestamp
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
        });

        if (!response.ok) return;

        const data = await response.json();
        const serverVersion = data.version;
        const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);

        // Only show if:
        // 1. Server version exists
        // 2. Server version is different from current
        // 3. User hasn't seen this version before
        if (
          serverVersion &&
          serverVersion !== CURRENT_VERSION &&
          serverVersion !== lastSeenVersion
        ) {
          setNewVersion(serverVersion);
          setShowUpdatePrompt(true);
        }
      } catch (error) {
        console.error('Failed to check version:', error);
      }
    };

    // Check immediately on mount
    checkVersion();

    // Then check periodically
    const interval = setInterval(checkVersion, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    // Store the new version so we don't prompt again
    if (newVersion) {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, newVersion);
    }

    // Clear all caches and hard reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    // Force hard reload
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);

    // Store dismiss timestamp (24 hours from now)
    const dismissUntil = Date.now() + DISMISS_DURATION;
    localStorage.setItem(STORAGE_KEY, dismissUntil.toString());

    // Also store the version we showed, so we don't show it again
    if (newVersion) {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, newVersion);
    }
  };

  return (
    <AnimatePresence>
      {showUpdatePrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 right-4 z-[9999] max-w-md"
        >
          <div className="bg-gradient-to-r from-black to-neutral-800 text-white rounded-xl shadow-2xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
              {/* Update Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1">Update Available</h3>
                <p className="text-sm text-white/80 mb-3">
                  A new version of NextPik is available. Please refresh to get the latest features
                  and improvements.
                </p>
                {newVersion && (
                  <p className="text-xs text-white/60 mb-3">
                    Current: {CURRENT_VERSION} → New: {newVersion}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-colors text-sm"
                  >
                    Refresh Now
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm"
                  >
                    Later
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
