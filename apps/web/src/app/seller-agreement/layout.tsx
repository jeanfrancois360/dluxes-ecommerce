import { Metadata } from 'next';
import { sellerAgreementMetadata } from '@/lib/metadata';
import { PageLayout } from '@/components/layout/page-layout';

export const metadata: Metadata = sellerAgreementMetadata;

export default function SellerAgreementLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
