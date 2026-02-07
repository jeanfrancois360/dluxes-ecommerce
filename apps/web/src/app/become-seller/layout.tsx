import { Metadata } from 'next';
import { becomeSellerMetadata } from '@/lib/metadata';

export const metadata: Metadata = becomeSellerMetadata;

export default function BecomeSellerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
