import { Metadata } from 'next';
import { verifyEmailMetadata } from '@/lib/metadata';

export const metadata: Metadata = verifyEmailMetadata;

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
