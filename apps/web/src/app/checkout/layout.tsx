import { Metadata } from 'next';
import { checkoutMetadata } from '@/lib/metadata';

export const metadata: Metadata = checkoutMetadata;

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
