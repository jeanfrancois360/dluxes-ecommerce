import { Metadata } from 'next';
import { storesMetadata } from '@/lib/metadata';

export const metadata: Metadata = storesMetadata;

export default function StoresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
