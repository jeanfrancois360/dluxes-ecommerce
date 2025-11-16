import { Metadata } from 'next';
import { profileMetadata } from '@/lib/metadata';

export const metadata: Metadata = profileMetadata;

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
