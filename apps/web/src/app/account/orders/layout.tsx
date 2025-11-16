import { Metadata } from 'next';
import { ordersMetadata } from '@/lib/metadata';

export const metadata: Metadata = ordersMetadata;

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
