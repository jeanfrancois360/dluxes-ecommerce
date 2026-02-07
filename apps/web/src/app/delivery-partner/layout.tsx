import { Metadata } from 'next';
import { deliveryPartnerMetadata } from '@/lib/metadata';
import { PageLayout } from '@/components/layout/page-layout';

export const metadata: Metadata = deliveryPartnerMetadata;

export default function DeliveryPartnerLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
