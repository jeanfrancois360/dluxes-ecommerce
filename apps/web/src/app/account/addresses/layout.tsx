import { Metadata } from 'next';
import { addressesMetadata } from '@/lib/metadata';

export const metadata: Metadata = addressesMetadata;

export default function AddressesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
