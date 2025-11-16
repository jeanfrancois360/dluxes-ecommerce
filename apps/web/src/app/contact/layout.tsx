import { Metadata } from 'next';
import { contactMetadata } from '@/lib/metadata';

export const metadata: Metadata = contactMetadata;

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
