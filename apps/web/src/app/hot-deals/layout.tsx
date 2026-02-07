import { Metadata } from 'next';
import { hotDealsMetadata } from '@/lib/metadata';

export const metadata: Metadata = hotDealsMetadata;

export default function HotDealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
