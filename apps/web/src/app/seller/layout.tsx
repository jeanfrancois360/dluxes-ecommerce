import { Metadata } from 'next';
import { sellerDashboardMetadata } from '@/lib/metadata';
import SellerLayoutWrapper from '@/components/seller/seller-layout-wrapper';

export const metadata: Metadata = sellerDashboardMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SellerLayoutWrapper>{children}</SellerLayoutWrapper>;
}
