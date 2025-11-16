'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@luxury/ui';

interface SessionTimeoutModalProps {
  /**
   * Session timeout in milliseconds (default: 30 minutes)
   */
  timeout?: number;
  /**
   * Warning time before timeout in milliseconds (default: 2 minutes)
   */
  warningTime?: number;
  /**
   * Callback when session expires
   */
  onTimeout?: () => void;
  /**
   * Callback to extend session
   */
  onExtend?: () => Promise<void>;
}

export function SessionTimeoutModal({
  timeout = 30 * 60 * 1000, // 30 minutes
  warningTime = 2 * 60 * 1000, // 2 minutes
  onTimeout,
  onExtend,
}: SessionTimeoutModalProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  const resetTimers = useCallback(() => {
    setShowWarning(false);
    setTimeLeft(0);
  }, []);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await onExtend?.();
      resetTimers();
    } catch (error) {
      console.error('Failed to extend session:', error);
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = useCallback(() => {
    onTimeout?.();
  }, [onTimeout]);

  useEffect(() => {
    let warningTimer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;
    let timeoutTimer: NodeJS.Timeout;

    // Set warning timer
    warningTimer = setTimeout(() => {
      setShowWarning(true);
      setTimeLeft(warningTime);

      // Start countdown
      countdownInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1000) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      // Set final timeout
      timeoutTimer = setTimeout(() => {
        handleLogout();
      }, warningTime);
    }, timeout - warningTime);

    // Reset on user activity
    const resetOnActivity = () => {
      if (!showWarning) {
        clearTimeout(warningTimer);
        clearInterval(countdownInterval);
        clearTimeout(timeoutTimer);

        warningTimer = setTimeout(() => {
          setShowWarning(true);
          setTimeLeft(warningTime);

          countdownInterval = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1000) {
                clearInterval(countdownInterval);
                return 0;
              }
              return prev - 1000;
            });
          }, 1000);

          timeoutTimer = setTimeout(() => {
            handleLogout();
          }, warningTime);
        }, timeout - warningTime);
      }
    };

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, resetOnActivity);
    });

    return () => {
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      clearTimeout(timeoutTimer);
      events.forEach((event) => {
        document.removeEventListener(event, resetOnActivity);
      });
    };
  }, [timeout, warningTime, showWarning, resetTimers, handleLogout]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleExtendSession}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              {/* Warning Icon */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-light rounded-full mb-4">
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-8 h-8 text-warning-DEFAULT"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </motion.svg>
                </div>

                <h2 className="text-2xl font-bold text-black mb-2">
                  Session Expiring Soon
                </h2>

                <p className="text-neutral-600 text-sm mb-4">
                  Your session will expire due to inactivity
                </p>

                {/* Countdown */}
                <motion.div
                  key={timeLeft}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 bg-neutral-100 rounded-lg px-6 py-3"
                >
                  <svg className="w-5 h-5 text-warning-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-2xl font-bold text-black tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                </motion.div>
              </div>

              {/* Info Message */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-neutral-600 text-center">
                  Click <strong className="text-black">"Stay Logged In"</strong> to continue your session,
                  or you'll be automatically logged out for security.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleExtendSession}
                  disabled={isExtending}
                  className="w-full bg-black text-white py-4 rounded-lg hover:bg-neutral-800 transition-all duration-300 font-semibold disabled:opacity-50"
                >
                  {isExtending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Extending...
                    </span>
                  ) : (
                    'Stay Logged In'
                  )}
                </Button>

                <button
                  onClick={handleLogout}
                  className="w-full text-neutral-600 hover:text-black py-3 rounded-lg transition-colors font-medium text-sm"
                >
                  Log Out Now
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
