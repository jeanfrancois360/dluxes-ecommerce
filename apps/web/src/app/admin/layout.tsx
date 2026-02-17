import { Metadata } from 'next';
import { adminDashboardMetadata } from '@/lib/metadata';
import AdminLayoutWrapper from '@/components/admin/admin-layout-wrapper';

export const metadata: Metadata = adminDashboardMetadata;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
