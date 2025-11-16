import { Metadata } from 'next';
import { privacyMetadata } from '@/lib/metadata';

export const metadata: Metadata = privacyMetadata;

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
