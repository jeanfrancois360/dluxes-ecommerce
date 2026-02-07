import { Metadata } from 'next';
import { sellerDashboardMetadata } from '@/lib/metadata';
import SellerLayout from '@/components/seller/seller-layout';

export const metadata: Metadata = sellerDashboardMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SellerLayout>{children}</SellerLayout>;
}
