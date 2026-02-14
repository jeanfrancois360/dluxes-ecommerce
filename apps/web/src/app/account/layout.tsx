import { Metadata } from 'next';
import { accountMetadata } from '@/lib/metadata';
import BuyerLayoutWrapper from '@/components/buyer/buyer-layout-wrapper';

export const metadata: Metadata = accountMetadata;

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <BuyerLayoutWrapper>{children}</BuyerLayoutWrapper>;
}
