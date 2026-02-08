'use client';

/**
 * Admin Layout Component (Legacy - Backward Compatibility)
 *
 * This component is now a pass-through wrapper for backward compatibility.
 * The unified admin layout is applied at the route level in /app/admin/layout.tsx
 *
 * Pages that still import and use this component will work correctly
 * without double-wrapping, as this simply returns children.
 *
 * Migration: Individual pages can gradually remove this wrapper as it's no longer needed.
 */

import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Legacy AdminLayout - now a simple pass-through component
 * The actual layout is applied at /app/admin/layout.tsx using UnifiedAdminLayout
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  return <>{children}</>;
}

// Default export for compatibility
export default AdminLayout;
