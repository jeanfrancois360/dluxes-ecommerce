import { Metadata } from 'next';
import { trackOrderMetadata } from '@/lib/metadata';
import { PageLayout } from '@/components/layout/page-layout';

export const metadata: Metadata = trackOrderMetadata;

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
