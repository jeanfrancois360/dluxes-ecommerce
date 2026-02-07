import { Metadata } from 'next';
import { deliveryPartnerMetadata } from '@/lib/metadata';

export const metadata: Metadata = deliveryPartnerMetadata;

export default function DeliveryPartnerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
