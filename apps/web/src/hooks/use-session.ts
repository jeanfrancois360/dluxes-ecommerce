'use client';

/**
 * useSession Hook
 *
 * Custom hook for session management and monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import {
  startSessionTimer,
  resetSessionTimer,
  clearSessionTimer,
  isTokenExpired,
} from '@/lib/auth-utils';

/**
 * Session data interface
 */
interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  isCurrent: boolean;
  createdAt: string;
  lastActiveAt: string;
}

/**
 * Hook for session management
 *
 * @returns Session management methods and state
 *
 * @example
 * ```tsx
 * function SessionsPage() {
 *   const {
 *     sessions,
 *     isLoading,
 *     fetchSessions,
 *     revokeSession,
 *     revokeAllOtherSessions,
 *     isSessionExpired,
 *   } = useSession();
 *
 *   useEffect(() => {
 *     fetchSessions();
 *   }, [fetchSessions]);
 *
 *   return (
 *     <div>
 *       {sessions.map(session => (
 *         <div key={session.id}>
 *           <p>{session.device} - {session.location}</p>
 *           {!session.isCurrent && (
 *             <button onClick={() => revokeSession(session.id)}>
 *               Revoke
 *             </button>
 *           )}
 *         </div>
 *       ))}
 *       <button onClick={revokeAllOtherSessions}>
 *         Revoke All Other Sessions
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSession() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    getSessions,
    revokeSession: revokeSessionApi,
    revokeAllSessions: revokeAllSessionsApi,
    logout,
  } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // ============================================================================
  // Check Session Expiry
  // ============================================================================

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkExpiry = () => {
      const expired = isTokenExpired();
      setIsSessionExpired(expired);

      if (expired) {
        logout();
      }
    };

    // Check immediately
    checkExpiry();

    // Check every minute
    const interval = setInterval(checkExpiry, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  // ============================================================================
  // Fetch Sessions
  // ============================================================================

  const fetchSessions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      const sessionsData = await getSessions();
      setSessions(sessionsData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch sessions';
      setError(errorMessage);
      console.error('Error fetching sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getSessions]);

  // ============================================================================
  // Revoke Session
  // ============================================================================

  const revokeSession = useCallback(
    async (sessionId: string) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        await revokeSessionApi(sessionId);

        // Remove session from local state
        setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to revoke session';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, revokeSessionApi]
  );

  // ============================================================================
  // Revoke All Other Sessions
  // ============================================================================

  const revokeAllOtherSessions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      await revokeAllSessionsApi();

      // Keep only current session in local state
      setSessions((prev) => prev.filter((session) => session.isCurrent));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to revoke sessions';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, revokeAllSessionsApi]);

  // ============================================================================
  // Session Activity Tracking
  // ============================================================================

  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    const updateActivity = () => {
      setLastActivity(new Date());
    };

    // Track user activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [isAuthenticated]);

  // ============================================================================
  // Session Timer Management
  // ============================================================================

  const startTimer = useCallback(
    (onTimeout: () => void, duration?: number) => {
      startSessionTimer(onTimeout, duration);
    },
    []
  );

  const resetTimer = useCallback(
    (onTimeout: () => void, duration?: number) => {
      resetSessionTimer(onTimeout, duration);
    },
    []
  );

  const clearTimer = useCallback(() => {
    clearSessionTimer();
  }, []);

  // ============================================================================
  // Session Statistics
  // ============================================================================

  const sessionStats = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(
      (s) => new Date(s.lastActiveAt) > new Date(Date.now() - 30 * 60 * 1000)
    ).length,
    otherSessions: sessions.filter((s) => !s.isCurrent).length,
    currentSession: sessions.find((s) => s.isCurrent),
  };

  // ============================================================================
  // Get Session by Device Type
  // ============================================================================

  const getSessionsByDevice = useCallback(
    (deviceType: 'mobile' | 'tablet' | 'desktop') => {
      return sessions.filter((session) => {
        const device = session.device.toLowerCase();
        switch (deviceType) {
          case 'mobile':
            return device.includes('mobile') || device.includes('phone');
          case 'tablet':
            return device.includes('tablet') || device.includes('ipad');
          case 'desktop':
            return !device.includes('mobile') && !device.includes('tablet');
          default:
            return false;
        }
      });
    },
    [sessions]
  );

  // ============================================================================
  // Get Session by Browser
  // ============================================================================

  const getSessionsByBrowser = useCallback(
    (browser: string) => {
      return sessions.filter((session) =>
        session.browser.toLowerCase().includes(browser.toLowerCase())
      );
    },
    [sessions]
  );

  // ============================================================================
  // Format Session Duration
  // ============================================================================

  const getSessionDuration = useCallback((session: Session): string => {
    const created = new Date(session.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  // ============================================================================
  // Format Last Active Time
  // ============================================================================

  const getLastActiveTime = useCallback((session: Session): string => {
    const lastActive = new Date(session.lastActiveAt);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }, []);

  // ============================================================================
  // Clear Error
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Session data
    sessions,
    sessionStats,
    lastActivity,

    // Loading and error state
    isLoading: isLoading || authLoading,
    error,
    isSessionExpired,

    // Session operations
    fetchSessions,
    revokeSession,
    revokeAllOtherSessions,

    // Session timer management
    startTimer,
    resetTimer,
    clearTimer,

    // Session queries
    getSessionsByDevice,
    getSessionsByBrowser,

    // Session formatting
    getSessionDuration,
    getLastActiveTime,

    // Utility
    clearError,
  };
}
