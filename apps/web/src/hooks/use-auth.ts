'use client';

/**
 * useAuth Hook
 *
 * Custom hook to access authentication context
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';

/**
 * Hook to access authentication context
 *
 * @throws Error if used outside AuthProvider
 * @returns Authentication context value
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, login, logout } = useAuth();
 *
 *   return (
 *     <div>
 *       {user ? (
 *         <>
 *           <p>Welcome, {user.fullName}!</p>
 *           <button onClick={logout}>Logout</button>
 *         </>
 *       ) : (
 *         <button onClick={() => login({ email, password })}>Login</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
