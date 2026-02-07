import { Metadata } from 'next';
import { deliveryCompanyMetadata } from '@/lib/metadata';
import { PageLayout } from '@/components/layout/page-layout';

export const metadata: Metadata = deliveryCompanyMetadata;

export default function DeliveryCompanyLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
