import { Metadata } from 'next';
import { affiliateMetadata } from '@/lib/metadata';

export const metadata: Metadata = affiliateMetadata;

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
