import { Metadata } from 'next';
import { adminDashboardMetadata } from '@/lib/metadata';
import AdminLayoutWrapper from '@/components/admin/admin-layout-wrapper';

export const metadata: Metadata = adminDashboardMetadata;

// Force dynamic rendering to ensure middleware protection runs on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
