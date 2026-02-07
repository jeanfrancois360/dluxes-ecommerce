import { Metadata } from 'next';
import { sellerDashboardMetadata } from '@/lib/metadata';

export const metadata: Metadata = sellerDashboardMetadata;

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
