import { Metadata } from 'next';
import { magicLinkMetadata } from '@/lib/metadata';

export const metadata: Metadata = magicLinkMetadata;

export default function MagicLinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
