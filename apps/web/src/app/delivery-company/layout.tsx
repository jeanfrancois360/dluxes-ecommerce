import { Metadata } from 'next';
import { deliveryCompanyMetadata } from '@/lib/metadata';

export const metadata: Metadata = deliveryCompanyMetadata;

export default function DeliveryCompanyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
