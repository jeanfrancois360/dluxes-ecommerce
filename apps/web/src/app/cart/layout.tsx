import { Metadata } from 'next';
import { cartMetadata } from '@/lib/metadata';

export const metadata: Metadata = cartMetadata;

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
