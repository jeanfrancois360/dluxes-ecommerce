import { Metadata } from 'next';
import { sellerDashboardMetadata } from '@/lib/metadata';
import { PageLayout } from '@/components/layout/page-layout';

export const metadata: Metadata = sellerDashboardMetadata;

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
