'use client';

/**
 * Cart Provider
 *
 * Wrapper component that provides cart context to the application
 */

import React from 'react';
import { CartProvider as CartContextProvider } from '@/contexts/cart-context';

export interface CartProviderProps {
  children: React.ReactNode;
}

/**
 * Cart Provider Component
 *
 * Wraps the application with cart context
 *
 * @example
 * ```tsx
 * // In app/layout.tsx or root layout
 * import { CartProvider } from '@/providers/cart-provider';
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         <CartProvider>
 *           {children}
 *         </CartProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function CartProvider({ children }: CartProviderProps) {
  return <CartContextProvider>{children}</CartContextProvider>;
}
