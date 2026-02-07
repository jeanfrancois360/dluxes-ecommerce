import { Metadata } from 'next';
import { dashboardMetadata } from '@/lib/metadata';
import { PageLayout } from '@/components/layout/page-layout';

export const metadata: Metadata = dashboardMetadata;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
