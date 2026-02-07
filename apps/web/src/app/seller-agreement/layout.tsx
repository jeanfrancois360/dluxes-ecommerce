import { Metadata } from 'next';
import { sellerAgreementMetadata } from '@/lib/metadata';

export const metadata: Metadata = sellerAgreementMetadata;

export default function SellerAgreementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
