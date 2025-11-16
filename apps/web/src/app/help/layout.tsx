import { Metadata } from 'next';
import { helpMetadata } from '@/lib/metadata';

export const metadata: Metadata = helpMetadata;

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
