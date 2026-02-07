import { Metadata } from 'next';
import { storesMetadata } from '@/lib/metadata';
import { PageLayout } from '@/components/layout/page-layout';

export const metadata: Metadata = storesMetadata;

export default function StoresLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
