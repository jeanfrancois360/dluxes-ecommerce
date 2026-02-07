import { Metadata } from 'next';
import { authMetadata } from '@/lib/metadata';

export const metadata: Metadata = authMetadata;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
