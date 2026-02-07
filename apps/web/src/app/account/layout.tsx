import { Metadata } from 'next';
import { accountMetadata } from '@/lib/metadata';
import BuyerLayout from '@/components/buyer/buyer-layout';

export const metadata: Metadata = accountMetadata;

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <BuyerLayout>{children}</BuyerLayout>;
}
