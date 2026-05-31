import { Metadata } from 'next';
import { blogMetadata } from '@/lib/metadata';

export const metadata: Metadata = blogMetadata;

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
