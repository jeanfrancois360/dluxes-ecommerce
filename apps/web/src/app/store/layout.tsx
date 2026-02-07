import { Metadata } from 'next';
import { PageLayout } from '@/components/layout/page-layout';

// Store pages are dynamic, so metadata will be set in individual pages
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
