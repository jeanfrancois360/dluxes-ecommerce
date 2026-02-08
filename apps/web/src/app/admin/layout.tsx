import { Metadata } from 'next';
import { adminDashboardMetadata } from '@/lib/metadata';
import UnifiedAdminLayout from '@/components/admin/unified-admin-layout';

export const metadata: Metadata = adminDashboardMetadata;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <UnifiedAdminLayout>{children}</UnifiedAdminLayout>;
}
