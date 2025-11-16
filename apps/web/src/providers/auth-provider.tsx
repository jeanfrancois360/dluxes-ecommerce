'use client';

/**
 * Auth Provider
 *
 * Wrapper component that provides authentication context to the application
 */

import React from 'react';
import { AuthProvider as AuthContextProvider } from '@/contexts/auth-context';

export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 *
 * Wraps the application with authentication context
 *
 * @example
 * ```tsx
 * // In app/layout.tsx or root layout
 * import { AuthProvider } from '@/providers/auth-provider';
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
