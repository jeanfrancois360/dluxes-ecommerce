import { Metadata } from 'next';
import { accountMetadata } from '@/lib/metadata';

export const metadata: Metadata = accountMetadata;

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
