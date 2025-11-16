import { Metadata } from 'next';
import { checkoutSuccessMetadata } from '@/lib/metadata';

export const metadata: Metadata = checkoutSuccessMetadata;

export default function CheckoutSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
