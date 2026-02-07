import { Metadata } from 'next';
import { hotDealsMetadata } from '@/lib/metadata';
import { PageLayout } from '@/components/layout/page-layout';

export const metadata: Metadata = hotDealsMetadata;

export default function HotDealsLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
