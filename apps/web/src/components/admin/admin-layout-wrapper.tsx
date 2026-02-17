'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const UnifiedAdminLayout = dynamic(() => import('./unified-admin-layout'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  ),
});

export default function AdminLayoutWrapper({ children }: { children: ReactNode }) {
  return <UnifiedAdminLayout>{children}</UnifiedAdminLayout>;
}
