import { Metadata } from 'next';
import { adminDashboardMetadata } from '@/lib/metadata';

export const metadata: Metadata = adminDashboardMetadata;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
