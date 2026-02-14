'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const SellerLayout = dynamic(() => import('./seller-layout'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  ),
});

export default function SellerLayoutWrapper({ children }: { children: ReactNode }) {
  return <SellerLayout>{children}</SellerLayout>;
}
